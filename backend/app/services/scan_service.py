import time
from pathlib import Path
from typing import List, Optional, Set
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.models.entities import Workspace, DocumentFile, Scan, ScanIssue
from backend.app.rules.base import DocumentContext, RuleFinding
from backend.app.rules.registry import get_registered_rules
from backend.app.services.scoring_service import compute_quality_score
from backend.app.schemas.schemas import ScanRunRequest, DashboardMetrics, ScanSummaryResponse, ScanIssueResponse

class ScanService:
    @staticmethod
    def run_scan(db: Session, workspace_id: str, req: Optional[ScanRunRequest] = None) -> Scan:
        ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
        if not ws:
            raise ValueError("Workspace not found")

        start_time = time.perf_counter()

        # Load all document files from DB
        doc_files = db.query(DocumentFile).filter(DocumentFile.workspace_id == workspace_id).all()
        all_workspace_files: Set[str] = {f.path for f in doc_files}

        # Filter markdown documents
        markdown_files = [
            f for f in doc_files
            if f.extension in {".md", ".markdown", ".mdx"}
        ]

        # Active rules
        requested_rule_ids = req.rules if req and req.rules else None
        rules = get_registered_rules(requested_rule_ids)

        all_findings: List[RuleFinding] = []
        root_dir = Path(ws.root_path)

        scan_config = {}
        if req:
            if req.custom_glossary:
                scan_config["custom_glossary"] = req.custom_glossary
            if req.required_sections:
                scan_config["required_sections"] = req.required_sections

        for doc_file in markdown_files:
            file_abs_path = root_dir / doc_file.path
            if not file_abs_path.exists():
                continue

            try:
                raw_content = file_abs_path.read_text(encoding="utf-8", errors="ignore")
                lines = raw_content.splitlines()
            except Exception:
                continue

            ctx = DocumentContext(
                file_path=doc_file.path,
                raw_content=raw_content,
                lines=lines,
                all_workspace_files=all_workspace_files,
                config=scan_config
            )

            for rule in rules:
                try:
                    findings = rule.validate(ctx)
                    all_findings.extend(findings)
                except Exception as ex:
                    # Defensive: rule failure does not crash scan
                    print(f"Error running rule {rule.rule_id} on {doc_file.path}: {ex}")

        elapsed_ms = int((time.perf_counter() - start_time) * 1000)

        # Compute deterministic quality scores
        scores = compute_quality_score(all_findings, total_files=len(markdown_files))

        # Create scan entity
        scan = Scan(
            workspace_id=workspace_id,
            status="completed",
            total_score=scores["total_score"],
            grade=scores["grade"],
            structure_score=scores["structure_score"],
            links_score=scores["links_score"],
            style_score=scores["style_score"],
            error_count=scores["error_count"],
            warning_count=scores["warning_count"],
            info_count=scores["info_count"],
            total_files_scanned=len(markdown_files),
            duration_ms=elapsed_ms,
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)

        # Persist findings
        issue_records = []
        for finding in all_findings:
            issue = ScanIssue(
                scan_id=scan.id,
                workspace_id=workspace_id,
                rule_id=finding.rule_id,
                rule_name=finding.rule_name,
                category=finding.category,
                severity=finding.severity,
                file_path=finding.file_path,
                line_number=finding.line_number,
                message=finding.message,
                snippet=finding.snippet,
                suggested_fix=finding.suggested_fix,
            )
            issue_records.append(issue)

        if issue_records:
            db.bulk_save_objects(issue_records)
            db.commit()

        db.refresh(scan)
        return scan

    @staticmethod
    def get_scan(db: Session, scan_id: str) -> Optional[Scan]:
        return db.query(Scan).filter(Scan.id == scan_id).first()

    @staticmethod
    def list_scans(db: Session, workspace_id: str) -> List[Scan]:
        return (
            db.query(Scan)
            .filter(Scan.workspace_id == workspace_id)
            .order_by(desc(Scan.created_at))
            .all()
        )

    @staticmethod
    def get_dashboard_metrics(db: Session, workspace_id: Optional[str] = None) -> DashboardMetrics:
        if not workspace_id:
            # Pick first or most recently used workspace
            ws = db.query(Workspace).order_by(desc(Workspace.created_at)).first()
            if not ws:
                return DashboardMetrics()
            workspace_id = ws.id
        else:
            ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
            if not ws:
                return DashboardMetrics()

        doc_files = db.query(DocumentFile).filter(DocumentFile.workspace_id == workspace_id).all()
        total_files = len(doc_files)
        total_words = sum(f.word_count for f in doc_files)

        latest_scan = (
            db.query(Scan)
            .filter(Scan.workspace_id == workspace_id)
            .order_by(desc(Scan.created_at))
            .first()
        )

        recent_scans = (
            db.query(Scan)
            .filter(Scan.workspace_id == workspace_id)
            .order_by(desc(Scan.created_at))
            .limit(5)
            .all()
        )

        top_issues = []
        if latest_scan:
            from sqlalchemy import case
            severity_order = case(
                (ScanIssue.severity == 'error', 1),
                (ScanIssue.severity == 'warning', 2),
                (ScanIssue.severity == 'info', 3),
                else_=4
            )
            impact_order = case(
                (ScanIssue.category == 'links', 1),
                (ScanIssue.category == 'assets', 2),
                (ScanIssue.category == 'structure', 3),
                (ScanIssue.category == 'accessibility', 4),
                (ScanIssue.category == 'style', 5),
                else_=6
            )
            top_issues = (
                db.query(ScanIssue)
                .filter(ScanIssue.scan_id == latest_scan.id)
                .order_by(severity_order.asc(), impact_order.asc(), ScanIssue.rule_id.asc())
                .limit(10)
                .all()
            )

        return DashboardMetrics(
            workspace_id=ws.id,
            workspace_name=ws.name,
            is_sample=bool(ws.is_sample),
            total_files=total_files,
            total_words=total_words,
            current_score=latest_scan.total_score if latest_scan else None,
            current_grade=latest_scan.grade if latest_scan else None,
            error_count=latest_scan.error_count if latest_scan else 0,
            warning_count=latest_scan.warning_count if latest_scan else 0,
            info_count=latest_scan.info_count if latest_scan else 0,
            total_issues=(latest_scan.error_count + latest_scan.warning_count + latest_scan.info_count) if latest_scan else 0,
            structure_score=latest_scan.structure_score if latest_scan else None,
            links_score=latest_scan.links_score if latest_scan else None,
            style_score=latest_scan.style_score if latest_scan else None,
            recent_scans=[ScanSummaryResponse.model_validate(s) for s in recent_scans],
            top_issues=[ScanIssueResponse.model_validate(i) for i in top_issues],
        )

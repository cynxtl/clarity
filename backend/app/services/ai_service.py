import hashlib
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.config import settings
from backend.app.models.entities import Workspace, DocumentFile, AIRevision
from backend.app.schemas.ai import (
    AIStatusResponse,
    RewriteRequest,
    SimplifyRequest,
    ProcedureRequest,
    DocsGeneratorRequest,
    ReleaseNotesRequest,
    AIRevisionResponse,
    QualityImpactComparison,
    FindingSummary,
    AcceptRevisionRequest,
    AcceptRevisionResponse,
)
from backend.app.core.ai_provider import (
    get_ai_provider,
    BaseAIProvider,
    AIException,
    AIConfigurationError,
    AIAuthenticationError,
    AIRateLimitError,
    AITimeoutError,
    AIProviderError,
    AIValidationError,
)
from backend.app.core.ai_prompts import (
    build_rewrite_prompt,
    build_simplify_prompt,
    build_procedure_prompt,
    build_docs_prompt,
    build_release_notes_prompt,
)
from backend.app.rules.base import DocumentContext, RuleFinding
from backend.app.rules.registry import ALL_RULES
from backend.app.rules.style import DEFAULT_GLOSSARY_RULES
from backend.app.services.scoring_service import compute_quality_score
from backend.app.services.workspace_service import WorkspaceService

logger = logging.getLogger(__name__)

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

def compute_text_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def scan_text_content(
    file_path: str,
    raw_content: str,
    all_workspace_files: set[str],
    config: Optional[Dict[str, Any]] = None
) -> Tuple[List[RuleFinding], Dict[str, Any]]:
    """Execute all 12 deterministic rules on a text string and compute score."""
    lines = raw_content.splitlines()
    ctx = DocumentContext(
        file_path=file_path,
        raw_content=raw_content,
        lines=lines,
        all_workspace_files=all_workspace_files,
        config=config or {}
    )

    findings: List[RuleFinding] = []
    for rule in ALL_RULES:
        try:
            res = rule.validate(ctx)
            findings.extend(res)
        except Exception as exc:
            logger.warning("Rule %s failed during evaluation: %s", getattr(rule, 'rule_id', 'unknown'), exc)

    score_dict = compute_quality_score(findings, total_files=1)
    return findings, score_dict

def compare_quality_impact(
    file_path: str,
    original_full_text: str,
    updated_full_text: str,
    all_workspace_files: set[str],
    config: Optional[Dict[str, Any]] = None
) -> QualityImpactComparison:
    """Compare deterministic findings and scores between before and after text."""
    findings_before, score_before = scan_text_content(file_path, original_full_text, all_workspace_files, config)
    findings_after, score_after = scan_text_content(file_path, updated_full_text, all_workspace_files, config)

    # Convert to comparable signatures: (rule_id, snippet or message)
    def make_key(f: RuleFinding) -> str:
        return f"{f.rule_id}::{f.message}::{f.line_number or 0}"

    before_map = {make_key(f): f for f in findings_before}
    after_map = {make_key(f): f for f in findings_after}

    resolved_keys = set(before_map.keys()) - set(after_map.keys())
    new_keys = set(after_map.keys()) - set(before_map.keys())

    resolved_summaries = [
        FindingSummary(
            rule_id=before_map[k].rule_id,
            rule_name=before_map[k].rule_name,
            severity=before_map[k].severity,
            category=before_map[k].category,
            line_number=before_map[k].line_number,
            message=before_map[k].message,
        )
        for k in resolved_keys
    ]

    new_summaries = [
        FindingSummary(
            rule_id=after_map[k].rule_id,
            rule_name=after_map[k].rule_name,
            severity=after_map[k].severity,
            category=after_map[k].category,
            line_number=after_map[k].line_number,
            message=after_map[k].message,
        )
        for k in new_keys
    ]

    s_before = score_before.get("total_score", 100.0)
    s_after = score_after.get("total_score", 100.0)

    return QualityImpactComparison(
        score_before=s_before,
        score_after=s_after,
        score_delta=round(s_after - s_before, 1),
        grade_before=score_before["grade"],
        grade_after=score_after["grade"],
        findings_count_before=len(findings_before),
        findings_count_after=len(findings_after),
        resolved_findings_count=len(resolved_summaries),
        new_findings_count=len(new_summaries),
        resolved_findings=resolved_summaries,
        new_findings=new_summaries,
    )

class AIService:
    @staticmethod
    def get_status() -> AIStatusResponse:
        provider = get_ai_provider()
        status_info = provider.get_status()
        return AIStatusResponse(
            configured=status_info.get("configured", False),
            provider=status_info.get("provider", "openai_compatible"),
            model=status_info.get("model", settings.AI_MODEL),
            base_url=status_info.get("base_url", settings.AI_BASE_URL),
            temperature=status_info.get("temperature", settings.AI_TEMPERATURE),
            timeout_seconds=status_info.get("timeout_seconds", settings.AI_TIMEOUT_SECONDS),
            message=status_info.get("message", "")
        )

    @staticmethod
    def _get_workspace_files_set(db: Session, workspace_id: str) -> set[str]:
        files = db.query(DocumentFile.path).filter(DocumentFile.workspace_id == workspace_id).all()
        return {f[0] for f in files}

    @staticmethod
    def _get_style_glossary(use_glossary: bool = True) -> Dict[str, str]:
        if not use_glossary:
            return {}
        # Convert DEFAULT_GLOSSARY_RULES regex mapping to clean dictionary
        glossary: Dict[str, str] = {}
        for pattern, (preferred, _) in DEFAULT_GLOSSARY_RULES.items():
            clean_term = pattern.replace(r'\b', '').replace('\\', '')
            glossary[clean_term] = preferred
        return glossary

    @staticmethod
    def _validate_input_length(text: str) -> None:
        if not text or not text.strip():
            raise HTTPException(status_code=400, detail="Document input text cannot be empty.")
        if len(text) > settings.AI_MAX_INPUT_CHARS:
            raise HTTPException(
                status_code=413,
                detail=f"Input text length ({len(text)} chars) exceeds maximum allowed limit ({settings.AI_MAX_INPUT_CHARS} chars)."
            )

    @staticmethod
    def _execute_provider(provider: BaseAIProvider, sys_prompt: str, user_prompt: str) -> Any:
        try:
            return provider.generate_structured(sys_prompt, user_prompt)
        except AIConfigurationError as e:
            raise HTTPException(status_code=e.status_code, detail=e.message)
        except AIAuthenticationError as e:
            raise HTTPException(status_code=e.status_code, detail=e.message)
        except AIRateLimitError as e:
            raise HTTPException(status_code=e.status_code, detail=e.message)
        except AITimeoutError as e:
            raise HTTPException(status_code=e.status_code, detail=e.message)
        except (AIProviderError, AIValidationError) as e:
            raise HTTPException(status_code=e.status_code, detail=e.message)
        except Exception as e:
            logger.error("Unexpected provider error: %s", str(e))
            raise HTTPException(status_code=500, detail="Internal AI service error.")

    # -------------------------------------------------------------
    # OPERATION 1: REWRITE FOR CLARITY
    # -------------------------------------------------------------
    @classmethod
    def rewrite_text(cls, db: Session, req: RewriteRequest) -> AIRevisionResponse:
        cls._validate_input_length(req.selected_text)
        provider = get_ai_provider()
        glossary = cls._get_style_glossary(req.use_glossary)

        sys_prompt, user_prompt = build_rewrite_prompt(
            selected_text=req.selected_text,
            document_title=req.document_title,
            tone=req.tone,
            custom_instruction=req.custom_instruction,
            glossary=glossary
        )

        output = cls._execute_provider(provider, sys_prompt, user_prompt)

        # Compute provisional quality impact
        all_ws_files = cls._get_workspace_files_set(db, req.workspace_id)
        original_full = req.full_content or req.selected_text
        if req.full_content and req.selected_text in req.full_content:
            proposed_full = req.full_content.replace(req.selected_text, output.content, 1)
        else:
            proposed_full = output.content

        impact = compare_quality_impact(req.file_path, original_full, proposed_full, all_ws_files)

        revision = AIRevision(
            workspace_id=req.workspace_id,
            file_path=req.file_path,
            operation_type="rewrite",
            tone=req.tone,
            custom_instruction=req.custom_instruction,
            original_text=req.selected_text,
            proposed_text=output.content,
            explanation=output.explanation,
            warnings_json=json.dumps(output.warnings),
            meaning_changes_json=json.dumps(output.meaning_sensitive_changes),
            original_hash=compute_text_hash(original_full),
            status="pending",
            quality_impact_json=json.dumps(impact.model_dump())
        )
        db.add(revision)
        db.commit()
        db.refresh(revision)

        return cls._to_revision_response(revision, impact)

    # -------------------------------------------------------------
    # OPERATION 2: SIMPLIFY TECHNICAL CONTENT
    # -------------------------------------------------------------
    @classmethod
    def simplify_text(cls, db: Session, req: SimplifyRequest) -> AIRevisionResponse:
        cls._validate_input_length(req.selected_text)
        provider = get_ai_provider()
        glossary = cls._get_style_glossary(req.use_glossary)

        sys_prompt, user_prompt = build_simplify_prompt(
            selected_text=req.selected_text,
            audience=req.audience,
            custom_instruction=req.custom_instruction,
            glossary=glossary
        )

        output = cls._execute_provider(provider, sys_prompt, user_prompt)
        all_ws_files = cls._get_workspace_files_set(db, req.workspace_id)
        impact = compare_quality_impact(req.file_path, req.selected_text, output.content, all_ws_files)

        revision = AIRevision(
            workspace_id=req.workspace_id,
            file_path=req.file_path,
            operation_type="simplify",
            audience=req.audience,
            custom_instruction=req.custom_instruction,
            original_text=req.selected_text,
            proposed_text=output.content,
            explanation=output.explanation,
            warnings_json=json.dumps(output.warnings),
            meaning_changes_json=json.dumps(output.meaning_sensitive_changes),
            original_hash=compute_text_hash(req.selected_text),
            status="pending",
            quality_impact_json=json.dumps(impact.model_dump())
        )
        db.add(revision)
        db.commit()
        db.refresh(revision)

        return cls._to_revision_response(revision, impact)

    # -------------------------------------------------------------
    # OPERATION 3: PROCEDURE GENERATOR
    # -------------------------------------------------------------
    @classmethod
    def generate_procedure(cls, db: Session, req: ProcedureRequest) -> AIRevisionResponse:
        cls._validate_input_length(req.task_description)
        provider = get_ai_provider()
        glossary = cls._get_style_glossary(req.use_glossary)

        sys_prompt, user_prompt = build_procedure_prompt(
            task_description=req.task_description,
            prerequisites=req.prerequisites,
            source_notes=req.source_notes,
            expected_outcome=req.expected_outcome,
            warnings=req.warnings,
            tone=req.tone,
            glossary=glossary
        )

        output = cls._execute_provider(provider, sys_prompt, user_prompt)
        all_ws_files = cls._get_workspace_files_set(db, req.workspace_id)
        impact = compare_quality_impact(req.file_path, "", output.content, all_ws_files)

        revision = AIRevision(
            workspace_id=req.workspace_id,
            file_path=req.file_path,
            operation_type="procedure",
            tone=req.tone,
            original_text="",
            proposed_text=output.content,
            explanation=output.explanation,
            warnings_json=json.dumps(output.warnings),
            meaning_changes_json=json.dumps(output.meaning_sensitive_changes),
            original_hash=compute_text_hash(""),
            status="pending",
            quality_impact_json=json.dumps(impact.model_dump())
        )
        db.add(revision)
        db.commit()
        db.refresh(revision)

        return cls._to_revision_response(revision, impact)

    # -------------------------------------------------------------
    # OPERATION 4: DOCUMENTATION GENERATOR
    # -------------------------------------------------------------
    @classmethod
    def generate_docs(cls, db: Session, req: DocsGeneratorRequest) -> AIRevisionResponse:
        cls._validate_input_length(req.feature_brief)
        provider = get_ai_provider()
        glossary = cls._get_style_glossary(req.use_glossary)

        sys_prompt, user_prompt = build_docs_prompt(
            doc_type=req.doc_type,
            feature_brief=req.feature_brief,
            code_examples=req.code_examples,
            technical_specs=req.technical_specs,
            tone=req.tone,
            glossary=glossary
        )

        output = cls._execute_provider(provider, sys_prompt, user_prompt)
        all_ws_files = cls._get_workspace_files_set(db, req.workspace_id)
        impact = compare_quality_impact(req.file_path, "", output.content, all_ws_files)

        revision = AIRevision(
            workspace_id=req.workspace_id,
            file_path=req.file_path,
            operation_type="docs",
            tone=req.tone,
            original_text="",
            proposed_text=output.content,
            explanation=output.explanation,
            warnings_json=json.dumps(output.warnings),
            meaning_changes_json=json.dumps(output.meaning_sensitive_changes),
            original_hash=compute_text_hash(""),
            status="pending",
            quality_impact_json=json.dumps(impact.model_dump())
        )
        db.add(revision)
        db.commit()
        db.refresh(revision)

        return cls._to_revision_response(revision, impact)

    # -------------------------------------------------------------
    # OPERATION 5: RELEASE NOTE GENERATOR
    # -------------------------------------------------------------
    @classmethod
    def generate_release_notes(cls, db: Session, req: ReleaseNotesRequest) -> AIRevisionResponse:
        cls._validate_input_length(req.version)
        provider = get_ai_provider()

        sys_prompt, user_prompt = build_release_notes_prompt(
            version=req.version,
            release_date=req.release_date,
            added=req.added,
            changed=req.changed,
            fixed=req.fixed,
            deprecated=req.deprecated,
            removed=req.removed,
            tone=req.tone
        )

        output = cls._execute_provider(provider, sys_prompt, user_prompt)
        all_ws_files = cls._get_workspace_files_set(db, req.workspace_id)
        impact = compare_quality_impact(req.file_path, "", output.content, all_ws_files)

        revision = AIRevision(
            workspace_id=req.workspace_id,
            file_path=req.file_path,
            operation_type="release_notes",
            tone=req.tone,
            original_text="",
            proposed_text=output.content,
            explanation=output.explanation,
            warnings_json=json.dumps(output.warnings),
            meaning_changes_json=json.dumps(output.meaning_sensitive_changes),
            original_hash=compute_text_hash(""),
            status="pending",
            quality_impact_json=json.dumps(impact.model_dump())
        )
        db.add(revision)
        db.commit()
        db.refresh(revision)

        return cls._to_revision_response(revision, impact)

    # -------------------------------------------------------------
    # REVISION REVIEW & LIFECYCLE
    # -------------------------------------------------------------
    @classmethod
    def list_revisions(cls, db: Session, workspace_id: str, limit: int = 30) -> List[AIRevisionResponse]:
        revs = db.query(AIRevision).filter(
            AIRevision.workspace_id == workspace_id
        ).order_by(AIRevision.created_at.desc()).limit(limit).all()

        return [cls._to_revision_response(r) for r in revs]

    @classmethod
    def get_revision(cls, db: Session, revision_id: str) -> AIRevisionResponse:
        rev = db.query(AIRevision).filter(AIRevision.id == revision_id).first()
        if not rev:
            raise HTTPException(status_code=404, detail="Revision not found.")
        return cls._to_revision_response(rev)

    @classmethod
    def accept_revision(cls, db: Session, revision_id: str, req: AcceptRevisionRequest) -> AcceptRevisionResponse:
        rev = db.query(AIRevision).filter(AIRevision.id == revision_id).first()
        if not rev:
            raise HTTPException(status_code=404, detail="Revision not found.")

        if rev.status != "pending":
            raise HTTPException(status_code=400, detail=f"Revision is already {rev.status}.")

        ws = db.query(Workspace).filter(Workspace.id == rev.workspace_id).first()
        if not ws:
            raise HTTPException(status_code=404, detail="Workspace not found.")

        # Read current document from disk
        file_data = WorkspaceService.get_file_content(db, rev.workspace_id, rev.file_path)
        current_disk_content = file_data.content

        # Stale Detection:
        # If client provided current_document_content, verify hash
        if req.current_document_content is not None and not req.force:
            current_client_hash = compute_text_hash(req.current_document_content)
            current_disk_hash = compute_text_hash(current_disk_content)
            if current_client_hash != current_disk_hash:
                raise HTTPException(
                    status_code=409,
                    detail="Document has been modified in another session since your proposal was generated. Use force=True to overwrite."
                )

        # Apply revision
        if rev.original_text and rev.original_text in current_disk_content:
            updated_content = current_disk_content.replace(rev.original_text, rev.proposed_text, 1)
        elif not rev.original_text:
            # Whole document or generated new file
            updated_content = rev.proposed_text
        elif req.force:
            # Forced overwrite
            updated_content = rev.proposed_text
        else:
            # The target original snippet was altered or missing from disk!
            raise HTTPException(
                status_code=409,
                detail="The original text snippet was modified or removed from the document after the AI proposal was generated. Review changes before overwriting."
            )

        # Save to disk and update SQLite index
        WorkspaceService.update_file_content(db, rev.workspace_id, rev.file_path, updated_content)

        # Run final deterministic scan comparison
        all_ws_files = cls._get_workspace_files_set(db, rev.workspace_id)
        impact = compare_quality_impact(rev.file_path, current_disk_content, updated_content, all_ws_files)

        # Update revision status
        rev.status = "accepted"
        rev.reviewed_at = utc_now()
        rev.quality_impact_json = json.dumps(impact.model_dump())
        db.commit()

        return AcceptRevisionResponse(
            revision_id=rev.id,
            status="accepted",
            quality_impact=impact,
            saved_file_path=rev.file_path,
            updated_content=updated_content
        )

    @classmethod
    def reject_revision(cls, db: Session, revision_id: str) -> AIRevisionResponse:
        rev = db.query(AIRevision).filter(AIRevision.id == revision_id).first()
        if not rev:
            raise HTTPException(status_code=404, detail="Revision not found.")

        if rev.status != "pending":
            raise HTTPException(status_code=400, detail=f"Revision is already {rev.status}.")

        rev.status = "rejected"
        rev.reviewed_at = utc_now()
        db.commit()
        db.refresh(rev)

        return cls._to_revision_response(rev)

    @staticmethod
    def _to_revision_response(rev: AIRevision, impact: Optional[QualityImpactComparison] = None) -> AIRevisionResponse:
        warnings = json.loads(rev.warnings_json) if rev.warnings_json else []
        meaning_changes = json.loads(rev.meaning_changes_json) if rev.meaning_changes_json else []

        quality_impact = impact
        if not quality_impact and rev.quality_impact_json:
            try:
                impact_dict = json.loads(rev.quality_impact_json)
                quality_impact = QualityImpactComparison(**impact_dict)
            except Exception:
                quality_impact = None

        return AIRevisionResponse(
            id=rev.id,
            workspace_id=rev.workspace_id,
            file_path=rev.file_path,
            operation_type=rev.operation_type,
            tone=rev.tone,
            audience=rev.audience,
            custom_instruction=rev.custom_instruction,
            original_text=rev.original_text,
            proposed_text=rev.proposed_text,
            explanation=rev.explanation,
            warnings=warnings,
            meaning_changes=meaning_changes,
            original_hash=rev.original_hash,
            status=rev.status,
            quality_impact=quality_impact,
            created_at=rev.created_at,
            reviewed_at=rev.reviewed_at
        )

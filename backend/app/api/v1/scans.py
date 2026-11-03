from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.schemas.schemas import ScanRunRequest, ScanSummaryResponse, ScanDetailResponse, ScanIssueResponse
from backend.app.models.entities import Scan, ScanIssue
from backend.app.services.scan_service import ScanService

router = APIRouter(tags=["Scans"])

@router.post("/workspaces/{workspace_id}/scans", response_model=ScanDetailResponse, status_code=status.HTTP_201_CREATED)
def trigger_scan(
    workspace_id: str,
    req: Optional[ScanRunRequest] = None,
    db: Session = Depends(get_db)
):
    try:
        scan = ScanService.run_scan(db, workspace_id, req)
        issues = db.query(ScanIssue).filter(ScanIssue.scan_id == scan.id).all()
        return ScanDetailResponse(
            id=scan.id,
            workspace_id=scan.workspace_id,
            status=scan.status,
            total_score=scan.total_score,
            grade=scan.grade,
            structure_score=scan.structure_score,
            links_score=scan.links_score,
            style_score=scan.style_score,
            error_count=scan.error_count,
            warning_count=scan.warning_count,
            info_count=scan.info_count,
            total_files_scanned=scan.total_files_scanned,
            duration_ms=scan.duration_ms,
            created_at=scan.created_at,
            issues=[ScanIssueResponse.model_validate(i) for i in issues]
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

@router.get("/workspaces/{workspace_id}/scans", response_model=List[ScanSummaryResponse])
def list_workspace_scans(workspace_id: str, db: Session = Depends(get_db)):
    scans = ScanService.list_scans(db, workspace_id)
    return [ScanSummaryResponse.model_validate(s) for s in scans]

@router.get("/scans/{scan_id}", response_model=ScanDetailResponse)
def get_scan_details(
    scan_id: str,
    severity: Optional[str] = Query(None, description="Filter by severity: error, warning, info"),
    rule_id: Optional[str] = Query(None, description="Filter by rule ID"),
    file_path: Optional[str] = Query(None, description="Filter by file path substring"),
    db: Session = Depends(get_db)
):
    scan = ScanService.get_scan(db, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    query = db.query(ScanIssue).filter(ScanIssue.scan_id == scan_id)
    if severity:
        query = query.filter(ScanIssue.severity == severity.lower())
    if rule_id:
        query = query.filter(ScanIssue.rule_id == rule_id)
    if file_path:
        query = query.filter(ScanIssue.file_path.ilike(f"%{file_path}%"))

    issues = query.all()

    return ScanDetailResponse(
        id=scan.id,
        workspace_id=scan.workspace_id,
        status=scan.status,
        total_score=scan.total_score,
        grade=scan.grade,
        structure_score=scan.structure_score,
        links_score=scan.links_score,
        style_score=scan.style_score,
        error_count=scan.error_count,
        warning_count=scan.warning_count,
        info_count=scan.info_count,
        total_files_scanned=scan.total_files_scanned,
        duration_ms=scan.duration_ms,
        created_at=scan.created_at,
        issues=[ScanIssueResponse.model_validate(i) for i in issues]
    )

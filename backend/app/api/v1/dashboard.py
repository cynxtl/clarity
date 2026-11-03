from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.schemas.schemas import DashboardMetrics
from backend.app.services.scan_service import ScanService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics", response_model=DashboardMetrics)
def get_metrics(
    workspace_id: Optional[str] = Query(None, description="Workspace ID"),
    db: Session = Depends(get_db)
):
    return ScanService.get_dashboard_metrics(db, workspace_id)

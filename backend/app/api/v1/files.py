from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.entities import DocumentFile
from backend.app.schemas.schemas import DocumentFileResponse, FileContentResponse
from backend.app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/workspaces/{workspace_id}/files", tags=["Files"])

@router.get("", response_model=List[DocumentFileResponse])
def list_files(workspace_id: str, db: Session = Depends(get_db)):
    ws = WorkspaceService.get_workspace(db, workspace_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    files = (
        db.query(DocumentFile)
        .filter(DocumentFile.workspace_id == workspace_id)
        .order_by(DocumentFile.path.asc())
        .all()
    )
    return [DocumentFileResponse.model_validate(f) for f in files]

@router.get("/content", response_model=FileContentResponse)
def get_file_content(
    workspace_id: str,
    path: str = Query(..., description="Relative file path within workspace"),
    db: Session = Depends(get_db)
):
    try:
        return WorkspaceService.get_file_content(db, workspace_id, path)
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=404, detail=str(fnf))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

class UpdateFileRequest(dict):
    pass

@router.put("/content", response_model=FileContentResponse)
def update_file_content(
    workspace_id: str,
    path: str = Query(..., description="Relative file path"),
    content: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    try:
        return WorkspaceService.update_file_content(db, workspace_id, path, content)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

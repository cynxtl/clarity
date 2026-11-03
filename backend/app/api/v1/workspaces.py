import shutil
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.schemas.schemas import WorkspaceCreate, WorkspaceResponse
from backend.app.services.workspace_service import WorkspaceService
from backend.app.core.zip_safety import ZipSafetyError

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(data: WorkspaceCreate, db: Session = Depends(get_db)):
    ws = WorkspaceService.create_workspace(db, data)
    return WorkspaceResponse(
        id=ws.id,
        name=ws.name,
        slug=ws.slug,
        description=ws.description,
        root_path=ws.root_path,
        is_sample=ws.is_sample,
        created_at=ws.created_at,
        updated_at=ws.updated_at,
        file_count=0,
        latest_score=None,
        latest_grade=None,
        unresolved_issues=0,
    )

@router.post("/seed-sample", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def seed_sample_workspace(db: Session = Depends(get_db)):
    ws = WorkspaceService.seed_sample_workspace(db)
    workspaces = WorkspaceService.list_workspaces(db)
    for w in workspaces:
        if w["id"] == ws.id:
            return WorkspaceResponse(**w)
    return WorkspaceResponse(
        id=ws.id,
        name=ws.name,
        slug=ws.slug,
        description=ws.description,
        root_path=ws.root_path,
        is_sample=ws.is_sample,
        created_at=ws.created_at,
        updated_at=ws.updated_at,
        file_count=0,
        latest_score=None,
        latest_grade=None,
        unresolved_issues=0,
    )

@router.get("", response_model=List[WorkspaceResponse])
def list_workspaces(db: Session = Depends(get_db)):
    items = WorkspaceService.list_workspaces(db)
    return [WorkspaceResponse(**item) for item in items]

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(workspace_id: str, db: Session = Depends(get_db)):
    items = WorkspaceService.list_workspaces(db)
    for item in items:
        if item["id"] == workspace_id:
            return WorkspaceResponse(**item)
    raise HTTPException(status_code=404, detail="Workspace not found")

@router.post("/{workspace_id}/import-zip")
async def import_zip(workspace_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip archives are supported.")

    # Save to temporary file
    temp_zip = NamedTemporaryFile(delete=False, suffix=".zip")
    try:
        shutil.copyfileobj(file.file, temp_zip)
        temp_zip.close()

        count = WorkspaceService.import_zip(db, workspace_id, Path(temp_zip.name))
        return {"status": "success", "extracted_files_count": count}
    except ZipSafetyError as zse:
        raise HTTPException(status_code=400, detail=str(zse))
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    finally:
        try:
            Path(temp_zip.name).unlink(missing_ok=True)
        except Exception:
            pass

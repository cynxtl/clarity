import os
import re
from pathlib import Path, PurePosixPath
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.config import settings
from backend.app.models.entities import Workspace, DocumentFile, Scan, ScanIssue
from backend.app.schemas.schemas import WorkspaceCreate, WorkspaceResponse, DocumentFileResponse, FileContentResponse
from backend.app.core.zip_safety import SafeZipExtractor, ALLOWED_EXTENSIONS
from backend.app.services.sample_generator import generate_sample_repository

def slugify(text: str) -> str:
    s = re.sub(r'[^\w\s-]', '', text.lower()).strip()
    return re.sub(r'[-\s]+', '-', s)

class WorkspaceService:
    @staticmethod
    def create_workspace(db: Session, data: WorkspaceCreate, is_sample: bool = False) -> Workspace:
        base_slug = slugify(data.name) or "workspace"
        slug = base_slug
        counter = 1
        while db.query(Workspace).filter(Workspace.slug == slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        workspace_dir = settings.WORKSPACES_DIR / slug
        workspace_dir.mkdir(parents=True, exist_ok=True)

        ws = Workspace(
            name=data.name,
            slug=slug,
            description=data.description,
            root_path=str(workspace_dir.resolve()),
            is_sample=1 if is_sample else 0,
        )
        db.add(ws)
        db.commit()
        db.refresh(ws)
        return ws

    @staticmethod
    def seed_sample_workspace(db: Session) -> Workspace:
        # Check if sample workspace already exists
        existing = db.query(Workspace).filter(Workspace.is_sample == 1).first()
        if existing:
            return existing

        ws = WorkspaceService.create_workspace(
            db,
            WorkspaceCreate(
                name="Nexus Platform Docs (Sample)",
                description="Seeded reference repository showcasing cloud documentation, API specifications, and quality validation rules."
            ),
            is_sample=True
        )

        ws_path = Path(ws.root_path)
        generate_sample_repository(ws_path)
        WorkspaceService.index_workspace_files(db, ws.id)

        # Trigger initial scan
        from backend.app.services.scan_service import ScanService
        ScanService.run_scan(db, ws.id)

        return ws

    @staticmethod
    def index_workspace_files(db: Session, workspace_id: str) -> List[DocumentFile]:
        ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
        if not ws:
            raise ValueError("Workspace not found")

        root = Path(ws.root_path)
        if not root.exists():
            return []

        # Clear existing file records
        db.query(DocumentFile).filter(DocumentFile.workspace_id == workspace_id).delete()

        created_files: List[DocumentFile] = []
        for dirpath, _, filenames in os.walk(root):
            for filename in filenames:
                ext = Path(filename).suffix.lower()
                if ext not in ALLOWED_EXTENSIONS:
                    continue

                abs_file = Path(dirpath) / filename
                rel_path = abs_file.relative_to(root).as_posix()
                size_bytes = abs_file.stat().st_size
                mtime = datetime.fromtimestamp(abs_file.stat().st_mtime, tz=timezone.utc)

                line_count = 0
                word_count = 0
                if ext in {".md", ".markdown", ".mdx", ".txt"}:
                    try:
                        content = abs_file.read_text(encoding="utf-8", errors="ignore")
                        lines = content.splitlines()
                        line_count = len(lines)
                        word_count = len(content.split())
                    except Exception:
                        pass

                doc_file = DocumentFile(
                    workspace_id=workspace_id,
                    path=rel_path,
                    filename=filename,
                    extension=ext,
                    size_bytes=size_bytes,
                    line_count=line_count,
                    word_count=word_count,
                    last_modified=mtime,
                )
                db.add(doc_file)
                created_files.append(doc_file)

        db.commit()
        return created_files

    @staticmethod
    def import_zip(db: Session, workspace_id: str, zip_path: Path) -> int:
        ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
        if not ws:
            raise ValueError("Workspace not found")

        target_dir = Path(ws.root_path)
        extracted = SafeZipExtractor.validate_and_extract(zip_path, target_dir)
        WorkspaceService.index_workspace_files(db, workspace_id)
        return len(extracted)

    @staticmethod
    def list_workspaces(db: Session) -> List[dict]:
        workspaces = db.query(Workspace).order_by(desc(Workspace.created_at)).all()
        result = []
        for ws in workspaces:
            file_count = db.query(DocumentFile).filter(DocumentFile.workspace_id == ws.id).count()
            latest_scan = (
                db.query(Scan)
                .filter(Scan.workspace_id == ws.id)
                .order_by(desc(Scan.created_at))
                .first()
            )

            result.append({
                "id": ws.id,
                "name": ws.name,
                "slug": ws.slug,
                "description": ws.description,
                "root_path": ws.root_path,
                "is_sample": ws.is_sample,
                "created_at": ws.created_at,
                "updated_at": ws.updated_at,
                "file_count": file_count,
                "latest_score": latest_scan.total_score if latest_scan else None,
                "latest_grade": latest_scan.grade if latest_scan else None,
                "unresolved_issues": (latest_scan.error_count + latest_scan.warning_count) if latest_scan else 0,
            })
        return result

    @staticmethod
    def get_workspace(db: Session, workspace_id: str) -> Optional[Workspace]:
        return db.query(Workspace).filter(Workspace.id == workspace_id).first()

    @staticmethod
    def get_file_content(db: Session, workspace_id: str, file_path: str) -> FileContentResponse:
        ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
        if not ws:
            raise ValueError("Workspace not found")

        # Sanitize path
        normalized = PurePosixPath(file_path.strip().lstrip("/"))
        abs_target = (Path(ws.root_path) / normalized).resolve()
        if not str(abs_target).startswith(str(Path(ws.root_path).resolve())):
            raise ValueError("Invalid file path: path traversal detected")

        if not abs_target.exists() or not abs_target.is_file():
            raise FileNotFoundError(f"File '{file_path}' not found in workspace.")

        content = abs_target.read_text(encoding="utf-8", errors="ignore")
        lines = content.splitlines()
        word_count = len(content.split())

        return FileContentResponse(
            path=file_path,
            filename=abs_target.name,
            extension=abs_target.suffix,
            content=content,
            size_bytes=abs_target.stat().st_size,
            line_count=len(lines),
            word_count=word_count,
        )

    @staticmethod
    def update_file_content(db: Session, workspace_id: str, file_path: str, new_content: str) -> FileContentResponse:
        ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
        if not ws:
            raise ValueError("Workspace not found")

        normalized = PurePosixPath(file_path.strip().lstrip("/"))
        abs_target = (Path(ws.root_path) / normalized).resolve()
        if not str(abs_target).startswith(str(Path(ws.root_path).resolve())):
            raise ValueError("Invalid file path: path traversal detected")

        abs_target.parent.mkdir(parents=True, exist_ok=True)
        abs_target.write_text(new_content, encoding="utf-8")

        # Re-index this file
        WorkspaceService.index_workspace_files(db, workspace_id)
        return WorkspaceService.get_file_content(db, workspace_id, file_path)

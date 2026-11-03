from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.schemas.ai import (
    AIStatusResponse,
    RewriteRequest,
    SimplifyRequest,
    ProcedureRequest,
    DocsGeneratorRequest,
    ReleaseNotesRequest,
    AIRevisionResponse,
    AcceptRevisionRequest,
    AcceptRevisionResponse,
)
from backend.app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI Authoring"])

@router.get("/status", response_model=AIStatusResponse)
def get_ai_status():
    """Retrieve AI provider configuration health without exposing credentials."""
    return AIService.get_status()

@router.post("/rewrite", response_model=AIRevisionResponse)
def rewrite_text(req: RewriteRequest, db: Session = Depends(get_db)):
    """Rewrite text for clarity while strictly preserving technical identifiers and formatting."""
    return AIService.rewrite_text(db, req)

@router.post("/simplify", response_model=AIRevisionResponse)
def simplify_text(req: SimplifyRequest, db: Session = Depends(get_db)):
    """Simplify technical language for a chosen audience without modifying technical truth."""
    return AIService.simplify_text(db, req)

@router.post("/generate-procedure", response_model=AIRevisionResponse)
def generate_procedure(req: ProcedureRequest, db: Session = Depends(get_db)):
    """Generate structured step-by-step procedures with verified prerequisites and instructions."""
    return AIService.generate_procedure(db, req)

@router.post("/generate-docs", response_model=AIRevisionResponse)
def generate_docs(req: DocsGeneratorRequest, db: Session = Depends(get_db)):
    """Generate structured documentation from feature briefs and technical notes."""
    return AIService.generate_docs(db, req)

@router.post("/generate-release-notes", response_model=AIRevisionResponse)
def generate_release_notes(req: ReleaseNotesRequest, db: Session = Depends(get_db)):
    """Generate customer-facing release notes strictly from supplied categorized changes."""
    return AIService.generate_release_notes(db, req)

@router.get("/revisions/{workspace_id}", response_model=List[AIRevisionResponse])
def list_revisions(workspace_id: str, limit: int = 30, db: Session = Depends(get_db)):
    """Retrieve recent AI revisions and review status for a workspace."""
    return AIService.list_revisions(db, workspace_id, limit)

@router.get("/revisions/{workspace_id}/{revision_id}", response_model=AIRevisionResponse)
def get_revision(workspace_id: str, revision_id: str, db: Session = Depends(get_db)):
    """Get single revision detail including quality impact comparison."""
    return AIService.get_revision(db, revision_id)

@router.post("/revisions/{revision_id}/accept", response_model=AcceptRevisionResponse)
def accept_revision(revision_id: str, req: AcceptRevisionRequest, db: Session = Depends(get_db)):
    """Accept an AI revision proposal, verify collision state, update document, and compute quality impact."""
    return AIService.accept_revision(db, revision_id, req)

@router.post("/revisions/{revision_id}/reject", response_model=AIRevisionResponse)
def reject_revision(revision_id: str, db: Session = Depends(get_db)):
    """Reject an AI revision proposal."""
    return AIService.reject_revision(db, revision_id)

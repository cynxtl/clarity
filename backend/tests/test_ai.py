import os
import json
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.ai_provider import (
    set_ai_provider,
    FakeAIProvider,
    OpenAICompatibleProvider,
    extract_json_payload,
    AIValidationError,
)
from backend.app.schemas.ai import AIResponseOutput
from backend.app.database import SessionLocal
from backend.app.services.workspace_service import WorkspaceService
from backend.app.schemas.schemas import WorkspaceCreate

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_fake_ai():
    """Ensure FakeAIProvider is used by default for all test runs."""
    fake = FakeAIProvider(configured=True)
    set_ai_provider(fake)
    yield
    # Restore default
    set_ai_provider(OpenAICompatibleProvider())

@pytest.fixture
def test_workspace():
    db = SessionLocal()
    ws = WorkspaceService.create_workspace(
        db,
        WorkspaceCreate(
            name="AI Test Workspace",
            description="Isolated workspace for AI authoring tests"
        )
    )
    # Add a sample guide markdown file
    sample_content = (
        "# Authentication Guide\n\n"
        "This guide describes how to connect to the backend-end API using an auth token.\n\n"
        "```python\n"
        "token = 'secret_123'\n"
        "```\n\n"
        "Ensure you whitelist your client IP before making requests.\n"
    )
    WorkspaceService.update_file_content(db, ws.id, "guides/auth.md", sample_content)
    yield ws
    # Teardown
    import shutil
    try:
        shutil.rmtree(ws.root_path, ignore_errors=True)
    except Exception:
        pass
    db.delete(ws)
    db.commit()
    db.close()

# -------------------------------------------------------------
# 1. AI Provider Status & Missing Credentials
# -------------------------------------------------------------
def test_ai_status_when_configured():
    resp = client.get("/api/v1/ai/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["configured"] is True
    assert data["provider"] == "fake_test_provider"
    assert "model" in data

def test_ai_unconfigured_error(test_workspace):
    # Set unconfigured provider
    set_ai_provider(FakeAIProvider(configured=False))

    status_resp = client.get("/api/v1/ai/status")
    assert status_resp.status_code == 200
    assert status_resp.json()["configured"] is False

    # Calling rewrite must fail with 503 and clear explanation
    resp = client.post("/api/v1/ai/rewrite", json={
        "workspace_id": test_workspace.id,
        "file_path": "guides/auth.md",
        "selected_text": "This guide describes how to connect.",
        "tone": "professional_neutral"
    })
    assert resp.status_code == 503
    assert "not configured" in resp.json()["detail"].lower()

# -------------------------------------------------------------
# 2. Provider Error Simulations (Auth, Rate Limit, Timeout)
# -------------------------------------------------------------
def test_ai_authentication_error(test_workspace):
    set_ai_provider(FakeAIProvider(configured=True, simulate_error="auth"))
    resp = client.post("/api/v1/ai/rewrite", json={
        "workspace_id": test_workspace.id,
        "file_path": "guides/auth.md",
        "selected_text": "Sample text",
    })
    assert resp.status_code == 401
    assert "authentication failed" in resp.json()["detail"].lower()

def test_ai_rate_limit_error(test_workspace):
    set_ai_provider(FakeAIProvider(configured=True, simulate_error="rate_limit"))
    resp = client.post("/api/v1/ai/rewrite", json={
        "workspace_id": test_workspace.id,
        "file_path": "guides/auth.md",
        "selected_text": "Sample text",
    })
    assert resp.status_code == 429
    assert "rate limit" in resp.json()["detail"].lower()

def test_ai_timeout_error(test_workspace):
    set_ai_provider(FakeAIProvider(configured=True, simulate_error="timeout"))
    resp = client.post("/api/v1/ai/rewrite", json={
        "workspace_id": test_workspace.id,
        "file_path": "guides/auth.md",
        "selected_text": "Sample text",
    })
    assert resp.status_code == 504
    assert "timed out" in resp.json()["detail"].lower()

def test_ai_invalid_json_handling():
    # Unit test JSON payload extraction with fenced markdown
    wrapped = "```json\n{\"content\": \"test\", \"explanation\": \"ok\", \"warnings\": [], \"meaning_sensitive_changes\": []}\n```"
    parsed = extract_json_payload(wrapped)
    assert parsed["content"] == "test"

    with pytest.raises(AIValidationError):
        extract_json_payload("not a json string at all")

# -------------------------------------------------------------
# 3. Input Validation: Empty & Excessive Text
# -------------------------------------------------------------
def test_empty_input_rejected(test_workspace):
    resp = client.post("/api/v1/ai/rewrite", json={
        "workspace_id": test_workspace.id,
        "file_path": "guides/auth.md",
        "selected_text": "   ",
    })
    assert resp.status_code == 400
    assert "cannot be empty" in resp.json()["detail"].lower()

def test_excessive_input_rejected(test_workspace):
    excessive_text = "word " * 15000  # > 40000 chars
    resp = client.post("/api/v1/ai/rewrite", json={
        "workspace_id": test_workspace.id,
        "file_path": "guides/auth.md",
        "selected_text": excessive_text,
    })
    assert resp.status_code == 413
    assert "exceeds maximum allowed limit" in resp.json()["detail"].lower()

# -------------------------------------------------------------
# 4. End-to-End Operation 1: Rewrite for Clarity & Quality Impact
# -------------------------------------------------------------
def test_rewrite_for_clarity(test_workspace):
    custom_res = AIResponseOutput(
        content="This guide explains how to connect to the backend API using an authentication token.",
        explanation="Corrected terminology and improved clarity.",
        warnings=[],
        meaning_sensitive_changes=[]
    )
    set_ai_provider(FakeAIProvider(configured=True, custom_response=custom_res))

    original_snippet = "This guide describes how to connect to the backend-end API using an auth token."
    resp = client.post("/api/v1/ai/rewrite", json={
        "workspace_id": test_workspace.id,
        "file_path": "guides/auth.md",
        "document_title": "Authentication Guide",
        "selected_text": original_snippet,
        "full_content": (
            "# Authentication Guide\n\n"
            f"{original_snippet}\n\n"
            "```python\n"
            "token = 'secret_123'\n"
            "```\n\n"
            "Ensure you whitelist your client IP before making requests.\n"
        ),
        "tone": "professional_neutral",
        "use_glossary": True
    })

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "pending"
    assert data["proposed_text"] == custom_res.content
    assert data["operation_type"] == "rewrite"
    assert "quality_impact" in data
    assert data["quality_impact"] is not None

    rev_id = data["id"]

    # Verify revision is stored in database without mutating the original file yet
    file_before = client.get(f"/api/v1/workspaces/{test_workspace.id}/files/content?path=guides/auth.md").json()
    assert original_snippet in file_before["content"]

    # Accept the proposal
    accept_resp = client.post(f"/api/v1/ai/revisions/{rev_id}/accept", json={
        "current_document_content": file_before["content"]
    })
    assert accept_resp.status_code == 200
    acc_data = accept_resp.json()
    assert acc_data["status"] == "accepted"

    # Verify the document on disk has been updated
    file_after = client.get(f"/api/v1/workspaces/{test_workspace.id}/files/content?path=guides/auth.md").json()
    assert custom_res.content in file_after["content"]
    assert original_snippet not in file_after["content"]

# -------------------------------------------------------------
# 5. Stale Revision Conflict Protection
# -------------------------------------------------------------
def test_stale_revision_conflict_detection(test_workspace):
    custom_res = AIResponseOutput(
        content="Updated step text",
        explanation="Refined text",
        warnings=[],
        meaning_sensitive_changes=[]
    )
    set_ai_provider(FakeAIProvider(configured=True, custom_response=custom_res))

    original_snippet = "This guide describes how to connect to the backend-end API using an auth token."
    resp = client.post("/api/v1/ai/rewrite", json={
        "workspace_id": test_workspace.id,
        "file_path": "guides/auth.md",
        "selected_text": original_snippet,
    })
    rev_id = resp.json()["id"]

    # Now modify the document file directly (simulating a concurrent edit by another user)
    client.put(f"/api/v1/workspaces/{test_workspace.id}/files/content?path=guides/auth.md", json={
        "content": "# Completely New File Content\nAll previous text deleted."
    })

    # Attempting to accept the stale revision without force must return 409 Conflict
    accept_resp = client.post(f"/api/v1/ai/revisions/{rev_id}/accept", json={
        "current_document_content": "Old content that does not match disk"
    })
    assert accept_resp.status_code == 409
    assert "modified" in accept_resp.json()["detail"].lower() or "conflict" in accept_resp.json()["detail"].lower()

# -------------------------------------------------------------
# 6. Revision Rejection
# -------------------------------------------------------------
def test_revision_rejection(test_workspace):
    resp = client.post("/api/v1/ai/rewrite", json={
        "workspace_id": test_workspace.id,
        "file_path": "guides/auth.md",
        "selected_text": "Sample text",
    })
    rev_id = resp.json()["id"]

    reject_resp = client.post(f"/api/v1/ai/revisions/{rev_id}/reject")
    assert reject_resp.status_code == 200
    assert reject_resp.json()["status"] == "rejected"

# -------------------------------------------------------------
# 7. Operation 2: Simplify Technical Content
# -------------------------------------------------------------
def test_simplify_content(test_workspace):
    resp = client.post("/api/v1/ai/simplify", json={
        "workspace_id": test_workspace.id,
        "file_path": "guides/auth.md",
        "selected_text": "Connect to database with string.",
        "audience": "general_users"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["operation_type"] == "simplify"
    assert data["audience"] == "general_users"
    assert len(data["proposed_text"]) > 0

# -------------------------------------------------------------
# 8. Operation 3: Procedure Generator
# -------------------------------------------------------------
def test_generate_procedure(test_workspace):
    resp = client.post("/api/v1/ai/generate-procedure", json={
        "workspace_id": test_workspace.id,
        "file_path": "guides/auth.md",
        "task_description": "Configure token auth",
        "prerequisites": ["Admin access"],
        "expected_outcome": "Token generated and active",
        "warnings": ["Rotate tokens regularly"],
        "tone": "concise_direct"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["operation_type"] == "procedure"
    assert "## Overview" in data["proposed_text"]
    assert "## Prerequisites" in data["proposed_text"]
    assert "## Instructions" in data["proposed_text"]

# -------------------------------------------------------------
# 9. Operation 4: Documentation Generator
# -------------------------------------------------------------
def test_generate_docs(test_workspace):
    resp = client.post("/api/v1/ai/generate-docs", json={
        "workspace_id": test_workspace.id,
        "file_path": "guides/auth.md",
        "doc_type": "feature_overview",
        "feature_brief": "Automated quality scanning engine",
        "code_examples": "npm install clarity",
        "tone": "professional_neutral"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["operation_type"] == "docs"
    assert len(data["proposed_text"]) > 0

# -------------------------------------------------------------
# 10. Operation 5: Release Notes Generator
# -------------------------------------------------------------
def test_generate_release_notes(test_workspace):
    resp = client.post("/api/v1/ai/generate-release-notes", json={
        "workspace_id": test_workspace.id,
        "file_path": "guides/auth.md",
        "version": "v2.4.0",
        "release_date": "2026-11-03",
        "added": ["AST validation rule"],
        "fixed": ["Relative image path bug"],
        "deprecated": ["Legacy XML formats"]
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["operation_type"] == "release_notes"
    assert "v2.4.0" in data["proposed_text"]
    assert "### Added" in data["proposed_text"]

# -------------------------------------------------------------
# 11. Revision History Retrieval
# -------------------------------------------------------------
def test_list_revisions(test_workspace):
    client.post("/api/v1/ai/simplify", json={
        "workspace_id": test_workspace.id,
        "file_path": "guides/auth.md",
        "selected_text": "Sample text for history",
        "audience": "developers"
    })

    resp = client.get(f"/api/v1/ai/revisions/{test_workspace.id}")
    assert resp.status_code == 200
    revs = resp.json()
    assert len(revs) >= 1
    assert revs[0]["workspace_id"] == test_workspace.id

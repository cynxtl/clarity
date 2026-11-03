import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_rules_endpoint():
    response = client.get("/api/v1/rules")
    assert response.status_code == 200
    rules = response.json()
    assert len(rules) >= 11
    rule_ids = [r["rule_id"] for r in rules]
    assert "HEAD-001" in rule_ids
    assert "LNK-001" in rule_ids
    assert "IMG-001" in rule_ids
    assert "CODE-001" in rule_ids
    assert "TERM-001" in rule_ids

def test_workspace_creation_and_lifecycle():
    # 1. Create workspace
    payload = {"name": "Test Platform Docs", "description": "Unit testing workspace"}
    res = client.post("/api/v1/workspaces", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Test Platform Docs"
    ws_id = data["id"]

    # 2. List workspaces
    res_list = client.get("/api/v1/workspaces")
    assert res_list.status_code == 200
    assert any(w["id"] == ws_id for w in res_list.json())

    # 3. Seed sample repository
    res_sample = client.post("/api/v1/workspaces/seed-sample")
    assert res_sample.status_code == 201
    sample_data = res_sample.json()
    assert sample_data["is_sample"] == 1
    sample_id = sample_data["id"]

    # 4. List files in sample workspace
    res_files = client.get(f"/api/v1/workspaces/{sample_id}/files")
    assert res_files.status_code == 200
    files = res_files.json()
    assert len(files) >= 5
    assert any("README.md" in f["path"] for f in files)

    # 5. Read file content
    res_content = client.get(f"/api/v1/workspaces/{sample_id}/files/content?path=README.md")
    assert res_content.status_code == 200
    assert "# Nexus Cloud" in res_content.json()["content"]

    # 6. Trigger scan
    res_scan = client.post(f"/api/v1/workspaces/{sample_id}/scans")
    assert res_scan.status_code == 201
    scan_data = res_scan.json()
    assert scan_data["status"] == "completed"
    assert len(scan_data["issues"]) > 0
    assert scan_data["total_score"] > 0

    # 7. Dashboard metrics
    res_dash = client.get(f"/api/v1/dashboard/metrics?workspace_id={sample_id}")
    assert res_dash.status_code == 200
    dash_data = res_dash.json()
    assert dash_data["total_files"] >= 5
    assert dash_data["current_score"] is not None

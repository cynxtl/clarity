from backend.app.rules.base import RuleFinding
from backend.app.services.scoring_service import compute_quality_score

def test_perfect_score():
    result = compute_quality_score([], total_files=5)
    assert result["total_score"] == 100.0
    assert result["grade"] == "A+"
    assert result["error_count"] == 0
    assert result["warning_count"] == 0

def test_score_deductions_and_grades():
    # 2 errors, 3 warnings
    findings = [
        RuleFinding("HEAD-001", "Missing H1", "structure", "error", "doc.md", 1, "msg"),
        RuleFinding("LNK-001", "Broken Link", "links", "error", "doc.md", 5, "msg"),
        RuleFinding("IMG-002", "Alt Text", "accessibility", "warning", "doc.md", 10, "msg"),
        RuleFinding("CODE-001", "Code Fence", "style", "warning", "doc.md", 15, "msg"),
        RuleFinding("HEAD-003", "Skipped Level", "structure", "warning", "doc.md", 20, "msg"),
    ]
    result = compute_quality_score(findings, total_files=2)
    assert result["error_count"] == 2
    assert result["warning_count"] == 3
    assert result["total_score"] < 100.0
    assert result["grade"] in ["A", "B", "C", "D", "F"]
    assert "structure_score" in result
    assert "links_score" in result
    assert "style_score" in result

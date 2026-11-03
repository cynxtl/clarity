from typing import List, Dict, Any
from backend.app.rules.base import RuleFinding

def calculate_category_score(findings: List[RuleFinding], category: str, total_files: int) -> float:
    cat_findings = [f for f in findings if f.category == category]
    if not cat_findings:
        return 100.0

    errs = sum(1 for f in cat_findings if f.severity == "error")
    warns = sum(1 for f in cat_findings if f.severity == "warning")
    infos = sum(1 for f in cat_findings if f.severity == "info")

    scale = max(1.0, total_files * 0.3)
    deduction = (errs * 10.0 + warns * 3.0 + infos * 0.5) / scale
    return round(max(0.0, min(100.0, 100.0 - deduction)), 1)

def compute_quality_score(findings: List[RuleFinding], total_files: int) -> Dict[str, Any]:
    """
    Deterministic Documentation Quality Score:
    Base: 100.0
    Weighted deductions:
      - Error: -10.0
      - Warning: -3.0
      - Info: -0.5
    Normalized across document volume to prevent skew.
    """
    total_files = max(1, total_files)
    errs = sum(1 for f in findings if f.severity == "error")
    warns = sum(1 for f in findings if f.severity == "warning")
    infos = sum(1 for f in findings if f.severity == "info")

    scale = max(1.0, total_files * 0.35)
    total_deduction = (errs * 10.0 + warns * 3.0 + infos * 0.5) / scale
    overall_score = round(max(0.0, min(100.0, 100.0 - total_deduction)), 1)

    # Category Subscores
    structure_score = calculate_category_score(findings, "structure", total_files)
    # Both links and assets count towards link & reference integrity
    link_findings = [f for f in findings if f.category in ("links", "assets")]
    link_errs = sum(1 for f in link_findings if f.severity == "error")
    link_warns = sum(1 for f in link_findings if f.severity == "warning")
    links_score = round(max(0.0, min(100.0, 100.0 - (link_errs * 12.0 + link_warns * 4.0) / scale)), 1)

    style_findings = [f for f in findings if f.category in ("style", "accessibility")]
    style_errs = sum(1 for f in style_findings if f.severity == "error")
    style_warns = sum(1 for f in style_findings if f.severity == "warning")
    style_infos = sum(1 for f in style_findings if f.severity == "info")
    style_score = round(max(0.0, min(100.0, 100.0 - (style_errs * 8.0 + style_warns * 3.0 + style_infos * 0.5) / scale)), 1)

    # Determine Grade
    if overall_score >= 95.0:
        grade = "A+"
    elif overall_score >= 90.0:
        grade = "A"
    elif overall_score >= 80.0:
        grade = "B"
    elif overall_score >= 70.0:
        grade = "C"
    elif overall_score >= 60.0:
        grade = "D"
    else:
        grade = "F"

    return {
        "total_score": overall_score,
        "grade": grade,
        "structure_score": structure_score,
        "links_score": links_score,
        "style_score": style_score,
        "error_count": errs,
        "warning_count": warns,
        "info_count": infos,
        "total_files_scanned": total_files,
    }

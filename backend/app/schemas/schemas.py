from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# --- Workspace Schemas ---
class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class WorkspaceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    description: Optional[str] = None
    root_path: str
    is_sample: int
    created_at: datetime
    updated_at: datetime
    file_count: Optional[int] = 0
    latest_score: Optional[float] = None
    latest_grade: Optional[str] = None
    unresolved_issues: Optional[int] = 0

# --- Document File Schemas ---
class DocumentFileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    path: str
    filename: str
    extension: str
    size_bytes: int
    line_count: int
    word_count: int
    last_modified: datetime

class FileContentResponse(BaseModel):
    path: str
    filename: str
    extension: str
    content: str
    size_bytes: int
    line_count: int
    word_count: int

# --- Issue Schemas ---
class ScanIssueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    scan_id: str
    workspace_id: str
    rule_id: str
    rule_name: str
    category: str
    severity: str  # error, warning, info
    file_path: str
    line_number: Optional[int] = None
    message: str
    snippet: Optional[str] = None
    suggested_fix: Optional[str] = None

# --- Scan Schemas ---
class ScanRunRequest(BaseModel):
    rules: Optional[List[str]] = None
    custom_glossary: Optional[Dict[str, str]] = None
    required_sections: Optional[List[str]] = None

class ScanSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    status: str
    total_score: float
    grade: str
    structure_score: float
    links_score: float
    style_score: float
    error_count: int
    warning_count: int
    info_count: int
    total_files_scanned: int
    duration_ms: int
    created_at: datetime

class ScanDetailResponse(ScanSummaryResponse):
    issues: List[ScanIssueResponse] = []

# --- Rule Definition Schema ---
class RuleDefinition(BaseModel):
    rule_id: str
    name: str
    category: str
    severity: str
    description: str

# --- Dashboard Overview Schema ---
class DashboardMetrics(BaseModel):
    workspace_id: Optional[str] = None
    workspace_name: Optional[str] = None
    is_sample: bool = False
    total_files: int = 0
    total_words: int = 0
    current_score: Optional[float] = None
    current_grade: Optional[str] = None
    error_count: int = 0
    warning_count: int = 0
    info_count: int = 0
    total_issues: int = 0
    structure_score: Optional[float] = None
    links_score: Optional[float] = None
    style_score: Optional[float] = None
    recent_scans: List[ScanSummaryResponse] = []
    top_issues: List[ScanIssueResponse] = []

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class AIStatusResponse(BaseModel):
    configured: bool
    provider: str
    model: str
    base_url: str
    temperature: float
    timeout_seconds: float
    message: str

class RewriteRequest(BaseModel):
    workspace_id: str
    file_path: str
    document_title: Optional[str] = ""
    selected_text: str
    full_content: Optional[str] = None
    tone: str = "professional_neutral"  # professional_neutral, concise_direct, beginner_friendly, formal_customer
    custom_instruction: Optional[str] = ""
    use_glossary: bool = True

class SimplifyRequest(BaseModel):
    workspace_id: str
    file_path: str
    selected_text: str
    audience: str = "general_users"  # general_users, developers, system_administrators, technical_support
    custom_instruction: Optional[str] = ""
    use_glossary: bool = True

class ProcedureRequest(BaseModel):
    workspace_id: str
    file_path: str
    task_description: str
    prerequisites: List[str] = Field(default_factory=list)
    source_notes: Optional[str] = ""
    expected_outcome: str
    warnings: List[str] = Field(default_factory=list)
    tone: str = "concise_direct"
    use_glossary: bool = True

class DocsGeneratorRequest(BaseModel):
    workspace_id: str
    file_path: str
    doc_type: str = "feature_overview"  # feature_overview, installation, configuration, api_usage, troubleshooting
    feature_brief: str
    code_examples: Optional[str] = ""
    technical_specs: Optional[str] = ""
    tone: str = "professional_neutral"
    use_glossary: bool = True

class ReleaseNotesRequest(BaseModel):
    workspace_id: str
    file_path: str
    version: str
    release_date: Optional[str] = None
    added: List[str] = Field(default_factory=list)
    changed: List[str] = Field(default_factory=list)
    fixed: List[str] = Field(default_factory=list)
    deprecated: List[str] = Field(default_factory=list)
    removed: List[str] = Field(default_factory=list)
    tone: str = "formal_customer"

class AIResponseOutput(BaseModel):
    content: str
    explanation: str
    warnings: List[str] = Field(default_factory=list)
    meaning_sensitive_changes: List[str] = Field(default_factory=list)

class FindingSummary(BaseModel):
    rule_id: str
    rule_name: str
    severity: str
    category: str
    line_number: Optional[int] = None
    message: str

class QualityImpactComparison(BaseModel):
    score_before: float
    score_after: float
    score_delta: float
    grade_before: str
    grade_after: str
    findings_count_before: int
    findings_count_after: int
    resolved_findings_count: int
    new_findings_count: int
    resolved_findings: List[FindingSummary] = Field(default_factory=list)
    new_findings: List[FindingSummary] = Field(default_factory=list)

class AIRevisionResponse(BaseModel):
    id: str
    workspace_id: str
    file_path: str
    operation_type: str
    tone: Optional[str] = None
    audience: Optional[str] = None
    custom_instruction: Optional[str] = None
    original_text: str
    proposed_text: str
    explanation: str
    warnings: List[str] = Field(default_factory=list)
    meaning_changes: List[str] = Field(default_factory=list)
    original_hash: str
    status: str
    quality_impact: Optional[QualityImpactComparison] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

class AcceptRevisionRequest(BaseModel):
    current_document_content: Optional[str] = None
    force: bool = False

class AcceptRevisionResponse(BaseModel):
    revision_id: str
    status: str
    quality_impact: QualityImpactComparison
    saved_file_path: str
    updated_content: str

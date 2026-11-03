from dataclasses import dataclass, field
from typing import List, Optional, Set, Dict, Any

@dataclass
class RuleFinding:
    rule_id: str
    rule_name: str
    category: str  # structure, links, assets, style, accessibility
    severity: str  # error, warning, info
    file_path: str
    line_number: Optional[int]
    message: str
    snippet: Optional[str] = None
    suggested_fix: Optional[str] = None

@dataclass
class DocumentContext:
    file_path: str
    raw_content: str
    lines: List[str]
    all_workspace_files: Set[str] = field(default_factory=set)
    config: Dict[str, Any] = field(default_factory=dict)

class BaseRule:
    rule_id: str = ""
    name: str = ""
    category: str = "structure"
    default_severity: str = "warning"
    description: str = ""

    def validate(self, context: DocumentContext) -> List[RuleFinding]:
        raise NotImplementedError

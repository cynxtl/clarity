from typing import Dict, List, Optional
from backend.app.rules.base import BaseRule
from backend.app.rules.headings import (
    MissingH1Rule,
    MultipleH1Rule,
    SkippedHeadingLevelRule,
    DuplicateHeadingRule,
)
from backend.app.rules.links import BrokenRelativeLinksRule
from backend.app.rules.images import MissingLocalImageRule, MissingImageAltTextRule
from backend.app.rules.code_blocks import MissingCodeBlockLanguageRule
from backend.app.rules.structure import MissingRequiredSectionsRule
from backend.app.rules.style import (
    GlossaryTerminologyRule,
    ExcessivelyLongParagraphRule,
    ExcessivelyLongSentenceRule,
)

ALL_RULES: List[BaseRule] = [
    MissingH1Rule(),
    MultipleH1Rule(),
    SkippedHeadingLevelRule(),
    DuplicateHeadingRule(),
    BrokenRelativeLinksRule(),
    MissingLocalImageRule(),
    MissingImageAltTextRule(),
    MissingCodeBlockLanguageRule(),
    MissingRequiredSectionsRule(),
    GlossaryTerminologyRule(),
    ExcessivelyLongParagraphRule(),
    ExcessivelyLongSentenceRule(),
]

RULE_MAP: Dict[str, BaseRule] = {rule.rule_id: rule for rule in ALL_RULES}

def get_registered_rules(rule_ids: Optional[List[str]] = None) -> List[BaseRule]:
    if not rule_ids:
        return list(ALL_RULES)
    return [RULE_MAP[rid] for rid in rule_ids if rid in RULE_MAP]

def list_rule_definitions() -> List[dict]:
    return [
        {
            "rule_id": rule.rule_id,
            "name": rule.name,
            "category": rule.category,
            "severity": rule.default_severity,
            "description": rule.description,
        }
        for rule in ALL_RULES
    ]

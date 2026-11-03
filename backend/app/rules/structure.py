from typing import List
from backend.app.rules.base import BaseRule, DocumentContext, RuleFinding
from backend.app.rules.headings import extract_headings

class MissingRequiredSectionsRule(BaseRule):
    rule_id = "STRUC-001"
    name = "Missing Configured Required Section"
    category = "structure"
    default_severity = "warning"
    description = "Documentation files must contain configured standard sections (e.g. Overview, Prerequisites, or Installation)."

    def validate(self, context: DocumentContext) -> List[RuleFinding]:
        # Required sections can be passed in context.config
        required_sections = context.config.get("required_sections")
        if not required_sections:
            # Default required section for guides/readmes
            if "guide" in context.file_path.lower() or "getting-started" in context.file_path.lower():
                required_sections = ["Prerequisites", "Installation"]
            else:
                return []

        headings = extract_headings(context.lines)
        found_section_titles = {h[2].strip().lower() for h in headings}

        findings: List[RuleFinding] = []
        for section in required_sections:
            sec_lower = section.strip().lower()
            if not any(sec_lower in found for found in found_section_titles):
                findings.append(
                    RuleFinding(
                        rule_id=self.rule_id,
                        rule_name=self.name,
                        category=self.category,
                        severity=self.default_severity,
                        file_path=context.file_path,
                        line_number=1,
                        message=f"Missing recommended section '## {section}' in document.",
                        snippet=context.lines[0] if context.lines else "",
                        suggested_fix=f"Include a '## {section}' section to satisfy standard documentation guidelines."
                    )
                )

        return findings

import re
from typing import List
from backend.app.rules.base import BaseRule, DocumentContext, RuleFinding

FENCE_START = re.compile(r'^(`{3,}|~{3,})(.*)$')

class MissingCodeBlockLanguageRule(BaseRule):
    rule_id = "CODE-001"
    name = "Missing Code Fence Language Identifier"
    category = "style"
    default_severity = "warning"
    description = "Code blocks must specify a syntax highlighting language identifier (e.g. bash, ts, python, json) to ensure proper syntax highlighting."

    def validate(self, context: DocumentContext) -> List[RuleFinding]:
        findings: List[RuleFinding] = []
        in_code_block = False

        for line_no, line in enumerate(context.lines, start=1):
            stripped = line.strip()
            match = FENCE_START.match(stripped)
            if match:
                fence_chars = match.group(1)
                lang = match.group(2).strip()

                if not in_code_block:
                    # Opening fence
                    in_code_block = True
                    if not lang:
                        findings.append(
                            RuleFinding(
                                rule_id=self.rule_id,
                                rule_name=self.name,
                                category=self.category,
                                severity=self.default_severity,
                                file_path=context.file_path,
                                line_number=line_no,
                                message="Code block opened without a language identifier.",
                                snippet=line.strip(),
                                suggested_fix="Add an explicit language tag after the code fence, e.g. ````ts` or ````bash`."
                            )
                        )
                else:
                    # Closing fence
                    in_code_block = False

        return findings

import re
from pathlib import PurePosixPath
from typing import List
from backend.app.rules.base import BaseRule, DocumentContext, RuleFinding

# Match markdown links: [link text](url)
# Exclude images which start with ![
LINK_REGEX = re.compile(r'(?<!\!)\[([^\]]+)\]\(([^)]+)\)')

class BrokenRelativeLinksRule(BaseRule):
    rule_id = "LNK-001"
    name = "Broken Relative Markdown Link"
    category = "links"
    default_severity = "error"
    description = "Relative links within the documentation repository must resolve to an existing documentation file."

    def validate(self, context: DocumentContext) -> List[RuleFinding]:
        findings: List[RuleFinding] = []
        current_file_dir = PurePosixPath(context.file_path).parent

        in_code_block = False
        for line_no, line in enumerate(context.lines, start=1):
            stripped = line.strip()
            if stripped.startswith("```"):
                in_code_block = not in_code_block
                continue

            if in_code_block:
                continue

            for match in LINK_REGEX.finditer(line):
                link_text = match.group(1)
                target = match.group(2).strip()

                # Ignore external URLs, anchor-only links, mailto
                if (
                    target.startswith("http://")
                    or target.startswith("https://")
                    or target.startswith("mailto:")
                    or target.startswith("ftp://")
                    or target.startswith("#")
                    or target.startswith("//")
                ):
                    continue

                # Strip anchor fragment or query params
                target_path_part = target.split("#")[0].split("?")[0]
                if not target_path_part:
                    continue

                # Normalize target relative to current file's directory
                try:
                    if target_path_part.startswith("/"):
                        resolved_target = PurePosixPath(target_path_part.lstrip("/"))
                    else:
                        resolved_target = (current_file_dir / target_path_part)
                    
                    # Normalize '.' and '..'
                    parts: List[str] = []
                    for part in resolved_target.parts:
                        if part == ".":
                            continue
                        elif part == "..":
                            if parts:
                                parts.pop()
                        else:
                            parts.append(part)
                    normalized_str = "/".join(parts)
                except Exception:
                    normalized_str = target_path_part

                # Check if target exists in workspace files
                if (
                    normalized_str not in context.all_workspace_files
                    and (normalized_str + ".md") not in context.all_workspace_files
                    and (normalized_str + "/index.md") not in context.all_workspace_files
                    and (normalized_str + "/README.md") not in context.all_workspace_files
                ):
                    findings.append(
                        RuleFinding(
                            rule_id=self.rule_id,
                            rule_name=self.name,
                            category=self.category,
                            severity=self.default_severity,
                            file_path=context.file_path,
                            line_number=line_no,
                            message=f"Broken relative link to '{target}'. Target file '{normalized_str}' does not exist in workspace.",
                            snippet=line.strip(),
                            suggested_fix=f"Update link target '{target}' to point to a valid existing document or external URL."
                        )
                    )

        return findings

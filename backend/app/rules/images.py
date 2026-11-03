import re
from pathlib import PurePosixPath
from typing import List
from backend.app.rules.base import BaseRule, DocumentContext, RuleFinding

IMAGE_REGEX = re.compile(r'!\[([^\]]*)\]\(([^)]+)\)')

class MissingLocalImageRule(BaseRule):
    rule_id = "IMG-001"
    name = "Missing Local Image Asset"
    category = "assets"
    default_severity = "error"
    description = "Local images referenced in documentation must exist in the workspace asset tree."

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

            for match in IMAGE_REGEX.finditer(line):
                alt_text = match.group(1)
                img_src = match.group(2).strip()

                # Skip remote images or base64 data URIs
                if (
                    img_src.startswith("http://")
                    or img_src.startswith("https://")
                    or img_src.startswith("data:image/")
                    or img_src.startswith("//")
                ):
                    continue

                # Strip anchor or queries
                target_path_part = img_src.split("?")[0].split("#")[0]
                if not target_path_part:
                    continue

                try:
                    if target_path_part.startswith("/"):
                        resolved_target = PurePosixPath(target_path_part.lstrip("/"))
                    else:
                        resolved_target = current_file_dir / target_path_part

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

                if normalized_str not in context.all_workspace_files:
                    findings.append(
                        RuleFinding(
                            rule_id=self.rule_id,
                            rule_name=self.name,
                            category=self.category,
                            severity=self.default_severity,
                            file_path=context.file_path,
                            line_number=line_no,
                            message=f"Missing referenced image '{img_src}'. Target asset '{normalized_str}' was not found in repository.",
                            snippet=line.strip(),
                            suggested_fix=f"Verify the asset path or commit '{normalized_str}' to the documentation directory."
                        )
                    )

        return findings

class MissingImageAltTextRule(BaseRule):
    rule_id = "IMG-002"
    name = "Missing Image Alt Text"
    category = "accessibility"
    default_severity = "warning"
    description = "Images must have descriptive alternative text for screen readers and search indexing."

    def validate(self, context: DocumentContext) -> List[RuleFinding]:
        findings: List[RuleFinding] = []
        in_code_block = False

        for line_no, line in enumerate(context.lines, start=1):
            stripped = line.strip()
            if stripped.startswith("```"):
                in_code_block = not in_code_block
                continue

            if in_code_block:
                continue

            for match in IMAGE_REGEX.finditer(line):
                alt_text = match.group(1).strip()
                img_src = match.group(2).strip()

                if not alt_text:
                    findings.append(
                        RuleFinding(
                            rule_id=self.rule_id,
                            rule_name=self.name,
                            category=self.category,
                            severity=self.default_severity,
                            file_path=context.file_path,
                            line_number=line_no,
                            message="Image element is missing an alt text description.",
                            snippet=line.strip(),
                            suggested_fix=f"Add descriptive alt text: `![Architecture diagram]({img_src})`"
                        )
                    )

        return findings

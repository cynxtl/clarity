import re
from typing import List, Dict, Tuple
from backend.app.rules.base import BaseRule, DocumentContext, RuleFinding

HEADING_REGEX = re.compile(r'^(#{1,6})\s+(.+)$')

def extract_headings(lines: List[str]) -> List[Tuple[int, int, str, str]]:
    """
    Returns list of (line_num_1_based, level, title_cleaned, raw_line).
    Skips headings inside code blocks.
    """
    headings = []
    in_code_block = False

    for idx, line in enumerate(lines, start=1):
        stripped = line.strip()
        if stripped.startswith("```"):
            in_code_block = not in_code_block
            continue

        if not in_code_block:
            match = HEADING_REGEX.match(stripped)
            if match:
                level = len(match.group(1))
                title = match.group(2).strip()
                headings.append((idx, level, title, stripped))

    return headings

class MissingH1Rule(BaseRule):
    rule_id = "HEAD-001"
    name = "Missing Document H1"
    category = "structure"
    default_severity = "error"
    description = "Documentation files must contain exactly one top-level H1 heading defining the document topic."

    def validate(self, context: DocumentContext) -> List[RuleFinding]:
        # Only validate markdown files
        if not (context.file_path.endswith(".md") or context.file_path.endswith(".mdx") or context.file_path.endswith(".markdown")):
            return []

        headings = extract_headings(context.lines)
        h1_headings = [h for h in headings if h[1] == 1]

        if not h1_headings:
            # Suggest name based on filename
            doc_name = context.file_path.split("/")[-1].replace(".mdx", "").replace(".md", "").replace("-", " ").title()
            return [
                RuleFinding(
                    rule_id=self.rule_id,
                    rule_name=self.name,
                    category=self.category,
                    severity=self.default_severity,
                    file_path=context.file_path,
                    line_number=1,
                    message="Document is missing a top-level H1 heading.",
                    snippet=context.lines[0] if context.lines else "",
                    suggested_fix=f"Add `# {doc_name}` at the top of the file."
                )
            ]
        return []

class MultipleH1Rule(BaseRule):
    rule_id = "HEAD-002"
    name = "Multiple H1 Headings"
    category = "structure"
    default_severity = "warning"
    description = "A markdown document should only have a single H1 heading to ensure clean document hierarchy."

    def validate(self, context: DocumentContext) -> List[RuleFinding]:
        headings = extract_headings(context.lines)
        h1_headings = [h for h in headings if h[1] == 1]

        findings: List[RuleFinding] = []
        if len(h1_headings) > 1:
            # Flag all H1s after the first one
            for line_no, level, title, raw in h1_headings[1:]:
                findings.append(
                    RuleFinding(
                        rule_id=self.rule_id,
                        rule_name=self.name,
                        category=self.category,
                        severity=self.default_severity,
                        file_path=context.file_path,
                        line_number=line_no,
                        message=f"Duplicate H1 heading detected: '{title}'. Only one H1 is allowed per document.",
                        snippet=raw,
                        suggested_fix=f"Change to a sub-heading: `## {title}`"
                    )
                )
        return findings

class SkippedHeadingLevelRule(BaseRule):
    rule_id = "HEAD-003"
    name = "Skipped Heading Level"
    category = "structure"
    default_severity = "warning"
    description = "Heading levels must increase by at most one level at a time (e.g. H1 -> H2 -> H3), without skipping levels."

    def validate(self, context: DocumentContext) -> List[RuleFinding]:
        headings = extract_headings(context.lines)
        findings: List[RuleFinding] = []

        prev_level = 0
        for line_no, level, title, raw in headings:
            if prev_level > 0 and level > prev_level + 1:
                findings.append(
                    RuleFinding(
                        rule_id=self.rule_id,
                        rule_name=self.name,
                        category=self.category,
                        severity=self.default_severity,
                        file_path=context.file_path,
                        line_number=line_no,
                        message=f"Heading level skipped from H{prev_level} directly to H{level} for '{title}'.",
                        snippet=raw,
                        suggested_fix=f"Adjust heading to H{prev_level + 1}: `{'#' * (prev_level + 1)} {title}`"
                    )
                )
            prev_level = level

        return findings

class DuplicateHeadingRule(BaseRule):
    rule_id = "HEAD-004"
    name = "Duplicate Heading Text"
    category = "structure"
    default_severity = "warning"
    description = "Headings with identical text within the same file lead to conflicting URL anchor links."

    def validate(self, context: DocumentContext) -> List[RuleFinding]:
        headings = extract_headings(context.lines)
        findings: List[RuleFinding] = []
        seen_headings: Dict[str, int] = {}

        for line_no, level, title, raw in headings:
            normalized_title = title.strip().lower()
            if normalized_title in seen_headings:
                first_line = seen_headings[normalized_title]
                findings.append(
                    RuleFinding(
                        rule_id=self.rule_id,
                        rule_name=self.name,
                        category=self.category,
                        severity=self.default_severity,
                        file_path=context.file_path,
                        line_number=line_no,
                        message=f"Duplicate heading '{title}' (previously defined on line {first_line}). Duplicate headings cause anchor collision.",
                        snippet=raw,
                        suggested_fix=f"Make this heading unique, e.g. `{'#' * level} {title} (Details)`"
                    )
                )
            else:
                seen_headings[normalized_title] = line_no

        return findings

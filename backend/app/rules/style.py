import re
from typing import List, Dict
from backend.app.rules.base import BaseRule, DocumentContext, RuleFinding

DEFAULT_GLOSSARY_RULES = {
    r'\bdepreciated\b': ('deprecated', "Use 'deprecated' instead of 'depreciated' when indicating obsolete functionality."),
    r'\bwhitelist\b': ('allowlist', "Use inclusive terminology 'allowlist' instead of 'whitelist'."),
    r'\bblacklist\b': ('denylist', "Use inclusive terminology 'denylist' instead of 'blacklist'."),
    r'\bmaster/slave\b': ('primary/replica', "Use inclusive terminology 'primary/replica' instead of 'master/slave'."),
    r'\bmaster branch\b': ('main branch', "Use 'main branch' instead of 'master branch'."),
    r'\bon-premise\b': ('on-premises', "'Premise' means an assumption; use 'on-premises' for local infrastructure."),
    r'\bbackend-end\b': ('backend', "Typo detected: use 'backend'."),
    r'\bauth token\b': ('authentication token', "Prefer fully qualified 'authentication token' in formal API documentation."),
}

class GlossaryTerminologyRule(BaseRule):
    rule_id = "TERM-001"
    name = "Glossary & Terminology Inconsistency"
    category = "style"
    default_severity = "warning"
    description = "Enforces standard technical terminology, inclusive language, and consistent glossary definitions."

    def validate(self, context: DocumentContext) -> List[RuleFinding]:
        findings: List[RuleFinding] = []
        in_code_block = False

        # Merge defaults with custom dictionary if configured
        active_rules = dict(DEFAULT_GLOSSARY_RULES)
        custom_glossary: Dict[str, str] = context.config.get("custom_glossary", {})
        for bad_term, preferred in custom_glossary.items():
            pattern = rf'\b{re.escape(bad_term)}\b'
            active_rules[pattern] = (preferred, f"Use standard term '{preferred}' instead of '{bad_term}'.")

        for line_no, line in enumerate(context.lines, start=1):
            stripped = line.strip()
            if stripped.startswith("```"):
                in_code_block = not in_code_block
                continue

            if in_code_block:
                continue

            for pattern, (preferred, explanation) in active_rules.items():
                for match in re.finditer(pattern, line, flags=re.IGNORECASE):
                    matched_text = match.group(0)
                    findings.append(
                        RuleFinding(
                            rule_id=self.rule_id,
                            rule_name=self.name,
                            category=self.category,
                            severity=self.default_severity,
                            file_path=context.file_path,
                            line_number=line_no,
                            message=f"Non-standard or inconsistent terminology '{matched_text}' found. {explanation}",
                            snippet=line.strip(),
                            suggested_fix=f"Replace '{matched_text}' with '{preferred}'."
                        )
                    )

        return findings

class ExcessivelyLongParagraphRule(BaseRule):
    rule_id = "LEN-001"
    name = "Excessively Long Paragraph"
    category = "style"
    default_severity = "warning"
    description = "Paragraphs exceeding 150 words reduce readability and visual scanning on documentation platforms."

    def validate(self, context: DocumentContext) -> List[RuleFinding]:
        findings: List[RuleFinding] = []
        max_words = context.config.get("max_paragraph_words", 150)

        current_paragraph: List[str] = []
        start_line = 1
        in_code_block = False

        for line_no, line in enumerate(context.lines, start=1):
            stripped = line.strip()
            if stripped.startswith("```"):
                in_code_block = not in_code_block
                current_paragraph.clear()
                continue

            if in_code_block or stripped.startswith("#") or stripped.startswith("-") or stripped.startswith("*"):
                current_paragraph.clear()
                continue

            if stripped:
                if not current_paragraph:
                    start_line = line_no
                current_paragraph.append(stripped)
            else:
                if current_paragraph:
                    text = " ".join(current_paragraph)
                    words = text.split()
                    if len(words) > max_words:
                        snippet_preview = text[:120] + "..." if len(text) > 120 else text
                        findings.append(
                            RuleFinding(
                                rule_id=self.rule_id,
                                rule_name=self.name,
                                category=self.category,
                                severity=self.default_severity,
                                file_path=context.file_path,
                                line_number=start_line,
                                message=f"Paragraph is excessively long ({len(words)} words, maximum recommended is {max_words}).",
                                snippet=snippet_preview,
                                suggested_fix="Break this paragraph into smaller, focused paragraphs or convert dense steps into bullet points."
                            )
                        )
                    current_paragraph.clear()

        # Check end of file
        if current_paragraph:
            text = " ".join(current_paragraph)
            words = text.split()
            if len(words) > max_words:
                snippet_preview = text[:120] + "..." if len(text) > 120 else text
                findings.append(
                    RuleFinding(
                        rule_id=self.rule_id,
                        rule_name=self.name,
                        category=self.category,
                        severity=self.default_severity,
                        file_path=context.file_path,
                        line_number=start_line,
                        message=f"Paragraph is excessively long ({len(words)} words, maximum recommended is {max_words}).",
                        snippet=snippet_preview,
                        suggested_fix="Break this paragraph into smaller, focused paragraphs or convert dense steps into bullet points."
                    )
                )

        return findings

class ExcessivelyLongSentenceRule(BaseRule):
    rule_id = "LEN-002"
    name = "Excessively Long Sentence"
    category = "style"
    default_severity = "info"
    description = "Sentences with more than 35 words are difficult for technical readers to parse."

    def validate(self, context: DocumentContext) -> List[RuleFinding]:
        findings: List[RuleFinding] = []
        max_words = context.config.get("max_sentence_words", 35)

        in_code_block = False
        for line_no, line in enumerate(context.lines, start=1):
            stripped = line.strip()
            if stripped.startswith("```"):
                in_code_block = not in_code_block
                continue

            if in_code_block or stripped.startswith("#") or stripped.startswith("|"):
                continue

            # Simple sentence splitting on punctuation followed by space
            sentences = re.split(r'(?<=[.!?])\s+', stripped)
            for s in sentences:
                clean_s = s.strip()
                # Exclude lines that are links or citations
                if clean_s.startswith("http") or clean_s.startswith("["):
                    continue
                words = clean_s.split()
                if len(words) > max_words:
                    findings.append(
                        RuleFinding(
                            rule_id=self.rule_id,
                            rule_name=self.name,
                            category=self.category,
                            severity=self.default_severity,
                            file_path=context.file_path,
                            line_number=line_no,
                            message=f"Sentence contains {len(words)} words (recommended limit is {max_words} words).",
                            snippet=clean_s if len(clean_s) < 140 else clean_s[:137] + "...",
                            suggested_fix="Split the sentence into two or more concise statements."
                        )
                    )

        return findings

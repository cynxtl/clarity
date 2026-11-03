import pytest
from backend.app.rules.base import DocumentContext
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

def make_context(file_path: str, content: str, workspace_files=None, config=None):
    lines = content.splitlines()
    return DocumentContext(
        file_path=file_path,
        raw_content=content,
        lines=lines,
        all_workspace_files=workspace_files or {file_path},
        config=config or {}
    )

class TestHeadingRules:
    def test_missing_h1_detected(self):
        ctx = make_context("docs/guide.md", "## Subheading\nSome text here.")
        findings = MissingH1Rule().validate(ctx)
        assert len(findings) == 1
        assert findings[0].rule_id == "HEAD-001"
        assert findings[0].severity == "error"

    def test_missing_h1_clean(self):
        ctx = make_context("docs/guide.md", "# Guide Title\n## Subheading\nSome text.")
        findings = MissingH1Rule().validate(ctx)
        assert len(findings) == 0

    def test_multiple_h1_detected(self):
        ctx = make_context("docs/guide.md", "# Title One\nParagraph.\n# Title Two\nAnother paragraph.")
        findings = MultipleH1Rule().validate(ctx)
        assert len(findings) == 1
        assert findings[0].rule_id == "HEAD-002"
        assert findings[0].line_number == 3

    def test_skipped_heading_level(self):
        ctx = make_context("docs/guide.md", "# Title\n### Jumped to H3\nText.")
        findings = SkippedHeadingLevelRule().validate(ctx)
        assert len(findings) == 1
        assert findings[0].rule_id == "HEAD-003"
        assert "skipped from H1 directly to H3" in findings[0].message

    def test_duplicate_headings(self):
        ctx = make_context("docs/guide.md", "# Main Title\n## Configuration\nText\n## Configuration\nMore text.")
        findings = DuplicateHeadingRule().validate(ctx)
        assert len(findings) == 1
        assert findings[0].rule_id == "HEAD-004"
        assert findings[0].line_number == 4

class TestLinkAndAssetRules:
    def test_broken_relative_link_detected(self):
        content = "# Title\nCheck out [API Docs](./missing.md) for details."
        ctx = make_context("guides/setup.md", content, workspace_files={"guides/setup.md", "guides/valid.md"})
        findings = BrokenRelativeLinksRule().validate(ctx)
        assert len(findings) == 1
        assert findings[0].rule_id == "LNK-001"
        assert findings[0].severity == "error"

    def test_valid_relative_link_passes(self):
        content = "# Title\nCheck out [Valid Docs](./valid.md) for details."
        ctx = make_context("guides/setup.md", content, workspace_files={"guides/setup.md", "guides/valid.md"})
        findings = BrokenRelativeLinksRule().validate(ctx)
        assert len(findings) == 0

    def test_external_links_ignored(self):
        content = "# Title\nVisit [GitHub](https://github.com) or [Email](mailto:team@clarity.dev)."
        ctx = make_context("guides/setup.md", content, workspace_files={"guides/setup.md"})
        findings = BrokenRelativeLinksRule().validate(ctx)
        assert len(findings) == 0

    def test_missing_local_image_detected(self):
        content = "# Title\n![Architecture](./images/non-existent.png)"
        ctx = make_context("guides/setup.md", content, workspace_files={"guides/setup.md"})
        findings = MissingLocalImageRule().validate(ctx)
        assert len(findings) == 1
        assert findings[0].rule_id == "IMG-001"

    def test_missing_image_alt_text_detected(self):
        content = "# Title\n![](./images/diagram.png)\n![   ](https://example.com/pic.png)"
        ctx = make_context("guides/setup.md", content, workspace_files={"guides/setup.md", "guides/images/diagram.png"})
        findings = MissingImageAltTextRule().validate(ctx)
        assert len(findings) == 2
        assert all(f.rule_id == "IMG-002" for f in findings)

class TestCodeAndStructureRules:
    def test_missing_code_block_language(self):
        content = "# Title\n```\nconst x = 1;\n```\n```ts\nconst y = 2;\n```"
        ctx = make_context("docs/api.md", content)
        findings = MissingCodeBlockLanguageRule().validate(ctx)
        assert len(findings) == 1
        assert findings[0].rule_id == "CODE-001"
        assert findings[0].line_number == 2

    def test_missing_required_sections_custom_and_default(self):
        content = "# Getting Started Guide\n## Installation\nSteps here."
        ctx = make_context("guides/getting-started.md", content)
        findings = MissingRequiredSectionsRule().validate(ctx)
        # Should flag missing Prerequisites
        assert any(f.rule_id == "STRUC-001" and "Prerequisites" in f.message for f in findings)

        # Test custom configuration
        ctx2 = make_context(
            "docs/page.md",
            "# Page Title\n## Overview\nSome text.",
            config={"required_sections": ["Overview", "Troubleshooting"]}
        )
        findings2 = MissingRequiredSectionsRule().validate(ctx2)
        assert len(findings2) == 1
        assert "Troubleshooting" in findings2[0].message

class TestStyleAndTerminologyRules:
    def test_glossary_terminology_inconsistency(self):
        content = "# Security\nThis API is depreciated. Configure the IP whitelist for on-premise clusters."
        ctx = make_context("docs/sec.md", content)
        findings = GlossaryTerminologyRule().validate(ctx)
        assert len(findings) >= 3
        rule_messages = " ".join(f.message for f in findings)
        assert "deprecated" in rule_messages
        assert "allowlist" in rule_messages
        assert "on-premises" in rule_messages

    def test_custom_glossary_support(self):
        content = "# Service\nWe use the master db."
        ctx = make_context("docs/service.md", content, config={"custom_glossary": {"master db": "primary database"}})
        findings = GlossaryTerminologyRule().validate(ctx)
        assert any("primary database" in f.suggested_fix for f in findings)

    def test_excessively_long_paragraph(self):
        long_paragraph = " ".join(["word"] * 160)
        content = f"# Overview\n\n{long_paragraph}\n\n## Next"
        ctx = make_context("docs/page.md", content)
        findings = ExcessivelyLongParagraphRule().validate(ctx)
        assert len(findings) == 1
        assert findings[0].rule_id == "LEN-001"
        assert "160 words" in findings[0].message

    def test_excessively_long_sentence(self):
        long_sentence = " ".join(["clarity"] * 40) + "."
        content = f"# Title\n\n{long_sentence}"
        ctx = make_context("docs/page.md", content)
        findings = ExcessivelyLongSentenceRule().validate(ctx)
        assert len(findings) == 1
        assert findings[0].rule_id == "LEN-002"

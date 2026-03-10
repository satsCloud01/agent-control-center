"""Tests for controlcenter.skills.skill_parser."""

import pytest
from pathlib import Path

from controlcenter.skills.skill_parser import (
    SkillParser, SkillRegistry, DEFAULT_WORKER_SKILL,
)
from controlcenter.models.skill_models import SkillDefinition


VALID_SKILL = """\
---
name: test-skill
description: A test skill
provider: anthropic
model: claude-sonnet-4-20250514
temperature: 0.5
max_tokens: 2048
tools:
  - web_search
  - file_read
tags:
  - research
  - analysis
---
You are a research assistant.
"""

MINIMAL_SKILL = """\
---
name: minimal
---
Do minimal things.
"""


class TestSkillParserText:
    def test_parse_valid(self):
        p = SkillParser()
        s = p.parse_text(VALID_SKILL)
        assert s.name == "test-skill"
        assert s.description == "A test skill"
        assert s.provider == "anthropic"
        assert s.tools == ["web_search", "file_read"]
        assert s.tags == ["research", "analysis"]
        assert "research assistant" in s.system_prompt

    def test_parse_minimal(self):
        p = SkillParser()
        s = p.parse_text(MINIMAL_SKILL)
        assert s.name == "minimal"
        assert s.description == ""
        assert s.provider is None
        assert s.tools == []
        assert s.tags == []

    def test_parse_no_frontmatter_raises(self):
        p = SkillParser()
        with pytest.raises(ValueError, match="missing YAML frontmatter"):
            p.parse_text("No frontmatter here")

    def test_parse_empty_raises(self):
        p = SkillParser()
        with pytest.raises(ValueError):
            p.parse_text("")

    def test_source_defaults_to_inline(self):
        p = SkillParser()
        s = p.parse_text(VALID_SKILL)
        assert s.source_path == "<inline>"

    def test_custom_source(self):
        p = SkillParser()
        s = p.parse_text(VALID_SKILL, source="my-file.md")
        assert s.source_path == "my-file.md"


class TestSkillParserFile:
    def test_parse_file(self, sample_skill_file):
        p = SkillParser()
        s = p.parse_file(sample_skill_file)
        assert s.name == "test-researcher"
        assert s.source_path == str(sample_skill_file)

    def test_parse_file_invalid(self, tmp_path):
        bad = tmp_path / "bad.skill.md"
        bad.write_text("no frontmatter", encoding="utf-8")
        p = SkillParser()
        with pytest.raises(ValueError):
            p.parse_file(bad)


class TestSkillParserDirectory:
    def test_parse_directory(self, skills_dir):
        p = SkillParser()
        results = p.parse_directory(skills_dir)
        assert len(results) == 2  # researcher + worker, not the .txt

    def test_parse_empty_directory(self, tmp_path):
        p = SkillParser()
        assert p.parse_directory(tmp_path) == []

    def test_parse_directory_skips_bad_files(self, tmp_path):
        d = tmp_path / "skills"
        d.mkdir()
        (d / "bad.skill.md").write_text("no frontmatter", encoding="utf-8")
        (d / "good.skill.md").write_text(MINIMAL_SKILL, encoding="utf-8")
        p = SkillParser()
        results = p.parse_directory(d)
        assert len(results) == 1


class TestSkillRegistry:
    def test_register_and_get(self):
        reg = SkillRegistry()
        s = SkillDefinition(name="test", system_prompt="prompt")
        reg.register(s)
        assert reg.get("test") is s

    def test_get_nonexistent(self):
        reg = SkillRegistry()
        assert reg.get("nope") is None

    def test_get_all(self):
        reg = SkillRegistry()
        reg.register(SkillDefinition(name="a", system_prompt="p"))
        reg.register(SkillDefinition(name="b", system_prompt="p"))
        assert len(reg.get_all()) == 2

    def test_remove_existing(self):
        reg = SkillRegistry()
        reg.register(SkillDefinition(name="x", system_prompt="p"))
        assert reg.remove("x") is True
        assert reg.get("x") is None

    def test_remove_nonexistent(self):
        reg = SkillRegistry()
        assert reg.remove("nope") is False

    def test_load_directory(self, skills_dir):
        reg = SkillRegistry()
        reg.load_directory(skills_dir)
        assert len(reg.get_all()) == 2

    def test_find_best_match_empty_skills_returns_default(self):
        reg = SkillRegistry()
        result = reg.find_best_match(["research"])
        assert result.name == DEFAULT_WORKER_SKILL.name

    def test_find_best_match_empty_requirements_returns_default(self):
        reg = SkillRegistry()
        result = reg.find_best_match([])
        assert result.name == DEFAULT_WORKER_SKILL.name

    def test_find_best_match_by_tag(self):
        reg = SkillRegistry()
        s = SkillDefinition(name="researcher", system_prompt="p", tags=["research"])
        reg.register(s)
        result = reg.find_best_match(["research"])
        assert result.name == "researcher"

    def test_find_best_match_by_name(self):
        reg = SkillRegistry()
        s = SkillDefinition(name="code-analyzer", system_prompt="p", tags=[])
        reg.register(s)
        result = reg.find_best_match(["code"])
        assert result.name == "code-analyzer"

    def test_find_best_match_prefers_tag_over_name(self):
        reg = SkillRegistry()
        reg.register(SkillDefinition(name="research-skill", system_prompt="p", tags=[]))
        reg.register(SkillDefinition(name="other", system_prompt="p", tags=["research"]))
        result = reg.find_best_match(["research"])
        assert result.name == "other"  # tag match scores higher

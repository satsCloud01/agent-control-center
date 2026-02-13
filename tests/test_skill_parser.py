"""Tests for the skill parser."""

from pathlib import Path
from textwrap import dedent

import pytest

from agent_control_center.skills.skill_parser import SkillParser, SkillRegistry


SAMPLE_SKILL = dedent("""\
    ---
    name: test-agent
    description: "A test agent for unit testing"
    provider: openai
    model: gpt-4o
    temperature: 0.5
    max_tokens: 2048
    tools:
      - web_search
      - code_execute
    tags:
      - testing
      - research
    ---

    # Test Agent

    You are a test agent. Do test things.
""")


class TestSkillParser:
    def test_parse_text(self):
        parser = SkillParser()
        skill = parser.parse_text(SAMPLE_SKILL)

        assert skill.name == "test-agent"
        assert skill.description == "A test agent for unit testing"
        assert skill.provider == "openai"
        assert skill.model == "gpt-4o"
        assert skill.temperature == 0.5
        assert skill.max_tokens == 2048
        assert skill.tools == ["web_search", "code_execute"]
        assert skill.tags == ["testing", "research"]
        assert "test agent" in skill.system_prompt.lower()

    def test_parse_text_minimal(self):
        minimal = dedent("""\
            ---
            name: minimal-agent
            ---

            You are minimal.
        """)
        parser = SkillParser()
        skill = parser.parse_text(minimal)

        assert skill.name == "minimal-agent"
        assert skill.description == ""
        assert skill.provider is None
        assert skill.tools == []

    def test_parse_text_invalid(self):
        parser = SkillParser()
        with pytest.raises(ValueError, match="missing YAML frontmatter"):
            parser.parse_text("No frontmatter here")

    def test_parse_directory(self, tmp_path):
        (tmp_path / "agent1.skill.md").write_text(SAMPLE_SKILL)
        (tmp_path / "not-a-skill.md").write_text("# Not a skill")

        parser = SkillParser()
        skills = parser.parse_directory(tmp_path)

        assert len(skills) == 1
        assert skills[0].name == "test-agent"


class TestSkillRegistry:
    def test_register_and_get(self):
        parser = SkillParser()
        skill = parser.parse_text(SAMPLE_SKILL)

        registry = SkillRegistry()
        registry.register(skill)

        assert registry.get("test-agent") is not None
        assert registry.get("nonexistent") is None

    def test_find_best_match(self):
        parser = SkillParser()
        skill = parser.parse_text(SAMPLE_SKILL)

        registry = SkillRegistry()
        registry.register(skill)

        match = registry.find_best_match(["testing"])
        assert match.name == "test-agent"

    def test_find_best_match_fallback(self):
        registry = SkillRegistry()
        match = registry.find_best_match(["unknown"])
        assert match.name == "general-worker"

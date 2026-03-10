"""Tests for controlcenter.models.skill_models."""

import pytest
from pydantic import ValidationError

from controlcenter.models.skill_models import SkillDefinition


class TestSkillDefinition:
    def test_valid_creation(self):
        s = SkillDefinition(name="test-skill", system_prompt="Do things.")
        assert s.name == "test-skill"
        assert s.system_prompt == "Do things."

    def test_defaults(self):
        s = SkillDefinition(name="x", system_prompt="y")
        assert s.description == ""
        assert s.provider is None
        assert s.model is None
        assert s.temperature is None
        assert s.max_tokens is None
        assert s.tools == []
        assert s.tags == []
        assert s.source_path == ""
        assert s.mcp_servers == []

    def test_missing_name_raises(self):
        with pytest.raises(ValidationError):
            SkillDefinition(system_prompt="y")

    def test_missing_system_prompt_raises(self):
        with pytest.raises(ValidationError):
            SkillDefinition(name="x")

    def test_temperature_range_low(self):
        with pytest.raises(ValidationError):
            SkillDefinition(name="x", system_prompt="y", temperature=-0.1)

    def test_temperature_range_high(self):
        with pytest.raises(ValidationError):
            SkillDefinition(name="x", system_prompt="y", temperature=1.5)

    def test_max_tokens_too_low(self):
        with pytest.raises(ValidationError):
            SkillDefinition(name="x", system_prompt="y", max_tokens=50)

    def test_max_tokens_too_high(self):
        with pytest.raises(ValidationError):
            SkillDefinition(name="x", system_prompt="y", max_tokens=20000)

    def test_full_creation(self):
        s = SkillDefinition(
            name="researcher",
            description="Researches stuff",
            provider="anthropic",
            model="claude-sonnet-4-20250514",
            temperature=0.5,
            max_tokens=2048,
            tools=["web_search"],
            tags=["research"],
            system_prompt="Research things.",
            source_path="/tmp/test.skill.md",
        )
        assert s.tools == ["web_search"]
        assert s.tags == ["research"]

"""Shared fixtures for Agent Control Center tests."""

from __future__ import annotations

import tempfile
from pathlib import Path

import pytest

from controlcenter.config import Config
from controlcenter.core.agent_registry import AgentRegistry
from controlcenter.models.agent_models import AgentRecord, AgentStatus
from controlcenter.persistence.database import Database
from controlcenter.persistence.audit_logger import AuditLogger


SAMPLE_SKILL_TEXT = """\
---
name: test-researcher
description: A test research agent
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
You are a research assistant. Find information and provide clear summaries.
"""

SAMPLE_SKILL_TEXT_MINIMAL = """\
---
name: simple-worker
---
You are a simple worker agent.
"""


@pytest.fixture
def tmp_db(tmp_path):
    """Create a temporary database."""
    db_path = str(tmp_path / "test_audit.db")
    db = Database(db_path)
    yield db
    db.close()


@pytest.fixture
def audit_logger(tmp_db):
    """Create an audit logger with a temp database."""
    return AuditLogger(tmp_db)


@pytest.fixture
def config(tmp_path):
    """Create a Config with temp directories."""
    return Config(
        skills_dir=str(tmp_path / "skills"),
        data_dir=str(tmp_path / "data"),
        workspace_dir=str(tmp_path / "workspace"),
    )


@pytest.fixture(autouse=True)
def reset_registry():
    """Reset the AgentRegistry singleton before each test."""
    AgentRegistry.reset()
    yield
    AgentRegistry.reset()


@pytest.fixture
def sample_agent() -> AgentRecord:
    """Create a sample agent record."""
    return AgentRecord(
        name="test-agent",
        skill_name="test-researcher",
        assigned_task="Research AI trends",
        llm_provider="anthropic",
        llm_model="claude-sonnet-4-20250514",
        agent_id="agent-001",
    )


@pytest.fixture
def sample_skill_file(tmp_path) -> Path:
    """Create a temporary .skill.md file."""
    skill_file = tmp_path / "test-researcher.skill.md"
    skill_file.write_text(SAMPLE_SKILL_TEXT, encoding="utf-8")
    return skill_file


@pytest.fixture
def skills_dir(tmp_path) -> Path:
    """Create a directory with multiple skill files."""
    d = tmp_path / "skills"
    d.mkdir()
    (d / "researcher.skill.md").write_text(SAMPLE_SKILL_TEXT, encoding="utf-8")
    (d / "worker.skill.md").write_text(SAMPLE_SKILL_TEXT_MINIMAL, encoding="utf-8")
    (d / "not-a-skill.txt").write_text("ignored", encoding="utf-8")
    return d

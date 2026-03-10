"""Tests for controlcenter.models.agent_models."""

from datetime import datetime, timezone

from controlcenter.models.agent_models import AgentRecord, AgentStatus


class TestAgentStatus:
    def test_idle_value(self):
        assert AgentStatus.IDLE.value == "idle"

    def test_running_value(self):
        assert AgentStatus.RUNNING.value == "running"

    def test_completed_value(self):
        assert AgentStatus.COMPLETED.value == "completed"

    def test_failed_value(self):
        assert AgentStatus.FAILED.value == "failed"

    def test_waiting_value(self):
        assert AgentStatus.WAITING.value == "waiting"

    def test_is_string_enum(self):
        assert isinstance(AgentStatus.IDLE, str)


class TestAgentRecord:
    def test_creation_with_required_fields(self):
        r = AgentRecord(
            name="test", skill_name="worker", assigned_task="do stuff",
            llm_provider="anthropic", llm_model="claude-sonnet-4-20250514",
        )
        assert r.name == "test"
        assert r.status == AgentStatus.IDLE
        assert r.parent_id is None
        assert r.result is None
        assert r.error is None
        assert isinstance(r.agent_id, str)
        assert len(r.agent_id) > 0

    def test_default_created_at_is_utc(self):
        r = AgentRecord(
            name="t", skill_name="s", assigned_task="a",
            llm_provider="p", llm_model="m",
        )
        assert r.created_at.tzinfo == timezone.utc

    def test_to_dict_keys(self):
        r = AgentRecord(
            name="t", skill_name="s", assigned_task="a",
            llm_provider="p", llm_model="m", agent_id="id-1",
        )
        d = r.to_dict()
        expected_keys = {
            "agent_id", "name", "skill_name", "assigned_task",
            "llm_provider", "llm_model", "parent_id", "status",
            "created_at", "result", "error",
        }
        assert set(d.keys()) == expected_keys

    def test_to_dict_status_is_string(self):
        r = AgentRecord(
            name="t", skill_name="s", assigned_task="a",
            llm_provider="p", llm_model="m",
        )
        d = r.to_dict()
        assert d["status"] == "idle"

    def test_to_dict_created_at_is_iso(self):
        r = AgentRecord(
            name="t", skill_name="s", assigned_task="a",
            llm_provider="p", llm_model="m",
        )
        d = r.to_dict()
        # Should parse back as a datetime
        datetime.fromisoformat(d["created_at"])

    def test_messages_default_empty_list(self):
        r = AgentRecord(
            name="t", skill_name="s", assigned_task="a",
            llm_provider="p", llm_model="m",
        )
        assert r.messages == []

    def test_custom_agent_id(self):
        r = AgentRecord(
            name="t", skill_name="s", assigned_task="a",
            llm_provider="p", llm_model="m", agent_id="custom-id",
        )
        assert r.agent_id == "custom-id"

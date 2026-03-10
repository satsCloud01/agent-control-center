"""Tests for controlcenter.core.agent_registry."""

import threading

from controlcenter.core.agent_registry import AgentRegistry
from controlcenter.models.agent_models import AgentRecord, AgentStatus


def _make_agent(agent_id="a1", parent_id=None):
    return AgentRecord(
        name="test", skill_name="worker", assigned_task="task",
        llm_provider="anthropic", llm_model="m",
        agent_id=agent_id, parent_id=parent_id,
    )


class TestSingleton:
    def test_same_instance(self):
        r1 = AgentRegistry()
        r2 = AgentRegistry()
        assert r1 is r2

    def test_reset_creates_new_instance(self):
        r1 = AgentRegistry()
        AgentRegistry.reset()
        r2 = AgentRegistry()
        assert r1 is not r2


class TestRegister:
    def test_register_returns_agent_id(self):
        reg = AgentRegistry()
        aid = reg.register(_make_agent("a1"))
        assert aid == "a1"

    def test_register_stores_agent(self):
        reg = AgentRegistry()
        reg.register(_make_agent("a1"))
        assert reg.get_agent("a1") is not None

    def test_register_with_parent_adds_relationship(self):
        reg = AgentRegistry()
        reg.register(_make_agent("child", parent_id="parent"))
        rels = reg.get_relationships()
        assert len(rels) == 1
        assert rels[0] == ("parent", "child", "spawned")


class TestUpdateStatus:
    def test_update_status(self):
        reg = AgentRegistry()
        reg.register(_make_agent("a1"))
        reg.update_status("a1", AgentStatus.RUNNING)
        assert reg.get_agent("a1").status == AgentStatus.RUNNING

    def test_update_with_result(self):
        reg = AgentRegistry()
        reg.register(_make_agent("a1"))
        reg.update_status("a1", AgentStatus.COMPLETED, result="done")
        assert reg.get_agent("a1").result == "done"

    def test_update_with_error(self):
        reg = AgentRegistry()
        reg.register(_make_agent("a1"))
        reg.update_status("a1", AgentStatus.FAILED, error="boom")
        assert reg.get_agent("a1").error == "boom"

    def test_update_nonexistent_agent_no_error(self):
        reg = AgentRegistry()
        reg.update_status("nonexistent", AgentStatus.RUNNING)  # Should not raise


class TestGetAll:
    def test_empty(self):
        reg = AgentRegistry()
        assert reg.get_all() == []

    def test_multiple_agents(self):
        reg = AgentRegistry()
        reg.register(_make_agent("a1"))
        reg.register(_make_agent("a2"))
        assert len(reg.get_all()) == 2


class TestGetChildren:
    def test_returns_children(self):
        reg = AgentRegistry()
        reg.register(_make_agent("parent"))
        reg.register(_make_agent("c1", parent_id="parent"))
        reg.register(_make_agent("c2", parent_id="parent"))
        children = reg.get_children("parent")
        assert len(children) == 2

    def test_no_children(self):
        reg = AgentRegistry()
        reg.register(_make_agent("parent"))
        assert reg.get_children("parent") == []


class TestClear:
    def test_clear_removes_all(self):
        reg = AgentRegistry()
        reg.register(_make_agent("a1"))
        reg.register(_make_agent("c1", parent_id="a1"))
        reg.clear()
        assert reg.get_all() == []
        assert reg.get_relationships() == []


class TestThreadSafety:
    def test_concurrent_registers(self):
        reg = AgentRegistry()
        errors = []

        def register_agents(start):
            try:
                for i in range(50):
                    reg.register(_make_agent(f"thread-{start}-{i}"))
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=register_agents, args=(t,)) for t in range(4)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert len(errors) == 0
        assert len(reg.get_all()) == 200

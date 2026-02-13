"""Tests for the agent registry."""

import pytest

from agent_control_center.core.agent_registry import AgentRegistry
from agent_control_center.models.agent_models import AgentRecord, AgentStatus


@pytest.fixture(autouse=True)
def reset_registry():
    AgentRegistry.reset()
    yield
    AgentRegistry.reset()


class TestAgentRegistry:
    def test_singleton(self):
        r1 = AgentRegistry()
        r2 = AgentRegistry()
        assert r1 is r2

    def test_register_and_get(self):
        registry = AgentRegistry()
        record = AgentRecord(
            name="test-agent",
            skill_name="test-skill",
            assigned_task="Do something",
            llm_provider="openai",
            llm_model="gpt-4o",
        )
        agent_id = registry.register(record)

        retrieved = registry.get_agent(agent_id)
        assert retrieved is not None
        assert retrieved.name == "test-agent"

    def test_update_status(self):
        registry = AgentRegistry()
        record = AgentRecord(
            name="test",
            skill_name="skill",
            assigned_task="task",
            llm_provider="openai",
            llm_model="gpt-4o",
        )
        agent_id = registry.register(record)

        registry.update_status(agent_id, AgentStatus.RUNNING)
        assert registry.get_agent(agent_id).status == AgentStatus.RUNNING

        registry.update_status(agent_id, AgentStatus.COMPLETED, result="done")
        agent = registry.get_agent(agent_id)
        assert agent.status == AgentStatus.COMPLETED
        assert agent.result == "done"

    def test_get_all(self):
        registry = AgentRegistry()
        for i in range(3):
            registry.register(
                AgentRecord(
                    name=f"agent-{i}",
                    skill_name="skill",
                    assigned_task=f"task-{i}",
                    llm_provider="openai",
                    llm_model="gpt-4o",
                )
            )
        assert len(registry.get_all()) == 3

    def test_parent_child_relationships(self):
        registry = AgentRegistry()
        parent = AgentRecord(
            name="parent",
            skill_name="supervisor",
            assigned_task="supervise",
            llm_provider="anthropic",
            llm_model="claude-sonnet",
        )
        registry.register(parent)

        child = AgentRecord(
            name="child",
            skill_name="worker",
            assigned_task="work",
            llm_provider="openai",
            llm_model="gpt-4o",
            parent_id=parent.agent_id,
        )
        registry.register(child)

        children = registry.get_children(parent.agent_id)
        assert len(children) == 1
        assert children[0].name == "child"

        relationships = registry.get_relationships()
        assert len(relationships) == 1
        assert relationships[0][0] == parent.agent_id
        assert relationships[0][1] == child.agent_id

    def test_clear(self):
        registry = AgentRegistry()
        registry.register(
            AgentRecord(
                name="test",
                skill_name="s",
                assigned_task="t",
                llm_provider="openai",
                llm_model="m",
            )
        )
        registry.clear()
        assert len(registry.get_all()) == 0

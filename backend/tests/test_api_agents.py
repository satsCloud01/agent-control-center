"""Tests for the agents API router."""

import pytest
from fastapi.testclient import TestClient

from controlcenter.main import app
from controlcenter.models.agent_models import AgentRecord


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


class TestListAgents:
    def test_empty(self, client):
        resp = client.get("/api/agents")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_with_agent(self, client):
        registry = app.state.registry
        registry.register(AgentRecord(
            name="a1", skill_name="s", assigned_task="t",
            llm_provider="p", llm_model="m", agent_id="api-a1",
        ))
        resp = client.get("/api/agents")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1


class TestGetAgent:
    def test_not_found(self, client):
        resp = client.get("/api/agents/nonexistent")
        assert resp.status_code == 404

    def test_found(self, client):
        registry = app.state.registry
        registry.register(AgentRecord(
            name="a2", skill_name="s", assigned_task="t",
            llm_provider="p", llm_model="m", agent_id="api-a2",
        ))
        resp = client.get("/api/agents/api-a2")
        assert resp.status_code == 200
        assert resp.json()["agent_id"] == "api-a2"


class TestGetChildren:
    def test_no_children(self, client):
        resp = client.get("/api/agents/some-parent/children")
        assert resp.status_code == 200
        assert resp.json() == []


class TestRelationships:
    def test_empty_relationships(self, client):
        resp = client.get("/api/agents/relationships/all")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


class TestClearAgents:
    def test_clear(self, client):
        registry = app.state.registry
        registry.register(AgentRecord(
            name="x", skill_name="s", assigned_task="t",
            llm_provider="p", llm_model="m", agent_id="clear-test",
        ))
        resp = client.delete("/api/agents/clear")
        assert resp.status_code == 200
        assert resp.json()["status"] == "cleared"
        assert client.get("/api/agents").json() == []

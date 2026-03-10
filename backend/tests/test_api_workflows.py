"""Tests for the workflows API router."""

import pytest
from fastapi.testclient import TestClient

from controlcenter.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


class TestListWorkflows:
    def test_list_empty(self, client):
        resp = client.get("/api/workflows")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_with_limit(self, client):
        resp = client.get("/api/workflows?limit=5")
        assert resp.status_code == 200


class TestGetWorkflow:
    def test_not_found(self, client):
        resp = client.get("/api/workflows/nonexistent-id")
        assert resp.status_code == 404

    def test_get_existing(self, client):
        import uuid
        wf_id = f"test-wf-{uuid.uuid4().hex[:8]}"
        audit = app.state.audit_logger
        audit.start_workflow(wf_id, "Test problem")
        resp = client.get(f"/api/workflows/{wf_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == wf_id


class TestGetWorkflowEvents:
    def test_events_empty(self, client):
        resp = client.get("/api/workflows/wf-x/events")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


class TestGetWorkflowMessages:
    def test_messages_empty(self, client):
        resp = client.get("/api/workflows/wf-x/messages")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


class TestLaunchWorkflow:
    def test_missing_anthropic_key(self, client):
        resp = client.post("/api/workflows", json={
            "problem_statement": "Hello",
            "provider": "anthropic",
        })
        assert resp.status_code == 400
        assert "Anthropic API key" in resp.json()["detail"]

    def test_missing_openai_key(self, client):
        resp = client.post("/api/workflows", json={
            "problem_statement": "Hello",
            "provider": "openai",
        })
        assert resp.status_code == 400
        assert "OpenAI API key" in resp.json()["detail"]

    def test_missing_problem_statement(self, client):
        resp = client.post("/api/workflows", json={})
        assert resp.status_code == 422  # Pydantic validation error

    def test_launch_requires_body(self, client):
        resp = client.post("/api/workflows")
        assert resp.status_code == 422

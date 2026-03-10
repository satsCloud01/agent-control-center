"""Tests for the audit API router."""

import pytest
from fastapi.testclient import TestClient

from controlcenter.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


class TestGetEvents:
    def test_events_default(self, client):
        resp = client.get("/api/audit/events")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_events_with_workflow_filter(self, client):
        resp = client.get("/api/audit/events?workflow_id=wf-1")
        assert resp.status_code == 200

    def test_events_with_limit(self, client):
        resp = client.get("/api/audit/events?limit=5")
        assert resp.status_code == 200


class TestGetMessages:
    def test_messages_no_workflow(self, client):
        resp = client.get("/api/audit/messages")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_messages_with_workflow(self, client):
        resp = client.get("/api/audit/messages?workflow_id=wf-1")
        assert resp.status_code == 200


class TestGetStats:
    def test_stats_structure(self, client):
        resp = client.get("/api/audit/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "workflows" in data
        assert "agents" in data
        assert "total" in data["workflows"]
        assert "completed" in data["workflows"]
        assert "failed" in data["workflows"]
        assert "running" in data["workflows"]

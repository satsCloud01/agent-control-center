"""Tests for the settings API router."""

import pytest
from fastapi.testclient import TestClient

from controlcenter.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


class TestGetSettings:
    def test_returns_settings(self, client):
        resp = client.get("/api/settings")
        assert resp.status_code == 200
        data = resp.json()
        assert data["default_provider"] == "anthropic"
        assert "available_providers" in data
        assert "available_tools" in data
        assert "loaded_skills" in data

    def test_no_secrets_exposed(self, client):
        resp = client.get("/api/settings")
        data = resp.json()
        text = str(data)
        assert "api_key" not in text.lower() or "openai_api_key" not in text

    def test_providers_list(self, client):
        resp = client.get("/api/settings")
        providers = resp.json()["available_providers"]
        ids = [p["id"] for p in providers]
        assert "anthropic" in ids
        assert "openai" in ids


class TestHealth:
    def test_health_check(self, client):
        resp = client.get("/api/settings/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"


class TestRootEndpoint:
    def test_root(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["app"] == "Agent Control Center"
        assert data["version"] == "2.0.0"

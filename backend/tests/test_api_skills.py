"""Tests for the skills API router."""

import pytest
from fastapi.testclient import TestClient

from controlcenter.main import app


VALID_SKILL_CONTENT = """\
---
name: api-test-skill
description: Test skill via API
tags:
  - test
---
You are a test agent.
"""


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


class TestListSkills:
    def test_list(self, client):
        resp = client.get("/api/skills")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


class TestCreateSkill:
    def test_create_valid(self, client):
        resp = client.post("/api/skills", json={"content": VALID_SKILL_CONTENT})
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "api-test-skill"
        assert data["description"] == "Test skill via API"

    def test_create_invalid(self, client):
        resp = client.post("/api/skills", json={"content": "no frontmatter"})
        assert resp.status_code == 400

    def test_create_missing_content(self, client):
        resp = client.post("/api/skills", json={})
        assert resp.status_code == 422

    def test_create_then_get(self, client):
        client.post("/api/skills", json={"content": VALID_SKILL_CONTENT})
        resp = client.get("/api/skills/api-test-skill")
        assert resp.status_code == 200
        assert resp.json()["name"] == "api-test-skill"


class TestGetSkill:
    def test_not_found(self, client):
        resp = client.get("/api/skills/nonexistent-skill")
        assert resp.status_code == 404


class TestDeleteSkill:
    def test_delete_existing(self, client):
        client.post("/api/skills", json={"content": VALID_SKILL_CONTENT})
        resp = client.delete("/api/skills/api-test-skill")
        assert resp.status_code == 200
        assert resp.json()["status"] == "deleted"
        # Verify gone
        assert client.get("/api/skills/api-test-skill").status_code == 404

    def test_delete_nonexistent(self, client):
        resp = client.delete("/api/skills/nope")
        assert resp.status_code == 404


class TestAvailableTools:
    def test_list_tools(self, client):
        resp = client.get("/api/skills/tools/available")
        assert resp.status_code == 200
        tools = resp.json()["tools"]
        assert len(tools) == 5
        names = [t["name"] for t in tools]
        assert "web_search" in names
        assert "code_execute" in names

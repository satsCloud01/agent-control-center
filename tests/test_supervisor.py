"""Tests for supervisor orchestration utilities."""

import json

from agent_control_center.orchestration.supervisor import _parse_subtasks_json


class TestParseSubtasksJson:
    def test_valid_json(self):
        text = json.dumps([
            {
                "task_id": "task_1",
                "description": "Research something",
                "required_skills": ["research"],
                "tool_requirements": ["web_search"],
            }
        ])
        result = _parse_subtasks_json(text)
        assert len(result) == 1
        assert result[0]["task_id"] == "task_1"

    def test_json_in_code_block(self):
        text = """Here's the breakdown:
```json
[
  {"task_id": "task_1", "description": "Do thing 1", "required_skills": [], "tool_requirements": []},
  {"task_id": "task_2", "description": "Do thing 2", "required_skills": [], "tool_requirements": []}
]
```
"""
        result = _parse_subtasks_json(text)
        assert len(result) == 2

    def test_json_with_surrounding_text(self):
        text = 'Here are the subtasks: [{"task_id": "t1", "description": "x"}] hope that helps!'
        result = _parse_subtasks_json(text)
        assert len(result) == 1

    def test_invalid_json_fallback(self):
        text = "This is not valid JSON at all"
        result = _parse_subtasks_json(text)
        assert len(result) == 1
        assert result[0]["task_id"] == "task_1"

    def test_multiple_subtasks(self):
        subtasks = [
            {"task_id": f"task_{i}", "description": f"Task {i}", "required_skills": [], "tool_requirements": []}
            for i in range(5)
        ]
        result = _parse_subtasks_json(json.dumps(subtasks))
        assert len(result) == 5

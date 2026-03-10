"""Tests for _parse_subtasks_json in controlcenter.orchestration.supervisor."""

from controlcenter.orchestration.supervisor import _parse_subtasks_json


class TestParseSubtasksJson:
    def test_valid_json_array(self):
        text = '[{"task_id": "t1", "description": "Do A"}]'
        result = _parse_subtasks_json(text)
        assert len(result) == 1
        assert result[0]["task_id"] == "t1"

    def test_json_in_code_block(self):
        text = '```json\n[{"task_id": "t1", "description": "Do A"}]\n```'
        result = _parse_subtasks_json(text)
        assert len(result) == 1
        assert result[0]["task_id"] == "t1"

    def test_code_block_no_lang(self):
        text = '```\n[{"task_id": "t1", "description": "x"}]\n```'
        result = _parse_subtasks_json(text)
        assert len(result) == 1

    def test_surrounding_text(self):
        text = 'Here are the subtasks:\n[{"task_id": "t1", "description": "x"}]\nDone.'
        result = _parse_subtasks_json(text)
        assert len(result) == 1
        assert result[0]["task_id"] == "t1"

    def test_multiple_subtasks(self):
        text = '[{"task_id": "t1", "description": "A"}, {"task_id": "t2", "description": "B"}]'
        result = _parse_subtasks_json(text)
        assert len(result) == 2

    def test_invalid_json_fallback(self):
        text = "This is not JSON at all"
        result = _parse_subtasks_json(text)
        assert len(result) == 1
        assert result[0]["task_id"] == "task_1"
        assert result[0]["description"] == "Complete the full task as described"

    def test_json_object_not_array_fallback(self):
        text = '{"task_id": "t1"}'
        result = _parse_subtasks_json(text)
        # Not a list, so fallback
        assert len(result) == 1
        assert result[0]["task_id"] == "task_1"

    def test_empty_array(self):
        text = "[]"
        result = _parse_subtasks_json(text)
        assert result == []

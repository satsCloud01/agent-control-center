"""Tests for controlcenter.persistence.audit_logger."""

from controlcenter.persistence.audit_logger import AuditLogger


class TestLogEvent:
    def test_log_basic(self, audit_logger):
        audit_logger.log("test_event", {"key": "value"})
        events = audit_logger.get_events()
        assert len(events) == 1
        assert events[0]["event_type"] == "test_event"

    def test_log_with_agent(self, audit_logger):
        audit_logger.log("evt", {"x": 1}, agent_id="a1", agent_name="Agent1")
        events = audit_logger.get_events()
        assert events[0]["agent_id"] == "a1"
        assert events[0]["agent_name"] == "Agent1"

    def test_log_with_workflow(self, audit_logger):
        audit_logger.log("evt", {"x": 1}, workflow_id="wf-1")
        events = audit_logger.get_events(workflow_id="wf-1")
        assert len(events) == 1

    def test_log_level(self, audit_logger):
        audit_logger.log("err", {"msg": "bad"}, level="ERROR")
        events = audit_logger.get_events()
        assert events[0]["level"] == "ERROR"


class TestLogMessage:
    def test_log_message(self, audit_logger):
        audit_logger.log_message("wf-1", "a1", "user", "Hello")
        msgs = audit_logger.get_messages("wf-1")
        assert len(msgs) == 1
        assert msgs[0]["content"] == "Hello"
        assert msgs[0]["role"] == "user"

    def test_filter_by_agent(self, audit_logger):
        audit_logger.log_message("wf-1", "a1", "user", "msg1")
        audit_logger.log_message("wf-1", "a2", "assistant", "msg2")
        msgs = audit_logger.get_messages("wf-1", agent_id="a1")
        assert len(msgs) == 1
        assert msgs[0]["agent_id"] == "a1"


class TestWorkflows:
    def test_start_workflow(self, audit_logger):
        audit_logger.start_workflow("wf-1", "Solve a problem")
        wfs = audit_logger.get_workflows()
        assert len(wfs) == 1
        assert wfs[0]["id"] == "wf-1"
        assert wfs[0]["status"] == "running"

    def test_complete_workflow(self, audit_logger):
        audit_logger.start_workflow("wf-1", "problem")
        audit_logger.complete_workflow("wf-1", "result text", 3)
        wfs = audit_logger.get_workflows()
        assert wfs[0]["status"] == "completed"
        assert wfs[0]["final_result"] == "result text"
        assert wfs[0]["subtask_count"] == 3

    def test_fail_workflow(self, audit_logger):
        audit_logger.start_workflow("wf-1", "problem")
        audit_logger.fail_workflow("wf-1", "something broke")
        wfs = audit_logger.get_workflows()
        assert wfs[0]["status"] == "failed"

    def test_get_workflows_limit(self, audit_logger):
        for i in range(5):
            audit_logger.start_workflow(f"wf-{i}", f"problem {i}")
        wfs = audit_logger.get_workflows(limit=3)
        assert len(wfs) == 3

    def test_get_events_limit(self, audit_logger):
        for i in range(10):
            audit_logger.log("evt", {"i": i})
        events = audit_logger.get_events(limit=5)
        assert len(events) == 5

    def test_workflow_creates_audit_event(self, audit_logger):
        audit_logger.start_workflow("wf-1", "test problem")
        events = audit_logger.get_events(workflow_id="wf-1")
        assert any(e["event_type"] == "workflow_started" for e in events)

"""Structured audit event logging."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from controlcenter.persistence.database import Database

logger = logging.getLogger(__name__)


class AuditLogger:
    def __init__(self, db: Database):
        self._db = db

    def log(
        self,
        event_type: str,
        detail: dict,
        agent_id: str | None = None,
        agent_name: str | None = None,
        workflow_id: str | None = None,
        level: str = "INFO",
    ):
        self._db.execute(
            "INSERT INTO audit_events (event_type, agent_id, agent_name, workflow_id, detail, level) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (event_type, agent_id, agent_name, workflow_id, json.dumps(detail), level),
        )
        logger.info("[%s] %s agent=%s workflow=%s", event_type, level, agent_id, workflow_id)

    def log_message(
        self,
        workflow_id: str,
        agent_id: str,
        role: str,
        content: str,
        tool_calls: list | None = None,
    ):
        self._db.execute(
            "INSERT INTO agent_messages (workflow_id, agent_id, role, content, tool_calls) "
            "VALUES (?, ?, ?, ?, ?)",
            (workflow_id, agent_id, role, content, json.dumps(tool_calls) if tool_calls else None),
        )

    def start_workflow(self, workflow_id: str, problem_statement: str):
        self._db.execute(
            "INSERT INTO workflow_runs (id, problem_statement, status) VALUES (?, ?, 'running')",
            (workflow_id, problem_statement),
        )
        self.log("workflow_started", {"problem": problem_statement}, workflow_id=workflow_id)

    def complete_workflow(self, workflow_id: str, final_result: str, subtask_count: int):
        self._db.execute(
            "UPDATE workflow_runs SET status='completed', completed_at=?, final_result=?, subtask_count=? WHERE id=?",
            (datetime.now(timezone.utc).isoformat(), final_result, subtask_count, workflow_id),
        )
        self.log("workflow_completed", {"subtask_count": subtask_count}, workflow_id=workflow_id)

    def fail_workflow(self, workflow_id: str, error: str):
        self._db.execute(
            "UPDATE workflow_runs SET status='failed', completed_at=? WHERE id=?",
            (datetime.now(timezone.utc).isoformat(), workflow_id),
        )
        self.log("workflow_failed", {"error": error}, workflow_id=workflow_id, level="ERROR")

    def get_events(
        self, workflow_id: str | None = None, limit: int = 100
    ) -> list[dict]:
        if workflow_id:
            rows = self._db.fetchall(
                "SELECT * FROM audit_events WHERE workflow_id=? ORDER BY timestamp DESC LIMIT ?",
                (workflow_id, limit),
            )
        else:
            rows = self._db.fetchall(
                "SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT ?", (limit,)
            )
        return [dict(r) for r in rows]

    def get_messages(self, workflow_id: str, agent_id: str | None = None) -> list[dict]:
        if agent_id:
            rows = self._db.fetchall(
                "SELECT * FROM agent_messages WHERE workflow_id=? AND agent_id=? ORDER BY timestamp",
                (workflow_id, agent_id),
            )
        else:
            rows = self._db.fetchall(
                "SELECT * FROM agent_messages WHERE workflow_id=? ORDER BY timestamp",
                (workflow_id,),
            )
        return [dict(r) for r in rows]

    def get_workflows(self, limit: int = 20) -> list[dict]:
        rows = self._db.fetchall(
            "SELECT * FROM workflow_runs ORDER BY started_at DESC LIMIT ?", (limit,)
        )
        return [dict(r) for r in rows]

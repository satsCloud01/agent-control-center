"""SQLite database connection and schema management."""

from __future__ import annotations

import sqlite3
import threading
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    event_type TEXT NOT NULL,
    agent_id TEXT,
    agent_name TEXT,
    workflow_id TEXT,
    detail TEXT,
    level TEXT DEFAULT 'INFO'
);

CREATE TABLE IF NOT EXISTS agent_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    workflow_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    tool_calls TEXT
);

CREATE TABLE IF NOT EXISTS workflow_runs (
    id TEXT PRIMARY KEY,
    problem_statement TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running',
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    final_result TEXT,
    subtask_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_audit_workflow ON audit_events(workflow_id);
CREATE INDEX IF NOT EXISTS idx_audit_agent ON audit_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_workflow ON agent_messages(workflow_id);
"""


class Database:
    def __init__(self, db_path: str):
        self._path = Path(db_path)
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(self._path), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._db_lock = threading.Lock()
        self._conn.executescript(SCHEMA)

    def execute(self, query: str, params: tuple = ()) -> sqlite3.Cursor:
        with self._db_lock:
            cursor = self._conn.execute(query, params)
            self._conn.commit()
            return cursor

    def fetchall(self, query: str, params: tuple = ()) -> list[sqlite3.Row]:
        with self._db_lock:
            return self._conn.execute(query, params).fetchall()

    def fetchone(self, query: str, params: tuple = ()) -> sqlite3.Row | None:
        with self._db_lock:
            return self._conn.execute(query, params).fetchone()

    def close(self):
        self._conn.close()

"""Thread-safe singleton registry of all live agents."""

from __future__ import annotations

import threading
from datetime import datetime, timezone

from agent_control_center.models.agent_models import AgentRecord, AgentStatus


class AgentRegistry:
    _instance: AgentRegistry | None = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._agents: dict[str, AgentRecord] = {}
                cls._instance._relationships: list[tuple[str, str, str]] = []
            return cls._instance

    def register(self, record: AgentRecord) -> str:
        with self._lock:
            self._agents[record.agent_id] = record
            if record.parent_id:
                self._relationships.append(
                    (record.parent_id, record.agent_id, "spawned")
                )
            return record.agent_id

    def update_status(
        self,
        agent_id: str,
        status: AgentStatus,
        result: str | None = None,
        error: str | None = None,
    ):
        with self._lock:
            if agent_id in self._agents:
                self._agents[agent_id].status = status
                if result is not None:
                    self._agents[agent_id].result = result
                if error is not None:
                    self._agents[agent_id].error = error

    def get_agent(self, agent_id: str) -> AgentRecord | None:
        return self._agents.get(agent_id)

    def get_all(self) -> list[AgentRecord]:
        return list(self._agents.values())

    def get_children(self, parent_id: str) -> list[AgentRecord]:
        return [a for a in self._agents.values() if a.parent_id == parent_id]

    def add_relationship(self, parent_id: str, child_id: str, rel_type: str):
        with self._lock:
            self._relationships.append((parent_id, child_id, rel_type))

    def get_relationships(self) -> list[tuple[str, str, str]]:
        return list(self._relationships)

    def clear(self):
        with self._lock:
            self._agents.clear()
            self._relationships.clear()

    @classmethod
    def reset(cls):
        """Reset the singleton (for testing)."""
        with cls._lock:
            cls._instance = None

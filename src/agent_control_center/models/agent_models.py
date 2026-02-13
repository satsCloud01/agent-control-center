"""Agent data models."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4


class AgentStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    WAITING = "waiting"


@dataclass
class AgentRecord:
    name: str
    skill_name: str
    assigned_task: str
    llm_provider: str
    llm_model: str
    agent_id: str = field(default_factory=lambda: str(uuid4()))
    parent_id: str | None = None
    status: AgentStatus = AgentStatus.IDLE
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    messages: list[dict] = field(default_factory=list)
    result: str | None = None
    error: str | None = None

    def to_dict(self) -> dict:
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "skill_name": self.skill_name,
            "assigned_task": self.assigned_task,
            "llm_provider": self.llm_provider,
            "llm_model": self.llm_model,
            "parent_id": self.parent_id,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "result": self.result,
            "error": self.error,
        }

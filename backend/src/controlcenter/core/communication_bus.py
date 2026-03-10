"""Async pub/sub message bus for inter-agent communication."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class AgentMessage:
    sender_id: str
    content: str
    message_type: str  # task_assignment, result, status_update, query
    recipient_id: str | None = None  # None = broadcast
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    correlation_id: str | None = None


class CommunicationBus:
    def __init__(self):
        self._queues: dict[str, asyncio.Queue[AgentMessage]] = {}
        self._message_log: list[AgentMessage] = []

    def register_agent(self, agent_id: str):
        if agent_id not in self._queues:
            self._queues[agent_id] = asyncio.Queue()

    def unregister_agent(self, agent_id: str):
        self._queues.pop(agent_id, None)

    async def send(self, message: AgentMessage):
        self._message_log.append(message)
        if message.recipient_id:
            if message.recipient_id in self._queues:
                await self._queues[message.recipient_id].put(message)
        else:
            for agent_id, queue in self._queues.items():
                if agent_id != message.sender_id:
                    await queue.put(message)

    async def receive(
        self, agent_id: str, timeout: float = 30.0
    ) -> AgentMessage | None:
        if agent_id not in self._queues:
            return None
        try:
            return await asyncio.wait_for(
                self._queues[agent_id].get(), timeout=timeout
            )
        except asyncio.TimeoutError:
            return None

    def get_message_log(self) -> list[AgentMessage]:
        return list(self._message_log)

    def clear(self):
        self._queues.clear()
        self._message_log.clear()

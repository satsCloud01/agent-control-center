"""Tests for controlcenter.core.communication_bus."""

import asyncio

import pytest

from controlcenter.core.communication_bus import AgentMessage, CommunicationBus


@pytest.fixture
def bus():
    return CommunicationBus()


class TestRegisterAgent:
    def test_register(self, bus):
        bus.register_agent("a1")
        assert "a1" in bus._queues

    def test_double_register_no_error(self, bus):
        bus.register_agent("a1")
        bus.register_agent("a1")

    def test_unregister(self, bus):
        bus.register_agent("a1")
        bus.unregister_agent("a1")
        assert "a1" not in bus._queues


class TestSendReceive:
    @pytest.mark.asyncio
    async def test_targeted_message(self, bus):
        bus.register_agent("sender")
        bus.register_agent("receiver")
        msg = AgentMessage(sender_id="sender", content="hello", message_type="query", recipient_id="receiver")
        await bus.send(msg)
        received = await bus.receive("receiver", timeout=1.0)
        assert received is not None
        assert received.content == "hello"

    @pytest.mark.asyncio
    async def test_broadcast(self, bus):
        bus.register_agent("sender")
        bus.register_agent("r1")
        bus.register_agent("r2")
        msg = AgentMessage(sender_id="sender", content="broadcast", message_type="status_update")
        await bus.send(msg)
        r1_msg = await bus.receive("r1", timeout=1.0)
        r2_msg = await bus.receive("r2", timeout=1.0)
        assert r1_msg is not None
        assert r2_msg is not None
        # Sender should not receive own broadcast
        sender_msg = await bus.receive("sender", timeout=0.1)
        assert sender_msg is None

    @pytest.mark.asyncio
    async def test_receive_timeout(self, bus):
        bus.register_agent("a1")
        result = await bus.receive("a1", timeout=0.1)
        assert result is None

    @pytest.mark.asyncio
    async def test_receive_unregistered(self, bus):
        result = await bus.receive("unknown", timeout=0.1)
        assert result is None


class TestMessageLog:
    @pytest.mark.asyncio
    async def test_log_records_messages(self, bus):
        bus.register_agent("a1")
        bus.register_agent("a2")
        msg = AgentMessage(sender_id="a1", content="hi", message_type="query", recipient_id="a2")
        await bus.send(msg)
        log = bus.get_message_log()
        assert len(log) == 1
        assert log[0].content == "hi"


class TestClear:
    @pytest.mark.asyncio
    async def test_clear(self, bus):
        bus.register_agent("a1")
        msg = AgentMessage(sender_id="a1", content="x", message_type="query")
        await bus.send(msg)
        bus.clear()
        assert bus.get_message_log() == []
        assert len(bus._queues) == 0

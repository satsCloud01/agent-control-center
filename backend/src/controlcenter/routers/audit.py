"""Audit log API."""

from __future__ import annotations

from fastapi import APIRouter, Request

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("/events")
async def get_events(request: Request, workflow_id: str | None = None, limit: int = 100):
    """Get audit events, optionally filtered by workflow."""
    return request.app.state.audit_logger.get_events(
        workflow_id=workflow_id, limit=limit
    )


@router.get("/messages")
async def get_messages(
    request: Request, workflow_id: str = "", agent_id: str | None = None
):
    """Get agent messages for a workflow."""
    if not workflow_id:
        return []
    return request.app.state.audit_logger.get_messages(workflow_id, agent_id=agent_id)


@router.get("/stats")
async def get_stats(request: Request):
    """Get aggregate audit stats."""
    audit_logger = request.app.state.audit_logger
    workflows = audit_logger.get_workflows(limit=1000)
    total = len(workflows)
    completed = sum(1 for w in workflows if w.get("status") == "completed")
    failed = sum(1 for w in workflows if w.get("status") == "failed")
    running = sum(1 for w in workflows if w.get("status") == "running")

    registry = request.app.state.registry
    agents = registry.get_all()
    total_agents = len(agents)
    agents_completed = sum(1 for a in agents if a.status.value == "completed")
    agents_failed = sum(1 for a in agents if a.status.value == "failed")
    agents_running = sum(1 for a in agents if a.status.value == "running")

    return {
        "workflows": {"total": total, "completed": completed, "failed": failed, "running": running},
        "agents": {"total": total_agents, "completed": agents_completed, "failed": agents_failed, "running": agents_running},
    }

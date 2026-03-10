"""Agent status and management API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("")
async def list_agents(request: Request):
    """List all agents in the registry."""
    registry = request.app.state.registry
    return [a.to_dict() for a in registry.get_all()]


@router.get("/{agent_id}")
async def get_agent(agent_id: str, request: Request):
    """Get a specific agent."""
    agent = request.app.state.registry.get_agent(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return agent.to_dict()


@router.get("/{agent_id}/children")
async def get_agent_children(agent_id: str, request: Request):
    """Get child agents of a parent agent."""
    children = request.app.state.registry.get_children(agent_id)
    return [c.to_dict() for c in children]


@router.get("/relationships/all")
async def get_relationships(request: Request):
    """Get all agent relationships."""
    rels = request.app.state.registry.get_relationships()
    return [{"parent_id": r[0], "child_id": r[1], "type": r[2]} for r in rels]


@router.delete("/clear")
async def clear_agents(request: Request):
    """Clear all agents from the registry."""
    request.app.state.registry.clear()
    return {"status": "cleared"}

"""Workflow API — launch, query, and manage agent workflows."""

from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel

from controlcenter.core.agent_factory import AgentFactory
from controlcenter.core.llm_provider import LLMProvider
from controlcenter.core.tool_manager import ToolManager
from controlcenter.orchestration.supervisor import build_supervisor_graph

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


class LaunchRequest(BaseModel):
    problem_statement: str
    selected_skills: list[str] = []
    provider: str = "anthropic"
    model: str = "claude-sonnet-4-20250514"


class LaunchResponse(BaseModel):
    workflow_id: str
    subtask_count: int
    final_result: str
    subtasks: list[dict]
    agents: list[dict]


@router.post("", response_model=LaunchResponse)
async def launch_workflow(
    body: LaunchRequest,
    request: Request,
    x_openai_key: str = Header("", alias="X-OpenAI-Key"),
    x_anthropic_key: str = Header("", alias="X-Anthropic-Key"),
    x_tavily_key: str = Header("", alias="X-Tavily-Key"),
):
    """Launch a new agent workflow. API keys are passed via headers (never persisted)."""
    config = request.app.state.config.with_api_keys(
        openai_api_key=x_openai_key,
        anthropic_api_key=x_anthropic_key,
        tavily_api_key=x_tavily_key,
    )
    config.default_provider = body.provider
    config.default_model = body.model

    # Validate that we have the right key for the chosen provider
    if body.provider == "anthropic" and not config.anthropic_api_key:
        raise HTTPException(400, "Anthropic API key required. Please set it in Settings.")
    if body.provider == "openai" and not config.openai_api_key:
        raise HTTPException(400, "OpenAI API key required. Please set it in Settings.")

    audit_logger = request.app.state.audit_logger
    registry = request.app.state.registry
    skill_registry = request.app.state.skill_registry
    bus = request.app.state.bus

    llm_provider = LLMProvider(config)
    tool_manager = ToolManager(config)
    agent_factory = AgentFactory(config, llm_provider, tool_manager)

    workflow_id = str(uuid4())
    audit_logger.start_workflow(workflow_id, body.problem_statement)

    try:
        supervisor = build_supervisor_graph(
            config=config,
            llm_provider=llm_provider,
            tool_manager=tool_manager,
            agent_factory=agent_factory,
            registry=registry,
            skill_registry=skill_registry,
            bus=bus,
            audit_logger=audit_logger,
        )

        initial_state = {
            "problem_statement": body.problem_statement,
            "messages": [],
            "subtasks": [],
            "active_agents": [],
            "final_result": "",
            "iteration": 0,
            "next_action": "decompose",
            "workflow_id": workflow_id,
        }

        result = await supervisor.ainvoke(initial_state)

        subtask_count = len(result.get("subtasks", []))
        final_result = result.get("final_result", "No result produced.")

        audit_logger.complete_workflow(workflow_id, final_result, subtask_count)

        # Collect agent info for this workflow
        agents_data = [
            a.to_dict() for a in registry.get_all()
            if a.parent_id == "supervisor"
        ]

        # Serialize subtasks (remove non-serializable data)
        subtasks_data = []
        for st in result.get("subtasks", []):
            subtasks_data.append({
                "task_id": st.get("task_id", ""),
                "description": st.get("description", ""),
                "status": st.get("status", ""),
                "result": st.get("result", ""),
                "assigned_agent": st.get("assigned_agent", ""),
            })

        return LaunchResponse(
            workflow_id=workflow_id,
            subtask_count=subtask_count,
            final_result=final_result,
            subtasks=subtasks_data,
            agents=agents_data,
        )

    except Exception as e:
        audit_logger.fail_workflow(workflow_id, str(e))
        raise HTTPException(500, f"Workflow failed: {e}")


@router.get("")
async def list_workflows(request: Request, limit: int = 20):
    """List recent workflows."""
    return request.app.state.audit_logger.get_workflows(limit=limit)


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str, request: Request):
    """Get a specific workflow run."""
    workflows = request.app.state.audit_logger.get_workflows(limit=100)
    for wf in workflows:
        if wf.get("id") == workflow_id:
            return wf
    raise HTTPException(404, "Workflow not found")


@router.get("/{workflow_id}/events")
async def get_workflow_events(workflow_id: str, request: Request, limit: int = 100):
    """Get audit events for a workflow."""
    return request.app.state.audit_logger.get_events(workflow_id=workflow_id, limit=limit)


@router.get("/{workflow_id}/messages")
async def get_workflow_messages(
    workflow_id: str, request: Request, agent_id: str | None = None
):
    """Get agent messages for a workflow."""
    return request.app.state.audit_logger.get_messages(workflow_id, agent_id=agent_id)

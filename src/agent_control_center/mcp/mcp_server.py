"""MCP server exposing agent orchestration as MCP-compatible endpoints."""

from __future__ import annotations

import asyncio
import json
from uuid import uuid4

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

from agent_control_center.config import Config
from agent_control_center.core.agent_factory import AgentFactory
from agent_control_center.core.agent_registry import AgentRegistry
from agent_control_center.core.communication_bus import CommunicationBus
from agent_control_center.core.llm_provider import LLMProvider
from agent_control_center.core.tool_manager import ToolManager
from agent_control_center.orchestration.supervisor import build_supervisor_graph
from agent_control_center.persistence.audit_logger import AuditLogger
from agent_control_center.persistence.database import Database
from agent_control_center.skills.skill_parser import SkillRegistry

server = Server("agent-control-center")


def _get_components():
    """Lazily initialize components."""
    if not hasattr(_get_components, "_cache"):
        config = Config.from_env()
        db = Database(config.audit_db_path)
        _get_components._cache = {
            "config": config,
            "db": db,
            "audit_logger": AuditLogger(db),
            "llm_provider": LLMProvider(config),
            "tool_manager": ToolManager(config),
            "registry": AgentRegistry(),
            "skill_registry": SkillRegistry(),
            "bus": CommunicationBus(),
        }
        skills_dir = config.resolve_path(config.skills_dir)
        if skills_dir.exists():
            _get_components._cache["skill_registry"].load_directory(skills_dir)
        _get_components._cache["agent_factory"] = AgentFactory(
            config,
            _get_components._cache["llm_provider"],
            _get_components._cache["tool_manager"],
        )
    return _get_components._cache


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="launch_agents",
            description="Launch agent infrastructure to solve a problem. Decomposes the problem into subtasks, spawns specialized agents, and synthesizes results.",
            inputSchema={
                "type": "object",
                "properties": {
                    "problem_statement": {
                        "type": "string",
                        "description": "The problem to solve",
                    }
                },
                "required": ["problem_statement"],
            },
        ),
        Tool(
            name="query_agent_status",
            description="Get the current status of all agents in the registry.",
            inputSchema={"type": "object", "properties": {}},
        ),
        Tool(
            name="get_workflow_result",
            description="Get the final result from a completed workflow.",
            inputSchema={
                "type": "object",
                "properties": {
                    "workflow_id": {
                        "type": "string",
                        "description": "The workflow ID to query",
                    }
                },
                "required": ["workflow_id"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    components = _get_components()

    if name == "launch_agents":
        problem = arguments["problem_statement"]
        workflow_id = str(uuid4())

        components["audit_logger"].start_workflow(workflow_id, problem)

        supervisor = build_supervisor_graph(
            config=components["config"],
            llm_provider=components["llm_provider"],
            tool_manager=components["tool_manager"],
            agent_factory=components["agent_factory"],
            registry=components["registry"],
            skill_registry=components["skill_registry"],
            bus=components["bus"],
            audit_logger=components["audit_logger"],
        )

        initial_state = {
            "problem_statement": problem,
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

        components["audit_logger"].complete_workflow(
            workflow_id, final_result, subtask_count
        )

        return [
            TextContent(
                type="text",
                text=json.dumps({
                    "workflow_id": workflow_id,
                    "subtask_count": subtask_count,
                    "result": final_result,
                }),
            )
        ]

    elif name == "query_agent_status":
        registry: AgentRegistry = components["registry"]
        agents = [a.to_dict() for a in registry.get_all()]
        return [TextContent(type="text", text=json.dumps(agents, indent=2))]

    elif name == "get_workflow_result":
        workflow_id = arguments["workflow_id"]
        audit_logger: AuditLogger = components["audit_logger"]
        workflows = audit_logger.get_workflows(limit=100)
        for wf in workflows:
            if wf.get("id") == workflow_id:
                return [TextContent(type="text", text=json.dumps(dict(wf), indent=2))]
        return [TextContent(type="text", text=f"Workflow {workflow_id} not found.")]

    return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def run_server():
    """Run the MCP server via stdio."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


def main():
    asyncio.run(run_server())


if __name__ == "__main__":
    main()

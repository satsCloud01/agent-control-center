"""LangGraph supervisor agent that decomposes goals and orchestrates sub-agents."""

from __future__ import annotations

import asyncio
import json
import logging
import re
from uuid import uuid4

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, StateGraph

from controlcenter.config import Config
from controlcenter.core.agent_factory import AgentFactory
from controlcenter.core.agent_registry import AgentRegistry
from controlcenter.core.communication_bus import CommunicationBus
from controlcenter.core.llm_provider import LLMProvider
from controlcenter.core.tool_manager import ToolManager
from controlcenter.models.agent_models import AgentStatus
from controlcenter.orchestration.graph_builder import build_agent_graph
from controlcenter.orchestration.state import SupervisorState
from controlcenter.persistence.audit_logger import AuditLogger
from controlcenter.skills.skill_parser import SkillRegistry

logger = logging.getLogger(__name__)

DECOMPOSITION_PROMPT = """You are a task decomposition expert. Given a problem statement, break it down into independent subtasks that can be solved by specialized agents.

Problem Statement:
{problem}

Available agent skills: {available_skills}

Respond with a JSON array of subtasks. Each subtask must have:
- "task_id": a unique short identifier (e.g., "task_1")
- "description": clear description of what needs to be done
- "required_skills": list of skill tags needed (e.g., ["research", "web"])
- "tool_requirements": list of tool names needed (e.g., ["web_search"])

Output ONLY the JSON array, no other text. Example:
[
  {{"task_id": "task_1", "description": "Research the topic", "required_skills": ["research"], "tool_requirements": ["web_search"]}},
  {{"task_id": "task_2", "description": "Analyze the data", "required_skills": ["analysis"], "tool_requirements": ["code_execute"]}}
]"""

SYNTHESIS_PROMPT = """You are a synthesis expert. Combine the results from multiple sub-agents into a comprehensive, well-structured final answer.

Original Problem:
{problem}

Sub-agent Results:
{results}

Provide a comprehensive answer that:
1. Addresses the original problem directly
2. Integrates findings from all sub-agents
3. Highlights key insights and conclusions
4. Notes any conflicting information or gaps
5. Is well-structured with clear sections"""


def _parse_subtasks_json(text: str) -> list[dict]:
    code_block = re.search(r"```(?:json)?\s*\n?(.*?)```", text, re.DOTALL)
    if code_block:
        text = code_block.group(1).strip()

    bracket_start = text.find("[")
    bracket_end = text.rfind("]")
    if bracket_start != -1 and bracket_end != -1:
        text = text[bracket_start : bracket_end + 1]

    try:
        subtasks = json.loads(text)
        if isinstance(subtasks, list):
            return subtasks
    except json.JSONDecodeError:
        pass

    return [
        {
            "task_id": "task_1",
            "description": "Complete the full task as described",
            "required_skills": [],
            "tool_requirements": [],
        }
    ]


async def _run_single_agent(
    agent_record,
    skill,
    agent_factory: AgentFactory,
    registry: AgentRegistry,
    audit_logger: AuditLogger,
    workflow_id: str,
) -> str:
    agent_id = agent_record.agent_id

    try:
        registry.update_status(agent_id, AgentStatus.RUNNING)
        audit_logger.log(
            "agent_started",
            {"task": agent_record.assigned_task, "skill": skill.name},
            agent_id=agent_id,
            agent_name=agent_record.name,
            workflow_id=workflow_id,
        )

        llm = agent_factory.get_agent_llm(agent_record)
        tools = agent_factory.get_agent_tools(skill)

        agent_graph = build_agent_graph(
            system_prompt=skill.system_prompt,
            tools=tools,
            llm=llm,
        )

        result = await agent_graph.ainvoke(
            {"messages": [HumanMessage(content=agent_record.assigned_task)]}
        )

        final_messages = result.get("messages", [])
        if final_messages:
            output = final_messages[-1].content
        else:
            output = "Agent completed but produced no output."

        registry.update_status(agent_id, AgentStatus.COMPLETED, result=output)
        audit_logger.log(
            "agent_completed",
            {"result_length": len(output)},
            agent_id=agent_id,
            agent_name=agent_record.name,
            workflow_id=workflow_id,
        )
        return output

    except Exception as e:
        error_msg = str(e)
        registry.update_status(agent_id, AgentStatus.FAILED, error=error_msg)
        audit_logger.log(
            "agent_failed",
            {"error": error_msg},
            agent_id=agent_id,
            agent_name=agent_record.name,
            workflow_id=workflow_id,
            level="ERROR",
        )
        return f"AGENT ERROR: {error_msg}"


def build_supervisor_graph(
    config: Config,
    llm_provider: LLMProvider,
    tool_manager: ToolManager,
    agent_factory: AgentFactory,
    registry: AgentRegistry,
    skill_registry: SkillRegistry,
    bus: CommunicationBus,
    audit_logger: AuditLogger,
):
    supervisor_llm = llm_provider.get_llm()

    async def decompose_node(state: SupervisorState) -> dict:
        available_skills = ", ".join(
            f"{s.name} ({s.description})" for s in skill_registry.get_all()
        )
        prompt = DECOMPOSITION_PROMPT.format(
            problem=state["problem_statement"],
            available_skills=available_skills or "general-purpose agents",
        )

        response = await supervisor_llm.ainvoke(
            [SystemMessage(content="You are a task decomposition expert."),
             HumanMessage(content=prompt)]
        )

        raw_subtasks = _parse_subtasks_json(response.content)
        subtasks = []
        for st in raw_subtasks:
            subtasks.append({
                "task_id": st.get("task_id", f"task_{len(subtasks)+1}"),
                "description": st.get("description", ""),
                "required_skills": st.get("required_skills", []),
                "tool_requirements": st.get("tool_requirements", []),
                "assigned_agent": "",
                "status": "pending",
                "result": "",
            })

        audit_logger.log(
            "decomposition",
            {"problem": state["problem_statement"], "subtask_count": len(subtasks)},
            workflow_id=state["workflow_id"],
        )

        return {
            "subtasks": subtasks,
            "next_action": "assign",
            "messages": [response],
        }

    async def assign_node(state: SupervisorState) -> dict:
        active_agents = []
        updated_subtasks = []

        for task in state["subtasks"]:
            if task["status"] == "pending":
                skill = skill_registry.find_best_match(task["required_skills"])
                agent_record = agent_factory.create_agent(
                    skill=skill,
                    task_description=task["description"],
                    parent_id="supervisor",
                )
                registry.register(agent_record)
                bus.register_agent(agent_record.agent_id)

                task = dict(task)
                task["assigned_agent"] = agent_record.agent_id
                task["status"] = "assigned"
                active_agents.append(agent_record.agent_id)

                audit_logger.log(
                    "agent_spawned",
                    {
                        "skill": skill.name,
                        "task": task["description"],
                        "provider": agent_record.llm_provider,
                        "model": agent_record.llm_model,
                    },
                    agent_id=agent_record.agent_id,
                    agent_name=agent_record.name,
                    workflow_id=state["workflow_id"],
                )

            updated_subtasks.append(task)

        return {
            "subtasks": updated_subtasks,
            "active_agents": active_agents,
            "next_action": "execute",
        }

    async def execute_node(state: SupervisorState) -> dict:
        tasks = []
        task_map = {}

        for i, subtask in enumerate(state["subtasks"]):
            if subtask["status"] == "assigned":
                agent_id = subtask["assigned_agent"]
                agent_record = registry.get_agent(agent_id)
                if agent_record:
                    skill = skill_registry.find_best_match(
                        subtask.get("required_skills", [])
                    )
                    coro = _run_single_agent(
                        agent_record, skill, agent_factory, registry,
                        audit_logger, state["workflow_id"],
                    )
                    tasks.append(coro)
                    task_map[len(tasks) - 1] = i

        results = await asyncio.gather(*tasks, return_exceptions=True)

        updated_subtasks = list(state["subtasks"])
        for task_idx, result in enumerate(results):
            subtask_idx = task_map[task_idx]
            st = dict(updated_subtasks[subtask_idx])
            if isinstance(result, Exception):
                st["status"] = "failed"
                st["result"] = str(result)
            else:
                st["status"] = "completed"
                st["result"] = str(result)
            updated_subtasks[subtask_idx] = st

        return {
            "subtasks": updated_subtasks,
            "next_action": "synthesize",
            "iteration": state.get("iteration", 0) + 1,
        }

    async def synthesize_node(state: SupervisorState) -> dict:
        results_summary = "\n\n".join(
            f"### Task: {t['description']}\n**Status:** {t['status']}\n**Result:**\n{t['result']}"
            for t in state["subtasks"]
        )

        prompt = SYNTHESIS_PROMPT.format(
            problem=state["problem_statement"],
            results=results_summary,
        )

        response = await supervisor_llm.ainvoke(
            [SystemMessage(content="You are a synthesis expert."),
             HumanMessage(content=prompt)]
        )

        audit_logger.log(
            "synthesis",
            {"result_length": len(response.content)},
            workflow_id=state["workflow_id"],
        )

        return {
            "final_result": response.content,
            "next_action": "end",
            "messages": [response],
        }

    def route(state: SupervisorState) -> str:
        return state.get("next_action", "end")

    graph = StateGraph(SupervisorState)
    graph.add_node("decompose", decompose_node)
    graph.add_node("assign", assign_node)
    graph.add_node("execute", execute_node)
    graph.add_node("synthesize", synthesize_node)

    graph.set_entry_point("decompose")
    graph.add_conditional_edges("decompose", route, {"assign": "assign", "end": END})
    graph.add_conditional_edges("assign", route, {"execute": "execute", "end": END})
    graph.add_conditional_edges("execute", route, {"synthesize": "synthesize", "end": END})
    graph.add_conditional_edges("synthesize", route, {"end": END})

    return graph.compile()

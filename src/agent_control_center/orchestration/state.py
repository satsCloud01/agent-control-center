"""LangGraph state schema for the supervisor workflow."""

from __future__ import annotations

from typing import Annotated, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class SubTask(TypedDict):
    task_id: str
    description: str
    required_skills: list[str]
    tool_requirements: list[str]
    assigned_agent: str
    status: str  # pending, assigned, running, completed, failed
    result: str


class SupervisorState(TypedDict):
    problem_statement: str
    messages: Annotated[list[BaseMessage], add_messages]
    subtasks: list[SubTask]
    active_agents: list[str]
    final_result: str
    iteration: int
    next_action: str  # decompose, assign, execute, synthesize, end
    workflow_id: str

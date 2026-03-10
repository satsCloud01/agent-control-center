"""Builds per-agent ReAct sub-graphs."""

from __future__ import annotations

from langchain_core.language_models import BaseChatModel
from langchain_core.tools import BaseTool
from langgraph.prebuilt import create_react_agent


def build_agent_graph(
    system_prompt: str,
    tools: list[BaseTool],
    llm: BaseChatModel,
):
    return create_react_agent(llm, tools, prompt=system_prompt)

"""Web search tool using Tavily."""

from __future__ import annotations

from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.tools import BaseTool

from controlcenter.config import Config


def create_web_search_tool(config: Config) -> BaseTool:
    return TavilySearchResults(
        api_key=config.tavily_api_key,
        max_results=5,
        name="web_search",
        description="Search the web for current information on any topic. Returns a list of results with titles, URLs, and snippets.",
    )

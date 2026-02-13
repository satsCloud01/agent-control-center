"""Tool registration and management for agents."""

from __future__ import annotations

from langchain_core.tools import BaseTool

from agent_control_center.config import Config


class ToolManager:
    def __init__(self, config: Config):
        self._config = config
        self._tools: dict[str, BaseTool] = {}
        self._register_builtin_tools()

    def _register_builtin_tools(self):
        from agent_control_center.tools.web_search import create_web_search_tool
        from agent_control_center.tools.code_executor import create_code_executor_tool
        from agent_control_center.tools.file_io import create_file_io_tools
        from agent_control_center.tools.api_caller import create_api_caller_tool

        if self._config.tavily_api_key:
            self._tools["web_search"] = create_web_search_tool(self._config)

        self._tools["code_execute"] = create_code_executor_tool()

        read_tool, write_tool = create_file_io_tools(self._config)
        self._tools["file_read"] = read_tool
        self._tools["file_write"] = write_tool

        self._tools["api_call"] = create_api_caller_tool()

    def register_tool(self, name: str, tool: BaseTool):
        self._tools[name] = tool

    def get_tools(self, allowed: list[str] | None = None) -> list[BaseTool]:
        if allowed is None:
            return list(self._tools.values())
        return [t for name, t in self._tools.items() if name in allowed]

    def get_tool_names(self) -> list[str]:
        return list(self._tools.keys())

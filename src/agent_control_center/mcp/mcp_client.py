"""MCP client for connecting agents to external MCP servers."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from langchain_core.tools import BaseTool, tool

logger = logging.getLogger(__name__)


class MCPClientTool(BaseTool):
    """Wraps an MCP server tool as a LangChain BaseTool."""

    name: str
    description: str
    server_name: str
    mcp_tool_name: str
    _client: Any = None

    class Config:
        arbitrary_types_allowed = True

    def _run(self, **kwargs) -> str:
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    result = pool.submit(
                        asyncio.run, self._async_call(kwargs)
                    ).result()
                return result
            return loop.run_until_complete(self._async_call(kwargs))
        except Exception as e:
            return f"MCP call failed: {e}"

    async def _async_call(self, arguments: dict) -> str:
        if self._client is None:
            return "MCP client not initialized."
        try:
            result = await self._client.call_tool(self.mcp_tool_name, arguments)
            if hasattr(result, "content"):
                return str(result.content)
            return str(result)
        except Exception as e:
            return f"MCP tool error: {e}"


async def create_mcp_tools(server_config: dict) -> list[BaseTool]:
    """Create LangChain tools from an MCP server configuration.

    server_config should have:
      - name: server name
      - command: command to run the server
      - args: list of arguments (optional)
    """
    try:
        from mcp import ClientSession
        from mcp.client.stdio import stdio_client, StdioServerParameters

        server_params = StdioServerParameters(
            command=server_config["command"],
            args=server_config.get("args", []),
        )

        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                tools_result = await session.list_tools()

                mcp_tools = []
                for t in tools_result.tools:
                    mcp_tool = MCPClientTool(
                        name=f"{server_config['name']}_{t.name}",
                        description=t.description or f"MCP tool: {t.name}",
                        server_name=server_config["name"],
                        mcp_tool_name=t.name,
                    )
                    mcp_tool._client = session
                    mcp_tools.append(mcp_tool)

                return mcp_tools

    except ImportError:
        logger.warning("MCP client libraries not available.")
        return []
    except Exception as e:
        logger.error("Failed to connect to MCP server %s: %s", server_config.get("name"), e)
        return []

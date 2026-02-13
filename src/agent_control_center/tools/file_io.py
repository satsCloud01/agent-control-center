"""Scoped file read/write tools for agents."""

from __future__ import annotations

from pathlib import Path

from langchain_core.tools import BaseTool, tool

from agent_control_center.config import Config


def create_file_io_tools(config: Config) -> tuple[BaseTool, BaseTool]:
    workspace = config.resolve_path(config.workspace_dir)
    workspace.mkdir(parents=True, exist_ok=True)

    @tool
    def file_read(path: str) -> str:
        """Read a file from the agent workspace directory. The path is relative to the workspace."""
        target = (workspace / path).resolve()
        if not str(target).startswith(str(workspace)):
            return "ERROR: Access denied. Path is outside the workspace directory."
        if not target.exists():
            return f"ERROR: File not found: {path}"
        try:
            content = target.read_text(encoding="utf-8")
            if len(content) > 50000:
                return content[:50000] + "\n... (truncated)"
            return content
        except Exception as e:
            return f"ERROR: {e}"

    @tool
    def file_write(path: str, content: str) -> str:
        """Write content to a file in the agent workspace directory. The path is relative to the workspace."""
        target = (workspace / path).resolve()
        if not str(target).startswith(str(workspace)):
            return "ERROR: Access denied. Path is outside the workspace directory."
        try:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
            return f"Successfully wrote {len(content)} characters to {path}"
        except Exception as e:
            return f"ERROR: {e}"

    return file_read, file_write  # type: ignore[return-value]

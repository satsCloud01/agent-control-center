"""Sandboxed Python code execution tool."""

from __future__ import annotations

import subprocess
import tempfile

from langchain_core.tools import BaseTool, tool


@tool
def code_execute(code: str) -> str:
    """Execute Python code in a sandboxed subprocess. Returns stdout and stderr.
    Use this to run calculations, data processing, or any Python code."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
        f.write(code)
        f.flush()
        try:
            result = subprocess.run(
                ["python3", f.name],
                capture_output=True,
                text=True,
                timeout=30,
            )
            output = result.stdout
            if result.returncode != 0:
                output += f"\nSTDERR: {result.stderr}"
            return output if output.strip() else "(no output)"
        except subprocess.TimeoutExpired:
            return "ERROR: Code execution timed out after 30 seconds."


def create_code_executor_tool() -> BaseTool:
    return code_execute  # type: ignore[return-value]

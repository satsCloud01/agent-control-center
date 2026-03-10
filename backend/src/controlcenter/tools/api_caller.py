"""Generic HTTP API calling tool."""

from __future__ import annotations

import httpx
from langchain_core.tools import BaseTool, tool


@tool
def api_call(url: str, method: str = "GET", headers: str = "", body: str = "") -> str:
    """Make an HTTP API call. Returns the response status and body.
    Headers should be formatted as 'Key: Value' lines separated by newlines.
    Method can be GET, POST, PUT, DELETE, PATCH."""
    parsed_headers = {}
    if headers:
        for line in headers.strip().split("\n"):
            if ": " in line:
                key, value = line.split(": ", 1)
                parsed_headers[key.strip()] = value.strip()

    try:
        response = httpx.request(
            method=method.upper(),
            url=url,
            headers=parsed_headers or None,
            content=body if body else None,
            timeout=30,
        )
        result = f"Status: {response.status_code}\n"
        result += response.text[:4000]
        if len(response.text) > 4000:
            result += "\n... (truncated)"
        return result
    except httpx.TimeoutException:
        return "ERROR: Request timed out after 30 seconds."
    except Exception as e:
        return f"ERROR: {e}"


def create_api_caller_tool() -> BaseTool:
    return api_call  # type: ignore[return-value]

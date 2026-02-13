"""Skill definition models parsed from .skill.md files."""

from __future__ import annotations

from pydantic import BaseModel, Field


class SkillDefinition(BaseModel):
    name: str = Field(..., description="Unique skill name (kebab-case)")
    description: str = Field(default="", description="What this agent does")
    provider: str | None = Field(default=None, description="LLM provider override")
    model: str | None = Field(default=None, description="Model override")
    temperature: float | None = Field(default=None, ge=0, le=1)
    max_tokens: int | None = Field(default=None, ge=100, le=16384)
    tools: list[str] = Field(default_factory=list, description="Allowed tool names")
    tags: list[str] = Field(default_factory=list, description="Categorization tags")
    system_prompt: str = Field(..., description="Agent system prompt (Markdown body)")
    source_path: str = Field(default="", description="File path the skill was loaded from")
    mcp_servers: list[dict] = Field(default_factory=list, description="External MCP servers")

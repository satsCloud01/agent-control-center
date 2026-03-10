"""Skill management API."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

router = APIRouter(prefix="/api/skills", tags=["skills"])


class SkillCreateRequest(BaseModel):
    content: str  # Raw .skill.md content


@router.get("")
async def list_skills(request: Request):
    """List all loaded skills."""
    skill_registry = request.app.state.skill_registry
    return [s.model_dump() for s in skill_registry.get_all()]


@router.get("/{skill_name}")
async def get_skill(skill_name: str, request: Request):
    """Get a specific skill definition."""
    skill = request.app.state.skill_registry.get(skill_name)
    if not skill:
        raise HTTPException(404, "Skill not found")
    return skill.model_dump()


@router.post("")
async def create_skill(body: SkillCreateRequest, request: Request):
    """Create a new skill from .skill.md content."""
    from controlcenter.skills.skill_parser import SkillParser

    parser = SkillParser()
    try:
        skill = parser.parse_text(body.content)
    except ValueError as e:
        raise HTTPException(400, str(e))

    # Save to disk
    config = request.app.state.config
    skills_dir = config.resolve_path(config.skills_dir)
    skills_dir.mkdir(parents=True, exist_ok=True)
    file_path = skills_dir / f"{skill.name}.skill.md"
    file_path.write_text(body.content, encoding="utf-8")
    skill.source_path = str(file_path)

    request.app.state.skill_registry.register(skill)
    return skill.model_dump()


@router.delete("/{skill_name}")
async def delete_skill(skill_name: str, request: Request):
    """Remove a skill."""
    skill = request.app.state.skill_registry.get(skill_name)
    if not skill:
        raise HTTPException(404, "Skill not found")

    # Remove file if it exists
    if skill.source_path and Path(skill.source_path).exists():
        Path(skill.source_path).unlink()

    request.app.state.skill_registry.remove(skill_name)
    return {"status": "deleted", "name": skill_name}


@router.get("/tools/available")
async def available_tools():
    """List all available tool names agents can use."""
    return {
        "tools": [
            {"name": "web_search", "description": "Search the web using Tavily (requires Tavily API key)"},
            {"name": "code_execute", "description": "Execute Python code in a sandboxed subprocess"},
            {"name": "file_read", "description": "Read files from the agent workspace"},
            {"name": "file_write", "description": "Write files to the agent workspace"},
            {"name": "api_call", "description": "Make HTTP API calls (GET/POST/PUT/DELETE)"},
        ]
    }

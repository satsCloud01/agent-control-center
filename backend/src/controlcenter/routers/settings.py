"""Settings API — returns platform config (no secrets)."""

from __future__ import annotations

from fastapi import APIRouter, Request

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("")
async def get_settings(request: Request):
    """Get platform settings (non-secret)."""
    config = request.app.state.config
    skill_registry = request.app.state.skill_registry
    return {
        "default_provider": config.default_provider,
        "default_model": config.default_model,
        "max_tokens": config.max_tokens,
        "temperature": config.temperature,
        "skills_dir": config.skills_dir,
        "available_providers": [
            {"id": "anthropic", "name": "Anthropic", "models": [
                "claude-sonnet-4-20250514", "claude-haiku-4-5-20251001", "claude-opus-4-6"
            ]},
            {"id": "openai", "name": "OpenAI", "models": [
                "gpt-4o", "gpt-4o-mini", "gpt-4-turbo"
            ]},
        ],
        "available_tools": [
            "web_search", "code_execute", "file_read", "file_write", "api_call"
        ],
        "loaded_skills": len(skill_registry.get_all()),
    }


@router.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}

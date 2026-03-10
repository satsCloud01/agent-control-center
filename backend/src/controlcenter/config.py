"""Application configuration. API keys are NOT loaded from env — they come from UI via headers."""

from __future__ import annotations

from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


class Config:
    """Runtime config. API keys are injected per-request from the frontend."""

    def __init__(
        self,
        default_provider: str = "anthropic",
        default_model: str = "claude-sonnet-4-20250514",
        max_tokens: int = 4096,
        temperature: float = 0.3,
        skills_dir: str = "skills",
        data_dir: str = "data",
        workspace_dir: str = "workspace",
    ):
        self.default_provider = default_provider
        self.default_model = default_model
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.skills_dir = skills_dir
        self.data_dir = data_dir
        self.workspace_dir = workspace_dir
        # API keys — set per request, never persisted
        self.openai_api_key: str = ""
        self.anthropic_api_key: str = ""
        self.tavily_api_key: str = ""

    @property
    def audit_db_path(self) -> str:
        return str(self.resolve_path(self.data_dir) / "audit.db")

    def resolve_path(self, relative: str) -> Path:
        p = Path(relative)
        if p.is_absolute():
            return p
        return _PROJECT_ROOT / p

    def with_api_keys(
        self,
        openai_api_key: str = "",
        anthropic_api_key: str = "",
        tavily_api_key: str = "",
    ) -> "Config":
        """Return a copy with API keys injected (from request headers)."""
        c = Config(
            default_provider=self.default_provider,
            default_model=self.default_model,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            skills_dir=self.skills_dir,
            data_dir=self.data_dir,
            workspace_dir=self.workspace_dir,
        )
        c.openai_api_key = openai_api_key
        c.anthropic_api_key = anthropic_api_key
        c.tavily_api_key = tavily_api_key
        return c

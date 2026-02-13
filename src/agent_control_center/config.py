"""Application configuration loaded from environment variables."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


class Config(BaseModel):
    openai_api_key: str = Field(default="")
    anthropic_api_key: str = Field(default="")
    default_provider: Literal["openai", "anthropic"] = Field(default="anthropic")
    default_model: str = Field(default="claude-sonnet-4-20250514")
    max_tokens: int = Field(default=4096)
    temperature: float = Field(default=0.3)
    tavily_api_key: str = Field(default="")
    skills_dir: str = Field(default="skills")
    data_dir: str = Field(default="data")
    mcp_server_port: int = Field(default=8765)
    workspace_dir: str = Field(default="workspace")

    @property
    def audit_db_path(self) -> str:
        return str(self.resolve_path(self.data_dir) / "audit.db")

    def resolve_path(self, relative: str) -> Path:
        p = Path(relative)
        if p.is_absolute():
            return p
        return _PROJECT_ROOT / p

    @classmethod
    def from_env(cls) -> Config:
        return cls(
            openai_api_key=os.getenv("OPENAI_API_KEY", ""),
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", ""),
            default_provider=os.getenv("DEFAULT_PROVIDER", "anthropic"),  # type: ignore[arg-type]
            default_model=os.getenv("DEFAULT_MODEL", "claude-sonnet-4-20250514"),
            max_tokens=int(os.getenv("MAX_TOKENS", "4096")),
            temperature=float(os.getenv("TEMPERATURE", "0.3")),
            tavily_api_key=os.getenv("TAVILY_API_KEY", ""),
            skills_dir=os.getenv("SKILLS_DIR", "skills"),
            data_dir=os.getenv("DATA_DIR", "data"),
            mcp_server_port=int(os.getenv("MCP_SERVER_PORT", "8765")),
            workspace_dir=os.getenv("WORKSPACE_DIR", "workspace"),
        )

"""FastAPI entry point for Agent Control Center."""

from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from controlcenter.config import Config
from controlcenter.core.agent_registry import AgentRegistry
from controlcenter.core.communication_bus import CommunicationBus
from controlcenter.persistence.audit_logger import AuditLogger
from controlcenter.persistence.database import Database
from controlcenter.routers import agents, audit, skills, workflows, settings
from controlcenter.skills.skill_parser import SkillRegistry


def _init_components(app: FastAPI):
    config = Config()
    db = Database(config.audit_db_path)
    audit_logger = AuditLogger(db)
    registry = AgentRegistry()
    skill_registry = SkillRegistry()
    bus = CommunicationBus()

    # Load skills from disk
    skills_dir = config.resolve_path(config.skills_dir)
    if skills_dir.exists():
        skill_registry.load_directory(skills_dir)

    app.state.config = config
    app.state.db = db
    app.state.audit_logger = audit_logger
    app.state.registry = registry
    app.state.skill_registry = skill_registry
    app.state.bus = bus


@asynccontextmanager
async def lifespan(app: FastAPI):
    _init_components(app)
    yield
    if hasattr(app.state, "db"):
        app.state.db.close()


app = FastAPI(
    title="Agent Control Center",
    description="Autonomous Multi-Agent Orchestration Platform",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workflows.router)
app.include_router(agents.router)
app.include_router(skills.router)
app.include_router(audit.router)
app.include_router(settings.router)


@app.get("/")
async def root():
    return {"app": "Agent Control Center", "version": "2.0.0", "status": "running"}


# Serve frontend static files in production (Docker)
_static_dir = Path(__file__).resolve().parent.parent.parent / "static"
if _static_dir.exists():
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = _static_dir / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(_static_dir / "index.html")

    app.mount("/assets", StaticFiles(directory=str(_static_dir / "assets")), name="static")

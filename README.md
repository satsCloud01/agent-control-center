# Agent Control Center

A production-grade autonomous multi-agent orchestration platform built with **FastAPI**, **React**, **LangGraph**, and **LangChain**. Define a problem in natural language, and the system automatically decomposes it into subtasks, spins up specialized AI agents, executes them concurrently, and synthesizes the results.

```
Problem Statement --> [Decompose] --> [Assign Agents] --> [Execute Concurrently] --> [Synthesize] --> Result
```

## Features

- **Automatic task decomposition** — LLM-powered breakdown of complex problems into independent subtasks
- **Skill-based agent matching** — Tag-based matching to assign the best agent skill to each subtask
- **Concurrent execution** — All sub-agents run in parallel via `asyncio.gather()`
- **Multi-provider LLM support** — OpenAI (GPT-4o) and Anthropic (Claude) configurable per agent
- **Full tool access** — Web search, sandboxed code execution, scoped file I/O, HTTP API calls
- **MCP integration** — Both server (expose orchestration as MCP tools) and client (connect to external MCP servers)
- **Custom agent skills** — Define new agents via `.skill.md` files (YAML frontmatter + Markdown prompt)
- **Audit logging** — Every event persisted to SQLite: workflow lifecycle, agent spawning, tool calls, results
- **Modern React UI** — Dark-themed dashboard with guided wizard tour, matching Enterprise AI Guardian design
- **BYOK (Bring Your Own Key)** — API keys entered via UI, stored in browser localStorage, passed via HTTP headers — never persisted server-side

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python 3.12), LangGraph, LangChain |
| Frontend | React 18, Vite, Tailwind CSS 3.4, Recharts |
| Orchestration | LangGraph StateGraph (Supervisor pattern) |
| LLM Providers | Anthropic Claude, OpenAI GPT-4o |
| Database | SQLite (audit logs, workflow runs) |
| Tools | Tavily Search, subprocess executor, httpx |

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+

### Run Locally

```bash
./start.sh
```

This starts:
- **Backend**: http://localhost:8006
- **Frontend**: http://localhost:5173

### Manual Start

```bash
# Backend
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
PYTHONPATH=src .venv/bin/uvicorn controlcenter.main:app --reload --port 8006

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### First Steps

1. Open http://localhost:5173
2. Go to **Settings** and add your API key (Anthropic or OpenAI)
3. Go to **Workflow Studio** and describe a problem, then click **Launch Agent Infrastructure**
4. Watch agents decompose, execute, and synthesize results

## Pages

| Page | Description |
|------|-------------|
| **Landing** | Product overview with architecture flow diagram |
| **Dashboard** | Platform stats, recent workflows, agent status chart |
| **Workflow Studio** | Launch workflows with guided 8-step wizard tour |
| **Agent Viewer** | Live agent status, relationship graph, result cards |
| **Skill Manager** | Browse/add/delete agent skills, format reference |
| **Audit Logs** | Workflow history, event timeline, detail expansion |
| **Settings** | API key management (BYOK), platform config |

## API Keys (BYOK)

API keys are **never stored on the server**. They are:
1. Entered by the user in the Settings page
2. Stored in browser `localStorage`
3. Sent via HTTP headers (`X-Anthropic-Key`, `X-OpenAI-Key`, `X-Tavily-Key`) per request
4. Used for that single request, then discarded

## Running Tests

```bash
cd backend
PYTHONPATH=src .venv/bin/pytest tests/ -v
```

**146 tests** covering config, models, registry, skill parser, database, audit logger, supervisor parsing, and all 5 API router groups.

## Documentation

- [Architecture (C1-C4)](docs/architecture.md)
- [Domain Model](docs/domain-model.md)
- [API Specification](docs/api-spec.md)
- [Constraints & Design Decisions](docs/constraints.md)

## Project Structure

```
agent-control-center/
├── start.sh                    # Quick start script
├── Dockerfile                  # Production Docker image
├── skills/                     # Agent skill definitions (.skill.md)
├── backend/
│   ├── requirements.txt
│   ├── src/controlcenter/
│   │   ├── main.py             # FastAPI entry point
│   │   ├── config.py           # Runtime config (no secrets)
│   │   ├── routers/            # 5 API routers
│   │   ├── models/             # Pydantic + dataclass models
│   │   ├── core/               # Registry, factory, LLM, tools, bus
│   │   ├── orchestration/      # LangGraph supervisor + ReAct agents
│   │   ├── tools/              # 5 built-in tools
│   │   ├── skills/             # Skill parser + registry
│   │   └── persistence/        # SQLite DB + audit logger
│   └── tests/                  # 146 tests
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Router + layout
│   │   ├── pages/              # 7 pages
│   │   ├── components/         # UI components + sidebar
│   │   ├── hooks/              # useTour
│   │   └── lib/                # API client
│   └── package.json
└── docs/                       # Architecture, domain model, API spec, constraints
```

## Production

- **URL**: https://agent-control.satszone.link
- **Docker port**: 8023
- **Deploy**: `ssh in, cd ~/apps/agent-control-center && git pull && sudo docker compose build agent-control-center && sudo docker compose up -d agent-control-center`

## License

MIT

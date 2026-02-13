# Agent Control Center

A production-grade autonomous multi-agent orchestration platform built with **LangGraph**, **LangChain**, and **Streamlit**. Define a problem in natural language, and the system automatically decomposes it into subtasks, spins up specialized AI agents, executes them concurrently, and synthesizes the results.

```
Problem Statement --> [Decompose] --> [Assign Agents] --> [Execute Concurrently] --> [Synthesize] --> Result
```

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Component Reference](#component-reference)
  - [Orchestration Engine](#orchestration-engine)
  - [Core Framework](#core-framework)
  - [Tool Layer](#tool-layer)
  - [Skill System](#skill-system)
  - [Persistence Layer](#persistence-layer)
  - [MCP Integration](#mcp-integration)
  - [Streamlit UI](#streamlit-ui)
- [Skill.md Format](#skillmd-format)
- [Configuration Reference](#configuration-reference)
- [Scalability Guide](#scalability-guide)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests)

---

## Features

- **Automatic task decomposition** - LLM-powered breakdown of complex problems into independent subtasks
- **Skill-based agent matching** - Tag-based matching to assign the best agent skill to each subtask
- **Concurrent execution** - All sub-agents run in parallel via `asyncio.gather()`
- **Multi-provider LLM support** - OpenAI (GPT-4o) and Anthropic (Claude) configurable per agent
- **Full tool access** - Web search, sandboxed code execution, scoped file I/O, HTTP API calls
- **MCP integration** - Both server (expose orchestration as MCP tools) and client (connect to external MCP servers)
- **Custom agent skills** - Define new agents via `.skill.md` files (YAML frontmatter + Markdown prompt)
- **Audit logging** - Every event persisted to SQLite: workflow lifecycle, agent spawning, tool calls, results
- **Visual agent dashboard** - NetworkX graph showing agent relationships, status metrics, expandable result cards
- **Skill Manager UI** - Browse, upload, and paste new skill definitions directly in the browser

---

## Quick Start

### Prerequisites

- Python 3.10+
- At least one LLM API key (OpenAI or Anthropic)

### Installation

```bash
cd agent-control-center

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install the package
pip install -e ".[dev]"

# Configure API keys
cp .env.example .env
# Edit .env and add your API keys
```

### Run the Application

```bash
streamlit run src/agent_control_center/ui/app.py
```

The UI opens at `http://localhost:8501`. Navigate to **Problem Input**, describe your problem, and click **Launch Agent Infrastructure**.

### Run as MCP Server

```bash
python -m agent_control_center.mcp.mcp_server
```

This exposes the orchestration as MCP tools that external AI clients (Claude Desktop, other agents) can call.

---

## Architecture Overview

The system follows the **Supervisor pattern** implemented as a LangGraph `StateGraph`:

```
                         +-------------+
                         |   Problem   |
                         |  Statement  |
                         +------+------+
                                |
                         +------v------+
                         |  DECOMPOSE  |  LLM breaks problem into subtasks
                         +------+------+
                                |
                         +------v------+
                         |   ASSIGN    |  Match skills, create agents
                         +------+------+
                                |
                    +-----------+-----------+
                    |           |           |
               +----v----+ +---v---+ +----v----+
               | Agent 1 | | Agent2| | Agent 3 |   EXECUTE (concurrent)
               | (ReAct) | |(ReAct)| | (ReAct) |
               +----+----+ +---+---+ +----+----+
                    |           |           |
                    +-----------+-----------+
                                |
                         +------v------+
                         | SYNTHESIZE  |  Combine all results
                         +------+------+
                                |
                         +------v------+
                         |   Result    |
                         +-------------+
```

Each sub-agent is a **ReAct loop** (Reasoning + Acting) powered by `langgraph.prebuilt.create_react_agent`, with access to tools defined by its skill configuration.

Full C4 architecture documentation: [docs/architecture-c4.md](docs/architecture-c4.md)

---

## Component Reference

### Orchestration Engine

**Location**: `src/agent_control_center/orchestration/`

The heart of the system. The supervisor graph manages the entire workflow lifecycle.

| File | Purpose |
|---|---|
| `state.py` | `SupervisorState` TypedDict defining the LangGraph state schema: problem_statement, subtasks, active_agents, final_result, workflow_id |
| `supervisor.py` | Builds the 4-node `StateGraph` (decompose, assign, execute, synthesize) with conditional routing. Handles concurrent agent execution via `asyncio.gather()` |
| `graph_builder.py` | Creates per-agent ReAct sub-graphs using `create_react_agent()` with skill-defined system prompts and filtered tool sets |

**How decomposition works**: The supervisor sends the problem statement to the LLM along with a list of available skills. The LLM returns a JSON array of subtasks, each with a description, required skill tags, and tool requirements. A robust JSON parser handles code blocks, surrounding text, and malformed output with a single-task fallback.

**How execution works**: All assigned agents run concurrently via `asyncio.gather()`. Each agent gets its own LLM instance (potentially different provider/model) and filtered tool set. Results are collected and failures are handled gracefully (failed agents return error strings rather than crashing the workflow).

---

### Core Framework

**Location**: `src/agent_control_center/core/`

The foundational components that wire everything together.

| File | Purpose |
|---|---|
| `llm_provider.py` | Factory that returns `ChatOpenAI` or `ChatAnthropic` instances. Each agent can override the default provider/model via its skill definition. Lazy imports to avoid loading unused SDKs. |
| `agent_registry.py` | Thread-safe singleton tracking all live agents and their relationships. Uses `threading.Lock` for safe concurrent access from Streamlit's re-execution model and async agent execution. Stores `AgentRecord` instances with status, task, result, and error fields. |
| `agent_factory.py` | Creates `AgentRecord` instances from a `SkillDefinition` + task description. Resolves the correct LLM and tool set for each agent based on its skill config. |
| `tool_manager.py` | Central registry of all available tools. Registers built-in tools on init, supports dynamic tool registration, and provides filtered tool lists based on skill-defined permissions. |
| `communication_bus.py` | Async pub/sub message bus using `asyncio.Queue` per agent. Supports targeted messaging (to a specific agent) and broadcast. Maintains a message log for debugging. |

**Thread Safety**: The `AgentRegistry` uses a singleton pattern with a class-level `threading.Lock`. This is necessary because Streamlit re-executes the script on every interaction, and multiple coroutines may update agent statuses concurrently during execution.

---

### Tool Layer

**Location**: `src/agent_control_center/tools/`

Built-in tools available to all agents (unless restricted by skill config).

| Tool | File | Description |
|---|---|---|
| `web_search` | `web_search.py` | Tavily search API wrapper. Returns up to 5 results with titles, URLs, and snippets. Requires `TAVILY_API_KEY`. |
| `code_execute` | `code_executor.py` | Executes Python code in a sandboxed subprocess with a 30-second timeout. Returns stdout + stderr. |
| `file_read` | `file_io.py` | Reads files from the agent workspace directory. Path-scoped to prevent directory traversal. Truncates output at 50K characters. |
| `file_write` | `file_io.py` | Writes files to the agent workspace directory. Creates parent directories automatically. Path validation prevents writes outside workspace. |
| `api_call` | `api_caller.py` | Generic HTTP client supporting GET/POST/PUT/DELETE/PATCH. Parses headers from newline-separated `Key: Value` format. 30-second timeout, response truncated at 4K characters. |

**Security**: File I/O tools are scoped to the `workspace/` directory. Path traversal attacks are blocked by resolving absolute paths and checking the prefix. Code execution uses `subprocess.run` with a timeout to prevent runaway processes.

---

### Skill System

**Location**: `src/agent_control_center/skills/` and `skills/`

The skill system enables users to define custom agent behaviors without writing Python code.

| File | Purpose |
|---|---|
| `skill_parser.py` | Parses `.skill.md` files using regex to split YAML frontmatter from Markdown body. Contains `SkillParser` (file/directory/text parsing) and `SkillRegistry` (in-memory skill store with tag-based matching). |

**Skill Matching Algorithm**: When a subtask needs an agent, the `SkillRegistry.find_best_match()` scores each skill:
- +3 points for each required skill tag found in the skill's `tags` list
- +2 points for substring match in the skill's `name` or `description`
- +1 point for tool name overlap
- Falls back to `DEFAULT_WORKER_SKILL` (general-purpose agent) if no match scores above 0

**Included Skills** (`skills/` directory):

| Skill File | Agent Name | Provider | Specialization |
|---|---|---|---|
| `example-researcher.skill.md` | web-researcher | Anthropic | Deep web research with structured reports |
| `code-developer.skill.md` | code-developer | Anthropic | Code writing, debugging, and testing |
| `data-analyst.skill.md` | data-analyst | OpenAI | Data analysis with Python and visualizations |

---

### Persistence Layer

**Location**: `src/agent_control_center/persistence/`

SQLite-backed audit logging for full observability.

| File | Purpose |
|---|---|
| `database.py` | SQLite connection with thread-safe locking, auto-schema creation. Three tables: `audit_events`, `agent_messages`, `workflow_runs`. Three indexes for query performance. |
| `audit_logger.py` | High-level logging API: `log()` for events, `log_message()` for agent conversations, `start_workflow()`/`complete_workflow()`/`fail_workflow()` for lifecycle management. Query methods for the UI. |

**Event Types Logged**:
- `workflow_started` - Problem statement received
- `decomposition` - Problem broken into N subtasks
- `agent_spawned` - Agent created with skill, provider, model
- `agent_started` - Agent begins executing its task
- `agent_completed` - Agent finished with result
- `agent_failed` - Agent encountered an error
- `synthesis` - Results combined into final answer
- `workflow_completed` / `workflow_failed` - Terminal states

**Database Schema**:
```sql
audit_events (id, timestamp, event_type, agent_id, agent_name, workflow_id, detail, level)
agent_messages (id, timestamp, workflow_id, agent_id, role, content, tool_calls)
workflow_runs (id, problem_statement, status, started_at, completed_at, final_result, subtask_count)
```

---

### MCP Integration

**Location**: `src/agent_control_center/mcp/`

Model Context Protocol support for programmatic access.

| File | Purpose |
|---|---|
| `mcp_server.py` | Exposes the orchestration engine as an MCP server via stdio. Three tools: `launch_agents` (trigger a workflow), `query_agent_status` (get all agent states), `get_workflow_result` (fetch completed workflow). |
| `mcp_client.py` | Connects agents to external MCP servers defined in skill.md `mcp_servers` field. Wraps external MCP tools as LangChain `BaseTool` instances for seamless integration. |

**Using as MCP Server with Claude Desktop**: Add to your Claude Desktop config (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "agent-control-center": {
      "command": "python",
      "args": ["-m", "agent_control_center.mcp.mcp_server"],
      "cwd": "/path/to/agent-control-center"
    }
  }
}
```

**Connecting External MCP Servers from Skills**: Add `mcp_servers` to a skill's YAML frontmatter:
```yaml
mcp_servers:
  - name: postgres
    command: uvx
    args: ["mcp-server-postgres", "postgresql://localhost/mydb"]
```

---

### Streamlit UI

**Location**: `src/agent_control_center/ui/`

Four-page application with sidebar navigation.

| Page | File | Features |
|---|---|---|
| **Problem Input** | `pages/problem_input.py` | Text area for problem statement, multi-select for available skills, provider/model selection, launch button, results display with subtask breakdown and synthesized answer |
| **Agent Dashboard** | `pages/agent_viewer.py` | NetworkX relationship graph (status-colored nodes with legend), summary metrics (total/completed/running/failed), data table, expandable agent result cards |
| **Skill Manager** | `pages/skill_manager.py` | Lists all loaded skills with config details, paste or upload new `.skill.md` files, format reference |
| **Audit Logs** | `pages/audit_logs.py` | Workflow history with expandable event tables, recent events across all workflows with configurable limit slider |

**Reusable Components** (`ui/components/`):
- `graph_viz.py` - NetworkX DiGraph rendered via matplotlib with dark theme, status-colored nodes, edge labels, and legend
- `agent_card.py` - Expandable card showing agent metadata, assigned task, result, and errors
- `log_viewer.py` - Color-coded event stream with parsed JSON detail payloads

---

## Skill.md Format

Create `.skill.md` files in the `skills/` directory to define custom agents.

### Full Format Reference

```markdown
---
# REQUIRED
name: my-agent-name              # Unique kebab-case identifier

# OPTIONAL - LLM Configuration (overrides global defaults)
description: "What this agent does"
provider: anthropic              # "openai" or "anthropic"
model: claude-sonnet-4-20250514  # Any model supported by the provider
temperature: 0.2                 # 0.0 - 1.0
max_tokens: 4096                 # 100 - 16384

# OPTIONAL - Tool Access (omit for all tools)
tools:
  - web_search
  - code_execute
  - file_read
  - file_write
  - api_call

# OPTIONAL - Tags for Skill Matching
tags:
  - research
  - analysis

# OPTIONAL - External MCP Servers
mcp_servers:
  - name: postgres
    command: uvx
    args: ["mcp-server-postgres", "postgresql://localhost/mydb"]
---

# Everything below becomes the agent's system prompt.

You are a specialized agent that...

## Instructions
1. Step one
2. Step two

## Constraints
- Constraint one
- Constraint two
```

### Adding Skills via UI

1. Navigate to **Skill Manager** in the sidebar
2. Use the **Paste Definition** tab to paste a skill.md directly
3. Or use the **Upload File** tab to upload a `.skill.md` file
4. The skill is saved to the `skills/` directory and available for the next workflow

---

## Configuration Reference

All configuration is via environment variables (`.env` file):

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | (empty) | OpenAI API key for GPT models |
| `ANTHROPIC_API_KEY` | (empty) | Anthropic API key for Claude models |
| `DEFAULT_PROVIDER` | `anthropic` | Default LLM provider (`openai` or `anthropic`) |
| `DEFAULT_MODEL` | `claude-sonnet-4-20250514` | Default model for supervisor and unspecified agents |
| `MAX_TOKENS` | `4096` | Max tokens per LLM response |
| `TEMPERATURE` | `0.3` | Default temperature for LLM calls |
| `TAVILY_API_KEY` | (empty) | Tavily API key for web search tool |
| `SKILLS_DIR` | `skills` | Directory containing `.skill.md` files |
| `DATA_DIR` | `data` | Directory for SQLite database |
| `WORKSPACE_DIR` | `workspace` | Scoped directory for agent file I/O |
| `MCP_SERVER_PORT` | `8765` | Port for MCP server (reserved for future TCP mode) |

---

## Scalability Guide

The current implementation is designed for single-machine deployment. Here is a systematic guide for scaling each component to production workloads.

### 1. Database: SQLite to PostgreSQL

**Current**: SQLite with thread-safe locking, single file.

**Scale path**:
- Replace `persistence/database.py` with SQLAlchemy + asyncpg for PostgreSQL
- Gains: concurrent writes from multiple processes, connection pooling, MVCC (no global lock), full-text search on audit events, replication for read scaling
- Use Alembic for schema migrations
- Add a Redis or Memcached layer for hot query caching (recent workflow status)

```
SQLite (single process) --> PostgreSQL (multi-process) --> PostgreSQL + read replicas (high read)
```

### 2. Agent Execution: In-Process to Distributed Workers

**Current**: All agents run via `asyncio.gather()` in the Streamlit process.

**Scale path**:
- Extract agent execution into **Celery workers** or **Dramatiq tasks** with Redis/RabbitMQ as the broker
- Each worker runs one agent sub-graph independently
- The supervisor dispatches tasks to the queue and polls for results
- Gains: horizontal scaling (add more workers), process isolation (one agent crash doesn't kill others), resource management (memory/CPU limits per worker)
- For extreme scale, use **Kubernetes Jobs** or **AWS Lambda** per agent

```
asyncio.gather (single process) --> Celery + Redis (multi-worker) --> K8s Jobs (elastic)
```

### 3. UI: Streamlit to FastAPI + React

**Current**: Streamlit single-process server.

**Scale path**:
- Split into **FastAPI backend** (REST API + WebSocket for live updates) and **React frontend**
- Deploy FastAPI behind Nginx/Traefik with Gunicorn/Uvicorn workers
- Gains: true separation of concerns, independent scaling, WebSocket for real-time agent status updates, CDN for static assets
- Use Server-Sent Events (SSE) or WebSocket for streaming agent results to the UI

```
Streamlit (monolith) --> FastAPI + React (separated) --> FastAPI cluster + CDN (production)
```

### 4. Agent Registry: Singleton to Distributed State

**Current**: In-memory singleton with threading lock.

**Scale path**:
- Replace with **Redis** for shared state across processes/machines
- Store `AgentRecord` as Redis hashes, relationships as sorted sets
- Use Redis pub/sub for status change notifications
- Gains: process-independent state, crash recovery, multi-machine consistency

```
In-memory singleton --> Redis (shared state) --> Redis Cluster (HA)
```

### 5. Communication Bus: asyncio Queue to Message Broker

**Current**: In-process `asyncio.Queue` per agent.

**Scale path**:
- Replace with **RabbitMQ** or **Redis Streams** for durable, distributed messaging
- Gains: message persistence, cross-process delivery, message replay, dead letter queues for failed messages
- Add message schemas (Protobuf or Avro) for type-safe inter-agent communication

```
asyncio.Queue (in-process) --> Redis Streams (cross-process) --> RabbitMQ (enterprise)
```

### 6. Observability: SQLite Logs to Full Observability Stack

**Current**: Structured events in SQLite + Python logging.

**Scale path**:
- **Tracing**: Integrate LangSmith or OpenTelemetry for distributed tracing across agent calls
- **Metrics**: Prometheus + Grafana for agent execution times, LLM token usage, tool call counts, error rates
- **Logging**: Ship audit events to ELK (Elasticsearch, Logstash, Kibana) or Loki for full-text search and retention policies
- **Alerting**: PagerDuty/Slack alerts on workflow failure rates or agent error spikes

```
SQLite logs --> LangSmith (tracing) + Prometheus (metrics) + ELK (logs)
```

### 7. LLM Calls: Direct API to Gateway

**Current**: Direct `ChatOpenAI` / `ChatAnthropic` calls.

**Scale path**:
- Add **LiteLLM** or a custom gateway for unified API access, rate limiting, cost tracking, and fallback routing
- Implement **caching** (semantic cache via embeddings) for repeated similar queries
- Add **circuit breakers** for provider outages with automatic failover (OpenAI -> Anthropic)
- Track token usage per workflow for cost attribution

```
Direct API --> LiteLLM gateway (unified) --> Gateway + semantic cache + failover (production)
```

### 8. Skill System: Filesystem to Registry Service

**Current**: `.skill.md` files in a local directory.

**Scale path**:
- Store skills in a **database** (PostgreSQL) with versioning
- Build a **Skill Registry API** for CRUD operations with validation
- Add **skill versioning** (semver) and rollback capability
- Implement **skill marketplace** for sharing skills across teams/organizations

```
Filesystem (.skill.md) --> Database + API (versioned) --> Marketplace (shared)
```

### 9. Security Hardening

**Current**: Basic path scoping for file I/O, subprocess timeout for code execution.

**Production requirements**:
- Run code execution in **Docker containers** or **gVisor** sandboxes with resource limits
- Add **API key rotation** and secrets management (Vault, AWS Secrets Manager)
- Implement **RBAC** (Role-Based Access Control) for multi-user deployments
- Add **rate limiting** on workflow launches to prevent abuse
- Enable **TLS everywhere** for API communications
- Audit log tamper protection (append-only, checksummed)

### Summary: Scaling Dimensions

| Dimension | Current | Medium Scale | Large Scale |
|---|---|---|---|
| **Database** | SQLite | PostgreSQL | PostgreSQL + replicas |
| **Agent execution** | asyncio.gather | Celery + Redis | K8s Jobs |
| **UI** | Streamlit | FastAPI + React | FastAPI cluster + CDN |
| **State** | In-memory singleton | Redis | Redis Cluster |
| **Messaging** | asyncio.Queue | Redis Streams | RabbitMQ |
| **Observability** | SQLite audit log | LangSmith + Prometheus | Full ELK + tracing |
| **LLM routing** | Direct API | LiteLLM | Gateway + cache + failover |
| **Skills** | Filesystem | Database + API | Skill marketplace |
| **Code sandbox** | subprocess + timeout | Docker container | gVisor + resource limits |

---

## Project Structure

```
agent-control-center/
├── .env.example                          # Environment variable template
├── .gitignore
├── pyproject.toml                        # Package config, dependencies, tool settings
├── requirements.txt                      # Flat dependency list
├── README.md                             # This file
├── docs/
│   └── architecture-c4.md               # C4 architecture diagrams (Mermaid)
├── skills/                               # User-defined agent skill files
│   ├── example-researcher.skill.md       # Web research agent (Anthropic)
│   ├── code-developer.skill.md           # Code writing agent (Anthropic)
│   └── data-analyst.skill.md             # Data analysis agent (OpenAI)
├── data/                                 # Runtime data (auto-created)
│   └── audit.db                          # SQLite audit database
├── workspace/                            # Agent file I/O sandbox (auto-created)
├── src/agent_control_center/
│   ├── __init__.py
│   ├── config.py                         # Pydantic config from .env
│   ├── models/
│   │   ├── agent_models.py               # AgentRecord, AgentStatus enum
│   │   ├── skill_models.py               # SkillDefinition (Pydantic)
│   │   └── orchestration.py              # SupervisorState, SubTask TypedDicts
│   ├── core/
│   │   ├── llm_provider.py               # Multi-provider LLM factory
│   │   ├── agent_registry.py             # Thread-safe singleton agent tracker
│   │   ├── agent_factory.py              # Creates agents from skills
│   │   ├── tool_manager.py               # Tool registration and filtering
│   │   └── communication_bus.py          # Async pub/sub messaging
│   ├── orchestration/
│   │   ├── state.py                      # LangGraph state schema
│   │   ├── supervisor.py                 # Supervisor StateGraph (4 nodes)
│   │   └── graph_builder.py              # Per-agent ReAct sub-graphs
│   ├── tools/
│   │   ├── web_search.py                 # Tavily search wrapper
│   │   ├── code_executor.py              # Sandboxed Python execution
│   │   ├── file_io.py                    # Scoped file read/write
│   │   └── api_caller.py                 # Generic HTTP client
│   ├── mcp/
│   │   ├── mcp_server.py                 # MCP server (stdio)
│   │   └── mcp_client.py                 # MCP client for external servers
│   ├── persistence/
│   │   ├── database.py                   # SQLite connection + schema
│   │   └── audit_logger.py              # Structured event logging
│   ├── skills/
│   │   └── skill_parser.py               # .skill.md parser + SkillRegistry
│   └── ui/
│       ├── app.py                        # Streamlit entry point
│       ├── pages/
│       │   ├── problem_input.py          # Problem input + launch
│       │   ├── agent_viewer.py           # Agent dashboard
│       │   ├── skill_manager.py          # Skill CRUD
│       │   └── audit_logs.py             # Event log viewer
│       └── components/
│           ├── agent_card.py             # Agent status card
│           ├── graph_viz.py              # NetworkX graph renderer
│           └── log_viewer.py             # Log event stream
└── tests/
    ├── test_skill_parser.py              # 7 tests: parsing, matching, fallback
    ├── test_agent_registry.py            # 6 tests: CRUD, threading, relationships
    └── test_supervisor.py                # 5 tests: JSON parsing, code blocks, fallback
```

---

## Running Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run a specific test file
pytest tests/test_skill_parser.py

# Run with coverage (install pytest-cov first)
pip install pytest-cov
pytest --cov=agent_control_center --cov-report=term-missing
```

---

## License

MIT

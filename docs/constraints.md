# Agent Control Center -- Constraints and Design Decisions

---

## Table of Contents

1. [Security Constraints](#security-constraints)
2. [Performance Characteristics](#performance-characteristics)
3. [Scalability and Upgrade Paths](#scalability-and-upgrade-paths)
4. [Known Limitations](#known-limitations)
5. [Runtime Requirements](#runtime-requirements)
6. [Port Assignments](#port-assignments)

---

## Security Constraints

### API Key Handling (BYOK)

**Constraint:** API keys are NEVER persisted on the server -- not in `.env` files, not in the database, not in memory beyond a single request lifecycle.

**Implementation:**
- Users enter keys on the Settings page in the React SPA.
- Keys are stored in the browser's `localStorage`.
- Keys are sent per-request via HTTP headers: `X-OpenAI-Key`, `X-Anthropic-Key`, `X-Tavily-Key`.
- The backend extracts keys from headers, uses them for the duration of the workflow, and discards them.
- No key caching on the server side.

**Rationale:** This ensures the server is stateless with respect to credentials. Users maintain full control of their keys. Multiple users can use different keys without conflict.

**Residual risk:** Keys are visible in browser developer tools and in-transit without HTTPS. Always use HTTPS in production.

### File I/O Scoping

**Constraint:** The `file_read` and `file_write` tools are scoped to the `workspace/` directory.

**Implementation:**
- All file paths are resolved relative to the configured workspace directory.
- Path traversal attempts (e.g. `../../etc/passwd`) are detected and rejected.
- The workspace directory is created on startup if it does not exist.

### Code Execution Sandboxing

**Constraint:** The `code_execute` tool runs Python code in a sandboxed subprocess with strict limits.

**Implementation:**
- Code runs in a subprocess with a 30-second timeout (configurable).
- The subprocess inherits a restricted environment (no access to server environment variables).
- Standard output and standard error are captured and returned to the agent.
- If execution exceeds the timeout, the subprocess is killed and an error is returned.

**Limitations:** This is process-level isolation, not container-level. The subprocess shares the host filesystem and network. For production deployments handling untrusted code, consider running `code_execute` inside a Docker container or gVisor sandbox.

### No Authentication or Authorisation

**Constraint:** The application does not implement user authentication, session management, or role-based access control (RBAC).

**Rationale:** Agent Control Center is designed as a single-user developer tool. Adding auth is an explicit upgrade path for multi-tenant deployments (see Scalability section).

---

## Performance Characteristics

### Concurrent Agent Execution

Agents assigned to independent sub-tasks (no inter-task dependencies) execute concurrently via `asyncio.gather()`. This means:

- A workflow with 3 independent sub-tasks runs all 3 agents in parallel.
- Total execution time approximates the slowest agent rather than the sum of all agents.
- Dependent sub-tasks execute sequentially based on the dependency graph.

### SQLite Thread Safety

SQLite is configured with `check_same_thread=False` and uses SQLAlchemy's async engine with `aiosqlite`. Write operations are serialised by SQLite's internal locking mechanism.

**Expected throughput:** Adequate for dozens of concurrent workflows. If write contention becomes a bottleneck, migrate to PostgreSQL (see Scalability section).

### LLM Latency

LLM API calls (OpenAI, Anthropic) typically dominate total workflow execution time. Each node in the supervisor graph (decompose, assign, execute, synthesise) involves at least one LLM call. Agent execution may involve multiple LLM calls if tools are invoked (the LLM decides to call a tool, gets the result, then continues reasoning).

**Typical workflow time:** 30 seconds to 3 minutes depending on task complexity, number of sub-tasks, and LLM response times.

---

## Scalability and Upgrade Paths

The current architecture is designed for single-machine deployment. Below are documented upgrade paths for scaling.

### Database: SQLite to PostgreSQL

**When:** Multiple server instances, high write throughput, or need for concurrent writers.

**How:**
1. Replace `aiosqlite` with `asyncpg` in requirements.
2. Update the SQLAlchemy connection string to `postgresql+asyncpg://`.
3. Run Alembic migrations to create tables in PostgreSQL.
4. No application code changes needed (SQLAlchemy abstracts the dialect).

### Task Queue: In-Process to Celery + Redis

**When:** Workflow execution should survive server restarts, or need to distribute work across multiple worker processes.

**How:**
1. Add `celery` and `redis` to requirements.
2. Wrap the `SupervisorGraph.run()` call in a Celery task.
3. The API endpoint returns immediately with a workflow ID; the client polls for completion.
4. Redis serves as both the message broker and result backend.

### Caching: Add Redis

**When:** Repeated queries for the same data (skill listings, audit stats), or need for shared state across instances.

**How:**
1. Add `redis` and `aioredis` to requirements.
2. Cache skill registry, audit stats, and workflow metadata with TTL-based expiration.

### Container Orchestration: Docker to Kubernetes

**When:** Need for horizontal scaling, auto-scaling, rolling deployments, or multi-region deployment.

**How:**
1. Create Kubernetes Deployment manifests for the backend and frontend.
2. Use a Kubernetes Service + Ingress for routing.
3. Mount skill files via a PersistentVolumeClaim or store them in a database.
4. Use a managed PostgreSQL service (RDS, Cloud SQL) instead of SQLite.

### Authentication: Add RBAC

**When:** Multi-user or multi-tenant deployment.

**How:**
1. Add `python-jose` and `passlib` for JWT-based auth.
2. Create a `users` table with roles (admin, operator, viewer).
3. Protect API endpoints with FastAPI dependency injection for role checks.
4. Store API keys per-user in encrypted form (or continue with BYOK per-session).

---

## Known Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| **Single-machine deployment** | Cannot horizontally scale; single point of failure | Use Docker health checks + auto-restart; upgrade to K8s for HA |
| **In-memory agent registry** | Agent state is lost on server restart | Persist agent records to database; implement workflow recovery |
| **No authentication / RBAC** | Anyone with network access can use the API | Deploy behind a VPN or reverse proxy with auth; add JWT auth |
| **SQLite single-writer** | Write contention under heavy concurrent load | Migrate to PostgreSQL |
| **Process-level code sandbox** | `code_execute` shares host filesystem and network | Run in Docker container for production |
| **No streaming responses** | Client waits for full workflow completion | Add WebSocket or SSE endpoint for real-time progress |
| **Skill matching is keyword-based** | May not always select the optimal skill for a task | Improve with embedding-based similarity matching |
| **No workflow resumption** | Failed workflows cannot be retried from the point of failure | Add checkpointing via LangGraph's built-in persistence |

---

## Runtime Requirements

### Backend

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | 3.12+ | Required for modern typing features used throughout |
| pip dependencies | See `requirements.txt` | Key packages: `fastapi`, `uvicorn`, `langgraph`, `langchain-openai`, `langchain-anthropic`, `aiosqlite`, `sqlalchemy`, `pydantic>=2.0` |
| Operating system | macOS, Linux | Windows not tested but should work |

### Frontend

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | Tested with Node 25.6.0 |
| npm | 9+ | Comes with Node.js |
| npm dependencies | See `package.json` | Key packages: `react@18`, `vite`, `tailwindcss`, `react-router-dom` |

### Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Primary development browser |
| Firefox | 90+ | Fully supported |
| Safari | 15+ | Fully supported |
| Edge | 90+ | Fully supported |

`localStorage` is required for API key storage. Private/incognito mode may clear keys on window close.

---

## Port Assignments

| Component | Port | Configurable | Notes |
|-----------|------|-------------|-------|
| FastAPI Backend | 8006 | Yes (CLI arg) | `--port 8006` on uvicorn command |
| React Frontend (dev) | 5173 | Yes (vite.config) | Vite dev server default |
| React Frontend (prod) | 443 | Via Nginx | Served by Nginx in Docker deployment |
| SQLite | N/A | N/A | File-based, no network port |

The frontend development server proxies `/api` requests to `http://localhost:8006` via the Vite proxy configuration.

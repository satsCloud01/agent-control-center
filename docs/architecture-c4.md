# Agent Control Center - C4 Architecture Documentation

This document describes the architecture of the Autonomous Agent Control Center using the [C4 model](https://c4model.com/) standard: **Context**, **Container**, **Component**, and **Code** diagrams.

All diagrams use [Mermaid](https://mermaid.js.org/) syntax and render natively on GitHub, GitLab, and most documentation platforms.

---

## Level 1: System Context Diagram

The highest-level view showing the Agent Control Center and its external actors/systems.

```mermaid
C4Context
    title System Context Diagram - Agent Control Center

    Person(user, "User", "Data scientist, developer, or analyst who defines problems to solve")
    Person(admin, "Skill Author", "Creates .skill.md files to define custom agent behaviors")

    System(acc, "Agent Control Center", "Multi-agent orchestration platform that decomposes problems, spawns specialized AI agents, and synthesizes results")

    System_Ext(openai, "OpenAI API", "GPT-4o and other OpenAI models")
    System_Ext(anthropic, "Anthropic API", "Claude Sonnet/Opus models")
    System_Ext(tavily, "Tavily Search API", "Web search for real-time information retrieval")
    System_Ext(mcp_ext, "External MCP Servers", "Third-party tools exposed via Model Context Protocol (databases, Slack, etc.)")
    System_Ext(ext_api, "External HTTP APIs", "Any REST/HTTP API agents may call during task execution")

    Rel(user, acc, "Submits problem statements, monitors agent execution, views results", "HTTPS / Browser")
    Rel(admin, acc, "Defines agent skills via .skill.md files or Skill Manager UI", "File system / Browser")
    Rel(acc, openai, "Sends prompts, receives completions", "HTTPS / REST")
    Rel(acc, anthropic, "Sends prompts, receives completions", "HTTPS / REST")
    Rel(acc, tavily, "Executes web search queries", "HTTPS / REST")
    Rel(acc, mcp_ext, "Connects to external tool servers", "stdio / MCP Protocol")
    Rel(acc, ext_api, "Agents make HTTP requests during task execution", "HTTPS")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

### Context Narrative

The **Agent Control Center** sits at the intersection of a human user and multiple AI model providers. A user describes a problem in natural language. The system uses an LLM to decompose that problem into independent subtasks, matches each subtask to a specialized agent skill, executes all agents concurrently (each backed by its own LLM call with tool access), and synthesizes the collective results into a unified answer. The system also exposes its orchestration capabilities via MCP, allowing external AI clients (Claude Desktop, other agents) to invoke it programmatically.

---

## Level 2: Container Diagram

Zooms into the Agent Control Center to show its major runtime containers.

```mermaid
C4Container
    title Container Diagram - Agent Control Center

    Person(user, "User", "Interacts via browser")

    Container_Boundary(acc, "Agent Control Center") {
        Container(ui, "Streamlit Web UI", "Python / Streamlit", "Browser-based interface for problem input, agent dashboard, skill management, and audit logs")
        Container(orchestrator, "Orchestration Engine", "Python / LangGraph", "Supervisor StateGraph that decomposes problems, spawns agents, manages execution lifecycle, and synthesizes results")
        Container(agent_runtime, "Agent Runtime", "Python / LangGraph", "Individual ReAct agent sub-graphs with tool-calling loops, one per subtask")
        Container(skill_system, "Skill System", "Python / YAML+Markdown", "Parses .skill.md files, maintains a registry of available agent capabilities, matches skills to tasks")
        Container(tool_layer, "Tool Layer", "Python / LangChain", "Built-in tools (web search, code execution, file I/O, API calls) and MCP client for external tools")
        Container(persistence, "Persistence Layer", "Python / SQLite", "Audit event logging, agent message history, workflow run tracking")
        Container(mcp_server, "MCP Server", "Python / MCP SDK", "Exposes orchestration as MCP tools for programmatic access by external AI clients")
        Container(comm_bus, "Communication Bus", "Python / asyncio", "Async pub/sub message passing between agents and the supervisor")
    }

    ContainerDb(sqlite, "SQLite Database", "SQLite", "Stores audit_events, agent_messages, workflow_runs tables")
    Container_Ext(llm_apis, "LLM Provider APIs", "OpenAI / Anthropic", "Language model inference endpoints")
    Container_Ext(search_api, "Tavily Search", "REST API", "Web search results")

    Rel(user, ui, "Submits problems, views agents, manages skills", "HTTPS")
    Rel(ui, orchestrator, "Triggers workflow, reads state", "Python in-process")
    Rel(orchestrator, agent_runtime, "Spawns and manages agent sub-graphs", "asyncio.gather")
    Rel(orchestrator, skill_system, "Queries for matching skills", "Python in-process")
    Rel(orchestrator, comm_bus, "Registers agents, routes messages", "Python in-process")
    Rel(orchestrator, persistence, "Logs all events and state transitions", "Python in-process")
    Rel(agent_runtime, tool_layer, "Invokes tools during ReAct loop", "Python in-process")
    Rel(agent_runtime, llm_apis, "Sends prompts with tool schemas", "HTTPS")
    Rel(tool_layer, search_api, "Web search queries", "HTTPS")
    Rel(persistence, sqlite, "Read/write audit data", "sqlite3")
    Rel(mcp_server, orchestrator, "Triggers workflows programmatically", "Python in-process")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

### Container Responsibilities

| Container | Technology | Responsibility |
|---|---|---|
| **Streamlit Web UI** | Streamlit 1.40+ | 4 pages: Problem Input, Agent Dashboard, Skill Manager, Audit Logs. Renders agent relationship graphs via NetworkX/matplotlib. |
| **Orchestration Engine** | LangGraph StateGraph | The supervisor pattern: `decompose` -> `assign` -> `execute` -> `synthesize` -> `END`. Manages the full lifecycle of a workflow run. |
| **Agent Runtime** | LangGraph `create_react_agent` | Each sub-agent is a lightweight ReAct loop with access to tools defined by its skill. Runs concurrently via `asyncio.gather`. |
| **Skill System** | YAML + Markdown parser | Reads `.skill.md` files (YAML frontmatter for config, Markdown body for system prompt), maintains a searchable registry with tag-based matching. |
| **Tool Layer** | LangChain tools | Wraps built-in tools (Tavily search, subprocess code execution, scoped file I/O, httpx API calls) and connects to external MCP servers. |
| **Persistence Layer** | SQLite | Three tables: `audit_events` (structured event log), `agent_messages` (conversation history), `workflow_runs` (workflow status and results). |
| **MCP Server** | MCP SDK (stdio) | Exposes `launch_agents`, `query_agent_status`, `get_workflow_result` as MCP tools for external consumption. |
| **Communication Bus** | asyncio Queue | Async pub/sub enabling inter-agent messaging with correlation IDs. Supports targeted and broadcast message patterns. |

---

## Level 3: Component Diagram

Zooms into the Orchestration Engine and Core modules to show internal components and their interactions.

```mermaid
C4Component
    title Component Diagram - Orchestration Engine & Core

    Container_Boundary(orchestration, "Orchestration Engine") {
        Component(supervisor, "Supervisor Graph", "LangGraph StateGraph", "4-node state machine: decompose, assign, execute, synthesize. Conditional routing based on next_action field.")
        Component(graph_builder, "Graph Builder", "Python", "Builds per-agent ReAct sub-graphs using create_react_agent with skill-defined system prompts and tool sets")
        Component(state, "Supervisor State", "TypedDict", "Typed state schema: problem_statement, subtasks[], active_agents[], final_result, workflow_id")
    }

    Container_Boundary(core, "Core Framework") {
        Component(llm_provider, "LLM Provider", "Python", "Factory that returns ChatOpenAI or ChatAnthropic instances based on provider/model configuration")
        Component(agent_registry, "Agent Registry", "Python / Singleton", "Thread-safe singleton tracking all live agents, their statuses, and parent-child relationships")
        Component(agent_factory, "Agent Factory", "Python", "Creates AgentRecord instances from SkillDefinition, wires up LLM and tool dependencies")
        Component(tool_manager, "Tool Manager", "Python", "Registers built-in tools, filters by skill-defined permissions, provides tool lists to agents")
        Component(comm_bus, "Communication Bus", "Python / asyncio", "Per-agent async queues for message passing between agents and the supervisor")
    }

    Container_Boundary(skills, "Skill System") {
        Component(skill_parser, "Skill Parser", "Python / YAML", "Parses .skill.md files: YAML frontmatter -> SkillDefinition, Markdown body -> system_prompt")
        Component(skill_registry, "Skill Registry", "Python", "Holds all loaded skills, provides find_best_match() for tag-based skill-to-task matching")
    }

    Rel(supervisor, llm_provider, "Gets supervisor LLM for decomposition and synthesis")
    Rel(supervisor, skill_registry, "Finds matching skills for each subtask")
    Rel(supervisor, agent_factory, "Creates agent records for assigned subtasks")
    Rel(supervisor, agent_registry, "Registers agents, updates statuses, reads results")
    Rel(supervisor, graph_builder, "Builds ReAct sub-graphs for each agent")
    Rel(supervisor, comm_bus, "Registers agents for message routing")
    Rel(graph_builder, llm_provider, "Gets per-agent LLM instance")
    Rel(graph_builder, tool_manager, "Gets filtered tool list for each agent")
    Rel(agent_factory, llm_provider, "Resolves provider/model for each agent")
    Rel(agent_factory, tool_manager, "Resolves allowed tools for each agent")
    Rel(skill_parser, skill_registry, "Loads parsed skills into registry")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

### Component Details

#### Supervisor Graph (`orchestration/supervisor.py`)

The supervisor is the central orchestration component implemented as a LangGraph `StateGraph` with four nodes:

```
[Entry] --> decompose --> assign --> execute --> synthesize --> [END]
```

| Node | Input | Output | Description |
|---|---|---|---|
| `decompose` | Problem statement + available skills | Subtask list | Uses LLM to break problem into independent subtasks with required skill tags |
| `assign` | Subtask list | Agent IDs + updated subtasks | Matches each subtask to best skill via `SkillRegistry.find_best_match()`, creates agents via `AgentFactory` |
| `execute` | Assigned subtasks | Completed subtasks with results | Runs all agents concurrently via `asyncio.gather()`, each as a ReAct sub-graph |
| `synthesize` | All subtask results | Final synthesized answer | Uses LLM to combine all agent outputs into a coherent response |

#### Agent Registry (`core/agent_registry.py`)

- **Pattern**: Thread-safe singleton (required because Streamlit re-runs scripts on interaction)
- **State**: `_agents: dict[str, AgentRecord]` + `_relationships: list[tuple[str, str, str]]`
- **Operations**: `register()`, `update_status()`, `get_agent()`, `get_all()`, `get_children()`, `get_relationships()`

#### Skill Registry (`skills/skill_parser.py`)

- **Matching algorithm**: Scores skills by tag overlap, name/description substring match, and tool overlap with required capabilities
- **Fallback**: Returns `DEFAULT_WORKER_SKILL` (general-purpose agent) when no match is found

---

## Level 4: Code Diagram

Zooms into the data flow of a single workflow execution.

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant UI as Streamlit UI
    participant S as Supervisor Graph
    participant SR as Skill Registry
    participant AF as Agent Factory
    participant AR as Agent Registry
    participant GB as Graph Builder
    participant A1 as Agent 1 (ReAct)
    participant A2 as Agent 2 (ReAct)
    participant LLM as LLM Provider API
    participant T as Tool Layer
    participant AL as Audit Logger
    participant DB as SQLite

    U->>UI: Enter problem statement + click Launch
    UI->>AL: start_workflow(workflow_id, problem)
    AL->>DB: INSERT workflow_runs
    UI->>S: ainvoke(initial_state)

    Note over S: DECOMPOSE NODE
    S->>LLM: Decomposition prompt + problem
    LLM-->>S: JSON subtask array
    S->>AL: log("decomposition", subtask_count)
    AL->>DB: INSERT audit_events

    Note over S: ASSIGN NODE
    loop For each subtask
        S->>SR: find_best_match(required_skills)
        SR-->>S: SkillDefinition
        S->>AF: create_agent(skill, task, parent="supervisor")
        AF-->>S: AgentRecord
        S->>AR: register(agent_record)
        S->>AL: log("agent_spawned", details)
    end

    Note over S: EXECUTE NODE (concurrent)
    par Agent 1 execution
        S->>GB: build_agent_graph(skill_1, tools, llm)
        GB-->>S: ReAct graph
        S->>A1: ainvoke(task_1)
        loop ReAct tool loop
            A1->>LLM: Prompt + tool schemas
            LLM-->>A1: Tool call decision
            A1->>T: Execute tool
            T-->>A1: Tool result
        end
        A1-->>S: Final result
        S->>AR: update_status(COMPLETED, result)
    and Agent 2 execution
        S->>GB: build_agent_graph(skill_2, tools, llm)
        GB-->>S: ReAct graph
        S->>A2: ainvoke(task_2)
        loop ReAct tool loop
            A2->>LLM: Prompt + tool schemas
            LLM-->>A2: Tool call decision
            A2->>T: Execute tool
            T-->>A2: Tool result
        end
        A2-->>S: Final result
        S->>AR: update_status(COMPLETED, result)
    end

    Note over S: SYNTHESIZE NODE
    S->>LLM: Synthesis prompt + all results
    LLM-->>S: Synthesized answer
    S->>AL: log("synthesis", result_length)

    S-->>UI: Final state with results
    UI->>AL: complete_workflow(workflow_id, result)
    AL->>DB: UPDATE workflow_runs
    UI-->>U: Display results + agent graph
```

---

## Level 3b: Component Diagram - UI Layer

```mermaid
C4Component
    title Component Diagram - Streamlit UI

    Container_Boundary(ui, "Streamlit Web UI") {
        Component(app, "App Entry Point", "app.py", "Page router with sidebar navigation and global settings (provider selection)")
        Component(problem_page, "Problem Input Page", "pages/problem_input.py", "Text area for problem statement, skill multi-select, launch button, results display with subtask breakdown")
        Component(dashboard, "Agent Dashboard", "pages/agent_viewer.py", "Agent relationship graph (NetworkX/matplotlib), status metrics, status table, expandable agent result cards")
        Component(skill_mgr, "Skill Manager", "pages/skill_manager.py", "Lists loaded skills, paste/upload new .skill.md files, format reference")
        Component(audit_page, "Audit Logs", "pages/audit_logs.py", "Workflow history with expandable event tables, recent events across all workflows")
        Component(graph_viz, "Graph Visualizer", "components/graph_viz.py", "Renders NetworkX DiGraph as matplotlib figure with status-colored nodes and relationship edges")
        Component(agent_card, "Agent Card", "components/agent_card.py", "Expandable card showing agent ID, skill, provider, model, task, result, and errors")
        Component(log_viewer, "Log Viewer", "components/log_viewer.py", "Color-coded event stream from audit_logger with parsed JSON details")
    }

    Rel(app, problem_page, "Routes to")
    Rel(app, dashboard, "Routes to")
    Rel(app, skill_mgr, "Routes to")
    Rel(app, audit_page, "Routes to")
    Rel(dashboard, graph_viz, "Renders agent graph")
    Rel(dashboard, agent_card, "Renders per-agent details")
    Rel(audit_page, log_viewer, "Renders event stream")

    UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

---

## Level 3c: Component Diagram - Persistence & MCP

```mermaid
C4Component
    title Component Diagram - Persistence & MCP Integration

    Container_Boundary(persistence, "Persistence Layer") {
        Component(database, "Database", "database.py", "SQLite connection with thread-safe locking, auto-creates schema on init (3 tables, 3 indexes)")
        Component(audit_logger, "Audit Logger", "audit_logger.py", "Structured event logging: workflow lifecycle, agent lifecycle, decomposition, synthesis. Query methods for UI.")
    }

    Container_Boundary(mcp, "MCP Integration") {
        Component(mcp_srv, "MCP Server", "mcp_server.py", "Exposes 3 tools via stdio: launch_agents, query_agent_status, get_workflow_result")
        Component(mcp_cli, "MCP Client", "mcp_client.py", "Connects to external MCP servers defined in skill.md, wraps their tools as LangChain BaseTool instances")
    }

    ContainerDb(sqlite, "SQLite", "audit.db", "audit_events | agent_messages | workflow_runs")

    Rel(audit_logger, database, "Executes SQL inserts/queries")
    Rel(database, sqlite, "sqlite3 connection")
    Rel(mcp_srv, audit_logger, "Logs workflow events")
    Rel(mcp_cli, mcp_srv, "Could chain to expose sub-tools")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## Data Model (Entity Relationship)

```mermaid
erDiagram
    WORKFLOW_RUNS {
        text id PK "UUID"
        text problem_statement
        text status "running | completed | failed"
        text started_at
        text completed_at
        text final_result
        int subtask_count
    }

    AUDIT_EVENTS {
        int id PK "Auto-increment"
        text timestamp
        text event_type "workflow_started | decomposition | agent_spawned | agent_started | agent_completed | agent_failed | synthesis | workflow_completed"
        text agent_id FK
        text agent_name
        text workflow_id FK
        text detail "JSON payload"
        text level "INFO | ERROR"
    }

    AGENT_MESSAGES {
        int id PK "Auto-increment"
        text timestamp
        text workflow_id FK
        text agent_id FK
        text role "system | human | ai | tool"
        text content
        text tool_calls "JSON array"
    }

    WORKFLOW_RUNS ||--o{ AUDIT_EVENTS : "generates"
    WORKFLOW_RUNS ||--o{ AGENT_MESSAGES : "contains"
```

---

## Deployment View

```mermaid
C4Deployment
    title Deployment Diagram - Local Development

    Deployment_Node(dev_machine, "Developer Machine", "macOS / Linux") {
        Deployment_Node(python_env, "Python 3.10+ Virtual Environment") {
            Container(streamlit, "Streamlit Server", "streamlit run", "Serves UI on localhost:8501")
            Container(orchestrator, "Orchestration Engine", "In-process", "Runs within Streamlit's Python process")
            Container(mcp, "MCP Server", "python -m mcp_server", "Optional stdio server for external AI clients")
        }
        Deployment_Node(fs, "File System") {
            ContainerDb(sqlite_file, "audit.db", "SQLite", "data/audit.db")
            Container(skills_dir, "Skills Directory", "Filesystem", "skills/*.skill.md")
            Container(workspace, "Agent Workspace", "Filesystem", "workspace/ (scoped file I/O)")
        }
    }

    Deployment_Node(cloud, "Cloud APIs") {
        Container(openai_api, "OpenAI API", "api.openai.com")
        Container(anthropic_api, "Anthropic API", "api.anthropic.com")
        Container(tavily_api, "Tavily API", "api.tavily.com")
    }

    Rel(streamlit, sqlite_file, "Read/write", "sqlite3")
    Rel(streamlit, skills_dir, "Read .skill.md files", "Filesystem")
    Rel(orchestrator, openai_api, "LLM calls", "HTTPS")
    Rel(orchestrator, anthropic_api, "LLM calls", "HTTPS")
    Rel(orchestrator, tavily_api, "Web search", "HTTPS")
```

---

## Architecture Decision Records (ADRs)

### ADR-001: LangGraph StateGraph over LangChain AgentExecutor

**Context**: The supervisor needs to manage multi-step orchestration with state tracking across decomposition, assignment, execution, and synthesis.

**Decision**: Use LangGraph `StateGraph` with explicit nodes and conditional edges.

**Rationale**: LangChain's `AgentExecutor` is designed for single-agent tool-calling loops. It cannot express multi-stage workflows with aggregate state (e.g., "are all subtask agents done?"). LangGraph provides typed state, conditional routing, and composable sub-graphs.

### ADR-002: SQLite for Audit Persistence

**Context**: Need durable audit logging that survives process restarts.

**Decision**: SQLite with thread-safe locking.

**Rationale**: Zero-configuration, file-based, adequate for single-process deployments. Avoids external database dependencies. Can be replaced with PostgreSQL for production scale (see Scalability section in README).

### ADR-003: Singleton Pattern for Agent Registry

**Context**: Streamlit re-executes the entire script on each user interaction. Multiple components need consistent access to the same agent state.

**Decision**: Thread-safe singleton with class-level lock.

**Rationale**: Ensures all UI pages and background tasks see the same agent registry. The `reset()` class method enables clean testing.

### ADR-004: skill.md Format with YAML Frontmatter

**Context**: Need a user-friendly format for defining custom agent skills.

**Decision**: YAML frontmatter (config) + Markdown body (system prompt), using `.skill.md` file extension.

**Rationale**: Familiar format (matches Hugo, Jekyll, Claude SKILL.md conventions). Separates structured metadata from free-form prompt content. Markdown body renders well in editors and documentation.

### ADR-005: NetworkX + matplotlib for Graph Visualization

**Context**: Need to visualize agent relationship graphs in the dashboard.

**Decision**: Use NetworkX for graph data structure, matplotlib for rendering, displayed via `st.pyplot()`.

**Rationale**: Pure Python stack, no JavaScript build step required. Adequate for the expected graph size (1 supervisor + N worker agents per workflow, typically N < 10). For larger deployments, can be upgraded to Graphviz, Pyvis, or a React-based D3 component.

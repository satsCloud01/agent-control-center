# Agent Control Center -- API Specification

> Base URL: `http://localhost:8006/api`
> All endpoints return JSON. All request bodies are JSON (`Content-Type: application/json`).

---

## Table of Contents

1. [Authentication](#authentication)
2. [Workflows](#workflows)
3. [Agents](#agents)
4. [Skills](#skills)
5. [Audit](#audit)
6. [Settings](#settings)
7. [Error Responses](#error-responses)

---

## Authentication

Agent Control Center uses a **BYOK (Bring Your Own Key)** model. API keys are **never stored on the server**. They are passed per-request via HTTP headers.

### Required Headers

| Header | Required For | Description |
|--------|-------------|-------------|
| `X-OpenAI-Key` | Workflows using OpenAI models | OpenAI API key (starts with `sk-`) |
| `X-Anthropic-Key` | Workflows using Anthropic models | Anthropic API key (starts with `sk-ant-`) |
| `X-Tavily-Key` | Workflows using `web_search` tool | Tavily Search API key |

Headers are only required when the corresponding provider or tool is used. For example, a workflow using only Anthropic models and no web search only needs `X-Anthropic-Key`.

---

## Workflows

### POST /api/workflows

Submit a new task for multi-agent execution.

**Headers:** `X-OpenAI-Key` and/or `X-Anthropic-Key` (depending on model), optionally `X-Tavily-Key`.

**Request Body:**

```json
{
  "task": "Research the top 3 Python web frameworks and write a comparison report",
  "model": "gpt-4o",
  "provider": "openai"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `task` | string | Yes | -- | The task description to execute |
| `model` | string | No | `gpt-4o` | LLM model for the supervisor |
| `provider` | string | No | `openai` | LLM provider (`openai` or `anthropic`) |

**Response:** `200 OK`

```json
{
  "workflow_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "completed",
  "task": "Research the top 3 Python web frameworks and write a comparison report",
  "sub_tasks": [
    {
      "id": "st-001",
      "description": "Research Django features and ecosystem",
      "status": "completed",
      "assigned_agent_id": "agent-001"
    },
    {
      "id": "st-002",
      "description": "Research FastAPI features and ecosystem",
      "status": "completed",
      "assigned_agent_id": "agent-002"
    },
    {
      "id": "st-003",
      "description": "Research Flask features and ecosystem",
      "status": "completed",
      "assigned_agent_id": "agent-003"
    }
  ],
  "final_result": "# Python Web Framework Comparison\n\n...",
  "created_at": "2026-03-10T14:30:00Z",
  "completed_at": "2026-03-10T14:31:45Z"
}
```

**Example:**

```bash
curl -X POST http://localhost:8006/api/workflows \
  -H "Content-Type: application/json" \
  -H "X-OpenAI-Key: sk-your-key-here" \
  -H "X-Tavily-Key: tvly-your-key-here" \
  -d '{"task": "Research Python web frameworks", "model": "gpt-4o", "provider": "openai"}'
```

---

### GET /api/workflows

List all workflow runs.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 50 | Maximum number of workflows to return |
| `offset` | integer | 0 | Number of workflows to skip |
| `status` | string | -- | Filter by status (`running`, `completed`, `failed`) |

**Response:** `200 OK`

```json
{
  "workflows": [
    {
      "workflow_id": "a1b2c3d4-...",
      "task": "Research Python web frameworks",
      "status": "completed",
      "model": "gpt-4o",
      "provider": "openai",
      "created_at": "2026-03-10T14:30:00Z",
      "completed_at": "2026-03-10T14:31:45Z"
    }
  ],
  "total": 1
}
```

**Example:**

```bash
curl http://localhost:8006/api/workflows?limit=10&status=completed
```

---

### GET /api/workflows/{id}

Get detailed information about a specific workflow.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Workflow identifier |

**Response:** `200 OK` -- Full workflow object (same schema as POST response).

**Response:** `404 Not Found`

```json
{"detail": "Workflow not found"}
```

**Example:**

```bash
curl http://localhost:8006/api/workflows/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

### GET /api/workflows/{id}/events

Get audit events for a specific workflow.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Workflow identifier |

**Response:** `200 OK`

```json
{
  "events": [
    {
      "id": 1,
      "workflow_id": "a1b2c3d4-...",
      "event_type": "workflow_started",
      "agent_id": null,
      "data": {"task": "Research Python web frameworks"},
      "timestamp": "2026-03-10T14:30:00Z"
    },
    {
      "id": 2,
      "event_type": "task_decomposed",
      "data": {"sub_task_count": 3},
      "timestamp": "2026-03-10T14:30:05Z"
    }
  ]
}
```

**Example:**

```bash
curl http://localhost:8006/api/workflows/a1b2c3d4-e5f6-7890-abcd-ef1234567890/events
```

---

### GET /api/workflows/{id}/messages

Get inter-agent messages for a specific workflow.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Workflow identifier |

**Response:** `200 OK`

```json
{
  "messages": [
    {
      "id": 1,
      "workflow_id": "a1b2c3d4-...",
      "sender_id": "supervisor",
      "receiver_id": "agent-001",
      "content": "Research Django features and ecosystem",
      "message_type": "task_assignment",
      "timestamp": "2026-03-10T14:30:06Z"
    }
  ]
}
```

**Example:**

```bash
curl http://localhost:8006/api/workflows/a1b2c3d4-e5f6-7890-abcd-ef1234567890/messages
```

---

## Agents

### GET /api/agents

List all agents in the registry.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | -- | Filter by status (`idle`, `running`, `completed`, `failed`) |

**Response:** `200 OK`

```json
{
  "agents": [
    {
      "id": "agent-001",
      "name": "web_researcher",
      "role": "Research Django features",
      "status": "completed",
      "model": "gpt-4o",
      "provider": "openai",
      "skill_name": "web_researcher",
      "tools": ["web_search"],
      "parent_id": "supervisor",
      "children_ids": [],
      "created_at": "2026-03-10T14:30:06Z",
      "completed_at": "2026-03-10T14:30:35Z"
    }
  ],
  "total": 3
}
```

**Example:**

```bash
curl http://localhost:8006/api/agents
```

---

### GET /api/agents/{id}

Get detailed information about a specific agent.

**Response:** `200 OK` -- Single agent object.

**Response:** `404 Not Found`

```json
{"detail": "Agent not found"}
```

**Example:**

```bash
curl http://localhost:8006/api/agents/agent-001
```

---

### GET /api/agents/{id}/children

Get all child agents of a specific agent.

**Response:** `200 OK`

```json
{
  "parent_id": "supervisor",
  "children": [
    {"id": "agent-001", "name": "web_researcher", "status": "completed"},
    {"id": "agent-002", "name": "code_analyst", "status": "completed"}
  ]
}
```

**Example:**

```bash
curl http://localhost:8006/api/agents/supervisor/children
```

---

### GET /api/agents/relationships/all

Get the complete agent relationship graph (all parent-child edges).

**Response:** `200 OK`

```json
{
  "relationships": [
    {"parent_id": "supervisor", "child_id": "agent-001"},
    {"parent_id": "supervisor", "child_id": "agent-002"},
    {"parent_id": "supervisor", "child_id": "agent-003"}
  ]
}
```

**Example:**

```bash
curl http://localhost:8006/api/agents/relationships/all
```

---

### DELETE /api/agents/clear

Clear all agents from the in-memory registry.

**Response:** `200 OK`

```json
{"message": "Agent registry cleared", "agents_removed": 4}
```

**Example:**

```bash
curl -X DELETE http://localhost:8006/api/agents/clear
```

---

## Skills

### GET /api/skills

List all registered skills.

**Response:** `200 OK`

```json
{
  "skills": [
    {
      "name": "web_researcher",
      "description": "Searches the web and summarises findings",
      "model": "gpt-4o",
      "provider": "openai",
      "tools": ["web_search"],
      "examples": ["Research trending topics", "Find recent news about..."]
    }
  ],
  "total": 5
}
```

**Example:**

```bash
curl http://localhost:8006/api/skills
```

---

### GET /api/skills/{name}

Get a specific skill definition.

**Response:** `200 OK` -- Full skill object including `system_prompt`.

**Response:** `404 Not Found`

```json
{"detail": "Skill not found"}
```

**Example:**

```bash
curl http://localhost:8006/api/skills/web_researcher
```

---

### POST /api/skills

Create or update a skill definition.

**Request Body:**

```json
{
  "name": "data_analyst",
  "description": "Analyses datasets and produces insights",
  "model": "gpt-4o",
  "provider": "openai",
  "tools": ["code_execute", "file_read"],
  "system_prompt": "You are a data analyst. Analyse the given data and produce clear insights with visualisations where appropriate.",
  "examples": ["Analyse this CSV data", "Find patterns in the dataset"]
}
```

**Response:** `201 Created`

```json
{
  "name": "data_analyst",
  "message": "Skill created successfully"
}
```

**Example:**

```bash
curl -X POST http://localhost:8006/api/skills \
  -H "Content-Type: application/json" \
  -d '{
    "name": "data_analyst",
    "description": "Analyses datasets",
    "model": "gpt-4o",
    "provider": "openai",
    "tools": ["code_execute", "file_read"],
    "system_prompt": "You are a data analyst.",
    "examples": ["Analyse this CSV"]
  }'
```

---

### DELETE /api/skills/{name}

Delete a skill definition (removes the `.skill.md` file).

**Response:** `200 OK`

```json
{"message": "Skill 'data_analyst' deleted"}
```

**Response:** `404 Not Found`

```json
{"detail": "Skill not found"}
```

**Example:**

```bash
curl -X DELETE http://localhost:8006/api/skills/data_analyst
```

---

### GET /api/skills/tools/available

List all tools available for skill configuration (built-in + MCP-discovered).

**Response:** `200 OK`

```json
{
  "tools": [
    {"name": "web_search", "description": "Search the web via Tavily", "source": "built-in"},
    {"name": "code_execute", "description": "Execute Python code in sandbox", "source": "built-in"},
    {"name": "file_read", "description": "Read files from workspace", "source": "built-in"},
    {"name": "file_write", "description": "Write files to workspace", "source": "built-in"},
    {"name": "api_call", "description": "Make HTTP requests", "source": "built-in"}
  ]
}
```

**Example:**

```bash
curl http://localhost:8006/api/skills/tools/available
```

---

## Audit

### GET /api/audit/events

Query audit events across all workflows.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 100 | Maximum events to return |
| `offset` | integer | 0 | Number of events to skip |
| `event_type` | string | -- | Filter by event type |
| `workflow_id` | UUID | -- | Filter by workflow |
| `start_time` | ISO datetime | -- | Events after this time |
| `end_time` | ISO datetime | -- | Events before this time |

**Response:** `200 OK`

```json
{
  "events": [
    {
      "id": 1,
      "workflow_id": "a1b2c3d4-...",
      "event_type": "workflow_started",
      "agent_id": null,
      "data": {"task": "..."},
      "timestamp": "2026-03-10T14:30:00Z"
    }
  ],
  "total": 42
}
```

**Example:**

```bash
curl "http://localhost:8006/api/audit/events?event_type=error&limit=20"
```

---

### GET /api/audit/messages

Query agent messages across all workflows.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 100 | Maximum messages to return |
| `offset` | integer | 0 | Number of messages to skip |
| `workflow_id` | UUID | -- | Filter by workflow |
| `message_type` | string | -- | Filter by type (`task_assignment`, `result`, `error`, `info`) |

**Response:** `200 OK`

```json
{
  "messages": [
    {
      "id": 1,
      "workflow_id": "a1b2c3d4-...",
      "sender_id": "supervisor",
      "receiver_id": "agent-001",
      "content": "Research Django...",
      "message_type": "task_assignment",
      "timestamp": "2026-03-10T14:30:06Z"
    }
  ],
  "total": 15
}
```

**Example:**

```bash
curl "http://localhost:8006/api/audit/messages?workflow_id=a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

---

### GET /api/audit/stats

Get aggregate audit statistics.

**Response:** `200 OK`

```json
{
  "total_workflows": 25,
  "completed_workflows": 20,
  "failed_workflows": 3,
  "running_workflows": 2,
  "total_events": 342,
  "total_messages": 156,
  "events_by_type": {
    "workflow_started": 25,
    "task_decomposed": 25,
    "agent_created": 75,
    "tool_invoked": 120,
    "agent_completed": 72,
    "agent_failed": 3,
    "workflow_completed": 20,
    "error": 5
  }
}
```

**Example:**

```bash
curl http://localhost:8006/api/audit/stats
```

---

## Settings

### GET /api/settings

Get current server configuration (no sensitive data).

**Response:** `200 OK`

```json
{
  "version": "2.0.0",
  "default_model": "gpt-4o",
  "default_provider": "openai",
  "workspace_dir": "workspace/",
  "skills_dir": "skills/",
  "code_execution_timeout": 30,
  "backend_port": 8006,
  "available_models": {
    "openai": ["gpt-4o", "gpt-4o-mini"],
    "anthropic": ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"]
  }
}
```

**Example:**

```bash
curl http://localhost:8006/api/settings
```

---

### GET /api/settings/health

Health check that optionally validates API key connectivity.

**Headers:** Optionally include `X-OpenAI-Key` and/or `X-Anthropic-Key` to test connectivity.

**Response:** `200 OK`

```json
{
  "status": "healthy",
  "database": "connected",
  "skills_loaded": 5,
  "agents_active": 0,
  "api_keys": {
    "openai": "valid",
    "anthropic": "not_provided",
    "tavily": "not_provided"
  }
}
```

**Example:**

```bash
curl http://localhost:8006/api/settings/health \
  -H "X-OpenAI-Key: sk-your-key-here"
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "detail": "Human-readable error message"
}
```

### Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `200` | OK | Successful request |
| `201` | Created | Skill created successfully |
| `400` | Bad Request | Invalid request body, missing required fields |
| `401` | Unauthorized | Missing or invalid API key header for the requested provider |
| `404` | Not Found | Workflow, agent, or skill does not exist |
| `422` | Validation Error | Pydantic validation failure (FastAPI auto-generated) |
| `500` | Internal Server Error | Unexpected server error, LLM API failure |

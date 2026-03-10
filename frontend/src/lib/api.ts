const BASE = '/api'

function getKeys() {
  return {
    'X-OpenAI-Key': localStorage.getItem('acc_openai_key') || '',
    'X-Anthropic-Key': localStorage.getItem('acc_anthropic_key') || '',
    'X-Tavily-Key': localStorage.getItem('acc_tavily_key') || '',
  }
}

async function request(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getKeys(),
    ...(opts.headers as Record<string, string> || {}),
  }
  const res = await fetch(`${BASE}${path}`, { ...opts, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail || res.statusText)
  }
  return res.json()
}

export const api = {
  // Workflows
  launchWorkflow: (data: { problem_statement: string; provider?: string; model?: string }) =>
    request('/workflows', { method: 'POST', body: JSON.stringify(data) }),
  listWorkflows: (limit = 20) => request(`/workflows?limit=${limit}`),
  getWorkflow: (id: string) => request(`/workflows/${id}`),
  getWorkflowEvents: (id: string) => request(`/workflows/${id}/events`),

  // Agents
  listAgents: () => request('/agents'),
  getAgent: (id: string) => request(`/agents/${id}`),
  getRelationships: () => request('/agents/relationships/all'),
  clearAgents: () => request('/agents/clear', { method: 'DELETE' }),

  // Skills
  listSkills: () => request('/skills'),
  getSkill: (name: string) => request(`/skills/${name}`),
  createSkill: (content: string) => request('/skills', { method: 'POST', body: JSON.stringify({ content }) }),
  deleteSkill: (name: string) => request(`/skills/${name}`, { method: 'DELETE' }),
  availableTools: () => request('/skills/tools/available'),

  // Audit
  getEvents: (workflowId?: string, limit = 100) =>
    request(`/audit/events?limit=${limit}${workflowId ? `&workflow_id=${workflowId}` : ''}`),
  getStats: () => request('/audit/stats'),

  // Settings
  getSettings: () => request('/settings'),
  health: () => request('/settings/health'),
}

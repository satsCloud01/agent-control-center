import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import {
  Users,
  Bot,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Agent {
  agent_id: string;
  name: string;
  skill_name: string;
  assigned_task: string;
  status: string;
  provider: string;
  model: string;
  result?: string;
  error?: string;
  supervisor_id?: string | null;
}

interface Relationship {
  supervisor_id: string;
  supervisor_name: string;
  child_ids: string[];
}

const statusColor: Record<string, string> = {
  completed: 'border-emerald-500',
  running: 'border-sky-500',
  failed: 'border-red-500',
  idle: 'border-slate-500',
};

const statusBg: Record<string, string> = {
  completed: 'bg-emerald-500/20 text-emerald-400',
  running: 'bg-sky-500/20 text-sky-400',
  failed: 'bg-red-500/20 text-red-400',
  idle: 'bg-slate-500/20 text-slate-400',
};

const nodeColor: Record<string, string> = {
  completed: 'border-emerald-500 bg-emerald-500/10',
  running: 'border-sky-500 bg-sky-500/10',
  failed: 'border-red-500 bg-red-500/10',
  idle: 'border-slate-600 bg-slate-800',
};

export default function AgentViewer() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = async () => {
    try {
      const [agentData, relData] = await Promise.all([
        api.listAgents(),
        api.getRelationships(),
      ]);
      setAgents(agentData);
      setRelationships(relData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch agent data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, 5000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh]);

  const toggleResult = (id: string) => {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleClear = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    try {
      await api.clearAgents?.();
      setAgents([]);
      setRelationships([]);
    } catch (err: any) {
      setError(err.message || 'Failed to clear agents');
    }
    setConfirmClear(false);
  };

  const total = agents.length;
  const completed = agents.filter((a) => a.status === 'completed').length;
  const running = agents.filter((a) => a.status === 'running').length;
  const failed = agents.filter((a) => a.status === 'failed').length;

  const agentMap = new Map(agents.map((a) => [a.agent_id, a]));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
            <Users className="w-7 h-7 text-indigo-400" />
            Agent Viewer
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor and inspect all registered agents and their relationships
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
              autoRefresh
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
          >
            <Trash2 className="w-4 h-4" />
            {confirmClear ? 'Confirm Clear?' : 'Clear All Agents'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Agents"
          value={total}
          icon={<Users className="w-5 h-5 text-indigo-400" />}
        />
        <StatCard
          label="Completed"
          value={completed}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          label="Running"
          value={running}
          icon={<Clock className="w-5 h-5 text-sky-400" />}
        />
        <StatCard
          label="Failed"
          value={failed}
          icon={<XCircle className="w-5 h-5 text-red-400" />}
        />
      </div>

      {/* Relationship Visualization */}
      {relationships.length > 0 && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Agent Relationships</h2>
          <div className="space-y-8">
            {relationships.map((rel) => {
              const supervisor = agentMap.get(rel.supervisor_id);
              const supStatus = supervisor?.status || 'idle';
              return (
                <div key={rel.supervisor_id} className="flex flex-col items-center gap-2">
                  {/* Supervisor node */}
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${nodeColor[supStatus] || nodeColor.idle}`}
                  >
                    <Bot className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium text-white">
                      {rel.supervisor_name || rel.supervisor_id.slice(0, 8)}
                    </span>
                    <Badge className={statusBg[supStatus] || statusBg.idle}>
                      {supStatus}
                    </Badge>
                  </div>

                  {/* Connector line */}
                  {rel.child_ids.length > 0 && (
                    <div className="w-px h-6 bg-slate-600" />
                  )}

                  {/* Horizontal connector bar */}
                  {rel.child_ids.length > 1 && (
                    <div
                      className="h-px bg-slate-600"
                      style={{
                        width: `${Math.min(rel.child_ids.length * 160, 640)}px`,
                      }}
                    />
                  )}

                  {/* Child agent nodes */}
                  <div className="flex flex-wrap justify-center gap-4">
                    {rel.child_ids.map((childId) => {
                      const child = agentMap.get(childId);
                      const cStatus = child?.status || 'idle';
                      return (
                        <div key={childId} className="flex flex-col items-center gap-1">
                          {rel.child_ids.length > 1 && (
                            <div className="w-px h-4 bg-slate-600" />
                          )}
                          <div
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${nodeColor[cStatus] || nodeColor.idle}`}
                          >
                            <Bot className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-medium text-slate-200">
                              {child?.name || childId.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agent Cards Grid */}
      {agents.length === 0 ? (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-12 text-center">
          <Bot className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No agents registered yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {agents.map((agent) => {
            const isExpanded = expandedResults.has(agent.agent_id);
            const borderColor = statusColor[agent.status] || statusColor.idle;
            return (
              <div
                key={agent.agent_id}
                className={`rounded-xl bg-slate-900 border border-slate-800 border-l-4 ${borderColor} p-5 space-y-3`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-indigo-400 shrink-0" />
                      <h3 className="text-white font-semibold truncate">
                        {agent.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {agent.agent_id.slice(0, 12)}...
                    </p>
                  </div>
                  <Badge className={statusBg[agent.status] || statusBg.idle}>
                    {agent.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-slate-500">Skill</span>
                    <p className="text-slate-200">{agent.skill_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Provider</span>
                    <p className="text-slate-200">{agent.provider || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Model</span>
                    <p className="text-slate-200">{agent.model || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Task</span>
                    <p className="text-slate-200 line-clamp-2">
                      {agent.assigned_task || '—'}
                    </p>
                  </div>
                </div>

                {agent.error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                    {agent.error}
                  </div>
                )}

                {agent.result && (
                  <div>
                    <button
                      onClick={() => toggleResult(agent.agent_id)}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" /> Hide Result
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" /> Show Result
                        </>
                      )}
                    </button>
                    {isExpanded && (
                      <pre className="mt-2 rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs text-slate-300 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {agent.result}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

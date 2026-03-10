import { useState, useEffect } from 'react';
import { ScrollText, Clock, ChevronDown, ChevronUp, Filter, HelpCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { TourOverlay } from '../components/ui/TourOverlay';
import { useTour } from '../hooks/useTour';

const TOUR_STEPS = [
  {
    target: '[data-tour="workflow-history"]',
    title: 'Workflow History',
    content: 'A table of all workflow runs showing problem statement, status, start time, and subtask count. Click any row to expand and see the detailed event timeline for that workflow.',
    example: 'Click a completed workflow row to see events like: workflow_started, decomposition, agent_spawned, agent_completed, synthesis, workflow_completed.',
  },
  {
    target: '[data-tour="recent-events"]',
    title: 'Recent Events Stream',
    content: 'A chronological stream of all platform events across all workflows. Each event shows timestamp, type, agent name, workflow ID, and detail payload.',
    proTip: 'Use the limit slider to control how many events are displayed. Click any event row to expand its full JSON detail.',
  },
  {
    target: '[data-tour="event-limit"]',
    title: 'Event Limit Slider',
    content: 'Control how many recent events are loaded. Slide from 10 to 200 events. Higher limits show more history but may take longer to load.',
    proTip: 'Start with 50 events for a quick overview, then increase if you need to trace a specific issue.',
  },
];

const EVENT_BADGE: Record<string, string> = {
  workflow_started: 'bg-indigo-900/50 border border-indigo-700/50 text-indigo-300',
  decomposition: 'bg-violet-900/50 border border-violet-700/50 text-violet-300',
  agent_spawned: 'bg-sky-900/50 border border-sky-700/50 text-sky-300',
  agent_started: 'bg-sky-900/50 border border-sky-700/50 text-sky-300',
  agent_completed: 'bg-emerald-900/50 border border-emerald-700/50 text-emerald-300',
  agent_failed: 'bg-red-900/50 border border-red-700/50 text-red-300',
  synthesis: 'bg-teal-900/50 border border-teal-700/50 text-teal-300',
  workflow_completed: 'bg-emerald-900/50 border border-emerald-700/50 text-emerald-300',
  workflow_failed: 'bg-red-900/50 border border-red-700/50 text-red-300',
};

const STATUS_BADGE: Record<string, string> = {
  completed: 'completed',
  running: 'running',
  failed: 'failed',
  pending: 'pending',
  idle: 'idle',
};

function truncateId(id: string) {
  return id?.length > 12 ? id.slice(0, 12) + '...' : id;
}

function formatTs(ts: string) {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleString();
}

function tryParseJson(val: any): string {
  if (!val) return '-';
  if (typeof val === 'string') {
    try {
      return JSON.stringify(JSON.parse(val), null, 2);
    } catch {
      return val;
    }
  }
  return JSON.stringify(val, null, 2);
}

export default function AuditLogs() {
  const tour = useTour(TOUR_STEPS, 'audit-logs');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [expandedWf, setExpandedWf] = useState<string | null>(null);
  const [wfEvents, setWfEvents] = useState<any[]>([]);
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [eventLimit, setEventLimit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [eventLimit]);

  async function load() {
    try {
      setLoading(true);
      const [wfData, evData] = await Promise.all([
        api.listWorkflows(50),
        api.getEvents(undefined, eventLimit),
      ]);
      setWorkflows(Array.isArray(wfData) ? wfData : wfData.workflows || []);
      setEvents(Array.isArray(evData) ? evData : evData.events || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleWorkflow(wfId: string) {
    if (expandedWf === wfId) {
      setExpandedWf(null);
      setWfEvents([]);
      return;
    }
    setExpandedWf(wfId);
    try {
      const data = await api.getEvents(wfId, 200);
      setWfEvents(Array.isArray(data) ? data : data.events || []);
    } catch {
      setWfEvents([]);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 text-red-300">
          Error loading audit logs: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Tour */}
      {tour.isActive && (
        <TourOverlay
          step={tour.step}
          currentStep={tour.currentStep}
          totalSteps={tour.totalSteps}
          onNext={tour.next}
          onPrev={tour.prev}
          onFinish={tour.finish}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 rounded-xl">
            <ScrollText className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
            <p className="text-sm text-slate-400">Workflow history and event stream</p>
          </div>
        </div>
        <button
          onClick={tour.start}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
        >
          <HelpCircle className="w-4 h-4" /> Guided Tour
        </button>
      </div>

      {/* Workflow History Table */}
      <div data-tour="workflow-history" className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Workflow History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="text-left px-5 py-3 font-medium">Workflow ID</th>
                <th className="text-left px-5 py-3 font-medium">Problem</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Started</th>
                <th className="text-left px-5 py-3 font-medium">Subtasks</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {workflows.map((wf) => (
                <>
                  <tr
                    key={wf.workflow_id || wf.id}
                    onClick={() => toggleWorkflow(wf.workflow_id || wf.id)}
                    className="border-b border-slate-800/50 hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 text-indigo-300 font-mono text-xs">
                      {truncateId(wf.workflow_id || wf.id || '')}
                    </td>
                    <td className="px-5 py-3 text-slate-200 max-w-xs truncate">
                      {wf.problem_statement || wf.problem || '-'}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={STATUS_BADGE[wf.status] || 'idle'}>
                        {wf.status || 'unknown'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {formatTs(wf.created_at || wf.started_at)}
                    </td>
                    <td className="px-5 py-3 text-slate-300">
                      {wf.subtasks?.length ?? wf.subtask_count ?? '-'}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {expandedWf === (wf.workflow_id || wf.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </td>
                  </tr>
                  {expandedWf === (wf.workflow_id || wf.id) && (
                    <tr key={`${wf.workflow_id || wf.id}-events`}>
                      <td colSpan={6} className="bg-slate-950/60 px-8 py-4">
                        {wfEvents.length === 0 ? (
                          <p className="text-slate-500 text-sm">No events recorded.</p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {wfEvents.map((ev, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-3 text-xs bg-slate-900/50 border border-slate-800/50 rounded-lg px-4 py-2"
                              >
                                <span className="text-slate-500 shrink-0 w-36">
                                  {formatTs(ev.timestamp)}
                                </span>
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                                    EVENT_BADGE[ev.event_type] || 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {ev.event_type}
                                </span>
                                <span className="text-slate-400 truncate">
                                  {ev.agent_name || ''} {ev.detail ? '- ' + (typeof ev.detail === 'string' ? ev.detail : JSON.stringify(ev.detail)).slice(0, 120) : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {workflows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No workflows found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Events Table */}
      <div data-tour="recent-events" className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Recent Events
          </h2>
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-500" data-tour="event-limit" />
            <label className="text-xs text-slate-400">Limit:</label>
            <input
              type="range"
              min={10}
              max={200}
              step={10}
              value={eventLimit}
              onChange={(e) => setEventLimit(Number(e.target.value))}
              className="w-28 accent-indigo-500"
            />
            <span className="text-xs text-indigo-300 font-mono w-8">{eventLimit}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="text-left px-5 py-3 font-medium">Timestamp</th>
                <th className="text-left px-5 py-3 font-medium">Event Type</th>
                <th className="text-left px-5 py-3 font-medium">Agent</th>
                <th className="text-left px-5 py-3 font-medium">Workflow</th>
                <th className="text-left px-5 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev, idx) => (
                <>
                  <tr
                    key={idx}
                    className="border-b border-slate-800/50 hover:bg-slate-800/40 cursor-pointer transition-colors"
                    onClick={() => setExpandedEvent(expandedEvent === idx ? null : idx)}
                  >
                    <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {formatTs(ev.timestamp)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${
                          EVENT_BADGE[ev.event_type] || 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {ev.event_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-300 text-xs">
                      {ev.agent_name || '-'}
                    </td>
                    <td className="px-5 py-3 text-indigo-300 font-mono text-xs">
                      {truncateId(ev.workflow_id || '')}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs max-w-xs truncate">
                      {ev.detail
                        ? (typeof ev.detail === 'string' ? ev.detail : JSON.stringify(ev.detail)).slice(0, 80)
                        : '-'}
                      {ev.detail && (
                        <span className="ml-2 text-slate-600">
                          {expandedEvent === idx ? (
                            <ChevronUp className="w-3 h-3 inline" />
                          ) : (
                            <ChevronDown className="w-3 h-3 inline" />
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                  {expandedEvent === idx && ev.detail && (
                    <tr key={`${idx}-detail`}>
                      <td colSpan={5} className="bg-slate-950/60 px-8 py-3">
                        <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono bg-slate-900/50 border border-slate-800/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                          {tryParseJson(ev.detail)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No events recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

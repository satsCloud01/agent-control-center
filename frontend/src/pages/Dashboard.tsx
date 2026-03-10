import { useState, useEffect } from 'react';
import {
  Bot,
  Workflow,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { TourOverlay } from '../components/ui/TourOverlay';
import { useTour } from '../hooks/useTour';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const TOUR_STEPS = [
  {
    target: '[data-tour="stats-row"]',
    title: 'Platform Statistics',
    content: 'At-a-glance metrics for your entire orchestration platform — total workflows launched, completion rates, active agents, and loaded skills.',
    proTip: 'Stats update each time you visit the dashboard. Launch a workflow from the Studio to see numbers change.',
  },
  {
    target: '[data-tour="recent-workflows"]',
    title: 'Recent Workflows',
    content: 'A live table of your most recent workflow runs. Click any row to navigate to the detailed workflow view with subtask breakdown and agent results.',
    example: 'Try launching a workflow like "Compare React vs Vue for enterprise apps" from the Studio, then return here to see it listed.',
  },
  {
    target: '[data-tour="agent-chart"]',
    title: 'Agent Status Chart',
    content: 'A donut chart showing the distribution of agent statuses — completed (green), running (indigo), failed (red), and idle (gray).',
    proTip: 'Hover over chart segments for exact counts. The chart aggregates across all workflows.',
  },
  {
    target: '[data-tour="quick-actions"]',
    title: 'Quick Actions',
    content: 'Jump directly to the most common tasks — launch a new workflow, manage agent skills, or review the audit trail.',
    proTip: 'Start with "Launch Workflow" to kick off your first multi-agent task.',
  },
];

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  running: '#6366f1',
  failed: '#ef4444',
  idle: '#64748b',
};

const BADGE_VARIANT: Record<string, string> = {
  completed: 'success',
  running: 'info',
  failed: 'danger',
  pending: 'warning',
  idle: 'secondary',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const tour = useTour(TOUR_STEPS, 'dashboard');
  const [stats, setStats] = useState<any>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [statsData, workflowData, skillData] = await Promise.all([
          api.getStats(),
          api.listWorkflows(10),
          api.listSkills(),
        ]);
        setStats(statsData);
        setWorkflows(Array.isArray(workflowData) ? workflowData : workflowData?.items ?? []);
        setSkills(Array.isArray(skillData) ? skillData : skillData?.items ?? []);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center max-w-md">
          <XCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const totalWorkflows = stats?.total_workflows ?? 0;
  const completed = stats?.completed ?? 0;
  const failed = stats?.failed ?? 0;
  const totalAgents = stats?.total_agents ?? 0;
  const loadedSkills = skills.length;

  const agentBreakdown = [
    { name: 'Completed', value: stats?.agents_completed ?? completed, color: STATUS_COLORS.completed },
    { name: 'Running', value: stats?.agents_running ?? 0, color: STATUS_COLORS.running },
    { name: 'Failed', value: stats?.agents_failed ?? failed, color: STATUS_COLORS.failed },
    { name: 'Idle', value: stats?.agents_idle ?? Math.max(0, totalAgents - (stats?.agents_running ?? 0)), color: STATUS_COLORS.idle },
  ].filter((d) => d.value > 0);

  const quickActions = [
    {
      title: 'Launch Workflow',
      description: 'Create and run a new multi-agent workflow',
      icon: Sparkles,
      path: '/studio',
    },
    {
      title: 'Manage Skills',
      description: 'Browse, add, and configure agent skills',
      icon: Workflow,
      path: '/skills',
    },
    {
      title: 'View Audit',
      description: 'Review execution logs and audit trail',
      icon: Clock,
      path: '/audit',
    },
  ];

  return (
    <div className="space-y-8">
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
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Bot className="h-7 w-7 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          </div>
          <p className="text-slate-400 text-sm ml-10">
            Platform overview and recent activity
          </p>
        </div>
        <button
          onClick={tour.start}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
        >
          <HelpCircle className="w-4 h-4" /> Guided Tour
        </button>
      </div>

      {/* Stats Row */}
      <div data-tour="stats-row" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Workflows"
          value={totalWorkflows}
          icon={<Workflow className="h-5 w-5 text-indigo-400" />}
        />
        <StatCard
          label="Completed"
          value={completed}
          icon={<CheckCircle2 className="h-5 w-5 text-green-400" />}
        />
        <StatCard
          label="Failed"
          value={failed}
          icon={<XCircle className="h-5 w-5 text-red-400" />}
        />
        <StatCard
          label="Total Agents"
          value={totalAgents}
          icon={<Users className="h-5 w-5 text-indigo-400" />}
        />
        <StatCard
          label="Loaded Skills"
          value={loadedSkills}
          icon={<Sparkles className="h-5 w-5 text-amber-400" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Workflows Table */}
        <div data-tour="recent-workflows" className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Workflows
          </h2>
          {workflows.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">
              No workflows yet. Launch one from the Studio.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="text-left py-2 pr-4 font-medium">Problem Statement</th>
                    <th className="text-left py-2 pr-4 font-medium">Status</th>
                    <th className="text-center py-2 pr-4 font-medium">Subtasks</th>
                    <th className="text-left py-2 pr-4 font-medium">Started</th>
                    <th className="text-left py-2 font-medium">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {workflows.map((wf: any) => (
                    <tr
                      key={wf.id}
                      onClick={() => navigate(`/workflows/${wf.id}`)}
                      className="border-b border-slate-800/50 hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 pr-4 text-slate-200 max-w-[260px] truncate">
                        {wf.problem_statement || wf.name || '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={(BADGE_VARIANT[wf.status] as any) || 'secondary'}>
                          {wf.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-center text-slate-300">
                        {wf.subtask_count ?? wf.subtasks?.length ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">
                        {wf.started_at
                          ? new Date(wf.started_at).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 text-slate-400 whitespace-nowrap">
                        {wf.completed_at
                          ? new Date(wf.completed_at).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Agent Status Pie Chart */}
        <div data-tour="agent-chart" className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Agent Status
          </h2>
          {agentBreakdown.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">
              No agent data available.
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={agentBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {agentBreakdown.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                      fontSize: '13px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-3">
                {agentBreakdown.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs text-slate-300">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div data-tour="quick-actions">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-left hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <action.icon className="h-6 w-6 text-indigo-400" />
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h3 className="text-white font-medium mb-1">{action.title}</h3>
              <p className="text-slate-400 text-sm">{action.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

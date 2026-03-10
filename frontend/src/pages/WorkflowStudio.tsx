import { useState } from 'react';
import { api } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Field, Textarea, Select } from '../components/ui/FormField';
import { TourOverlay } from '../components/ui/TourOverlay';
import { useTour } from '../hooks/useTour';
import {
  Workflow,
  Play,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Bot,
  Zap,
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BookOpen,
  Sparkles,
  Globe,
  Code,
  Shield,
  BarChart3,
  Lightbulb,
} from 'lucide-react';

const PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
];

const MODELS: Record<string, { value: string; label: string }[]> = {
  anthropic: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-haiku-4-20250414', label: 'Claude Haiku 4' },
    { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
  ],
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'o1-preview', label: 'o1-preview' },
  ],
};

interface ExampleScenario {
  title: string;
  icon: React.ReactNode;
  description: string;
  problem: string;
  tags: string[];
  agents: string[];
  difficulty: 'Starter' | 'Intermediate' | 'Advanced';
}

const EXAMPLE_SCENARIOS: ExampleScenario[] = [
  {
    title: 'Tech Stack Comparison',
    icon: <Globe className="w-4 h-4" />,
    description: 'Multi-agent research comparing two technologies with a synthesized recommendation.',
    problem:
      'Compare React vs Vue.js for building a large-scale enterprise dashboard. Research each framework\'s ecosystem, performance benchmarks, developer experience, corporate adoption, and long-term maintainability. Produce a decision matrix with weighted scores and a final recommendation for a team of 8 developers.',
    tags: ['research', 'analysis'],
    agents: ['Web Researcher', 'Data Analyst', 'Synthesizer'],
    difficulty: 'Starter',
  },
  {
    title: 'REST API Design',
    icon: <Code className="w-4 h-4" />,
    description: 'Design a production-ready API with OpenAPI spec, auth patterns, and sample code.',
    problem:
      'Design a complete REST API for an online bookstore. Include endpoints for: user registration/auth (JWT), book catalog with search/filter/pagination, shopping cart, order placement, payment processing, and admin inventory management. Produce an OpenAPI 3.0 specification, example request/response payloads, and a Python FastAPI implementation of the core endpoints.',
    tags: ['api', 'coding', 'design'],
    agents: ['API Designer', 'Code Developer', 'Synthesizer'],
    difficulty: 'Intermediate',
  },
  {
    title: 'Security Audit Report',
    icon: <Shield className="w-4 h-4" />,
    description: 'Analyze a code pattern for vulnerabilities, produce a risk-rated audit report.',
    problem:
      'Perform a security audit on a typical Node.js Express application that uses JWT authentication, MongoDB with Mongoose, file uploads with multer, and serves a React SPA. Identify OWASP Top 10 vulnerabilities, review common misconfigurations, check for dependency risks, and produce a risk-rated findings report with remediation steps for each issue.',
    tags: ['security', 'audit', 'review'],
    agents: ['Security Auditor', 'Web Researcher', 'Synthesizer'],
    difficulty: 'Intermediate',
  },
  {
    title: 'Data Pipeline Architecture',
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'Design an end-to-end data pipeline with code, cost analysis, and architecture docs.',
    problem:
      'Design a real-time data pipeline for an e-commerce company processing 10M events/day. Requirements: ingest clickstream and transaction events, enrich with user profiles, detect fraud in real-time (< 500ms), store in a data lake for analytics, and provide a dashboard with hourly KPIs. Compare Apache Kafka + Flink vs AWS Kinesis + Lambda approaches. Include architecture diagram description, cost estimates, and sample processing code.',
    tags: ['data', 'architecture', 'coding', 'analysis'],
    agents: ['Data Analyst', 'Code Developer', 'Web Researcher', 'Synthesizer'],
    difficulty: 'Advanced',
  },
  {
    title: 'Startup MVP Blueprint',
    icon: <Lightbulb className="w-4 h-4" />,
    description: 'Full product research, tech stack selection, API design, and implementation plan.',
    problem:
      'I\'m building a SaaS platform for AI-powered resume screening for recruiters. Research the competitive landscape (existing tools like Lever, Greenhouse, HireVue). Then design the MVP: define core features, choose a tech stack, design the database schema, create the REST API specification, write the key backend models in Python, and produce a 4-week sprint plan to reach MVP.',
    tags: ['research', 'api', 'coding', 'design', 'analysis'],
    agents: ['Web Researcher', 'API Designer', 'Code Developer', 'Data Analyst', 'Synthesizer'],
    difficulty: 'Advanced',
  },
  {
    title: 'Python Performance Analysis',
    icon: <Sparkles className="w-4 h-4" />,
    description: 'Write and benchmark Python code, analyze results, and recommend optimizations.',
    problem:
      'Write Python benchmark code comparing 5 approaches for processing a large CSV file (1M rows): pandas read_csv, polars scan_csv, DuckDB, pure csv module, and pyarrow. For each approach, measure: load time, memory usage, a groupby aggregation, and a filtered join. Execute the benchmarks, analyze the results statistically, and produce a recommendation with charts described in text.',
    tags: ['coding', 'data', 'analysis'],
    agents: ['Code Developer', 'Data Analyst', 'Synthesizer'],
    difficulty: 'Starter',
  },
];

const TOUR_STEPS = [
  {
    target: '[data-tour="examples-section"]',
    title: 'Pre-Built Example Scenarios',
    content: 'Start here! Click any example card to load a real-world multi-agent problem. Each card shows which agents will be spawned and the difficulty level.',
    example: 'Try "Tech Stack Comparison" first — it\'s a Starter scenario that spawns 3 agents and finishes in ~60 seconds.',
    proTip: 'The difficulty badge shows how many agents and tools are involved: Starter (2-3), Intermediate (3-4), Advanced (4-5).',
  },
  {
    target: '[data-tour="problem-input"]',
    title: 'Define Your Problem',
    content: 'The selected example auto-fills here, or write your own. Be specific — include constraints, context, and desired output format.',
    example: '"Compare the architectural trade-offs between microservices and monoliths for a fintech startup."',
    proTip: 'The supervisor LLM reads this and decides how many subtasks to create and which skills to assign.',
  },
  {
    target: '[data-tour="provider-select"]',
    title: 'Choose AI Provider',
    content: 'Select the AI provider whose models will power the supervisor and worker agents.',
    example: 'Anthropic for deep reasoning, OpenAI for broad general tasks.',
    proTip: 'Make sure you have the corresponding API key saved in Settings before launching.',
  },
  {
    target: '[data-tour="model-select"]',
    title: 'Select Model',
    content: 'Pick the specific model. More powerful models produce richer analysis but cost more.',
    example: 'Claude Sonnet 4 offers a great balance of quality and speed.',
    proTip: 'Start with a smaller model for iteration, then upgrade for the final run.',
  },
  {
    target: '[data-tour="launch-btn"]',
    title: 'Launch the Workflow',
    content: 'Click to spin up the orchestrator. It will: (1) decompose your problem into subtasks, (2) assign specialist agents, (3) execute them concurrently, (4) synthesize the final result.',
    example: 'A typical workflow takes 30–90 seconds depending on complexity and number of agents.',
    proTip: 'You can launch multiple workflows — each gets a unique Workflow ID tracked in Dashboard.',
  },
  {
    target: '[data-tour="results-section"]',
    title: 'Results Overview',
    content: 'After launch, see the workflow status, unique ID, and overall progress here.',
    example: 'Status badges show pending, running, completed, or failed.',
    proTip: 'Bookmark the Workflow ID to revisit results later from the Dashboard.',
  },
  {
    target: '[data-tour="subtasks-section"]',
    title: 'Subtask Breakdown',
    content: 'The orchestrator decomposes your problem into focused subtasks. Each one is handled by a specialist agent.',
    example: 'A comparison task might split into: research A, research B, analyze trade-offs, synthesize.',
    proTip: 'Expand any subtask card to see the full result returned by its agent.',
  },
  {
    target: '[data-tour="agents-section"]',
    title: 'Agent Cards',
    content: 'Each spawned agent is shown here with its skill, assigned model, and current status.',
    example: 'You might see a "web-researcher" agent, a "code-developer" agent, and an "api-designer" agent.',
    proTip: 'Agent skills are auto-selected from loaded skills. Add custom skills in the Skill Manager.',
  },
  {
    target: '[data-tour="final-result"]',
    title: 'Final Synthesized Result',
    content: 'The supervisor merges all subtask outputs into a single, coherent final answer displayed here.',
    example: 'The final result is formatted with sections, bullet points, and key takeaways.',
    proTip: 'Copy the result or export it — future versions will support PDF and Markdown export.',
  },
];

interface Subtask {
  task_id: string;
  description: string;
  status: string;
  assigned_agent?: string;
  result?: string;
}

interface Agent {
  name: string;
  skill: string;
  provider: string;
  model: string;
  status: string;
  assigned_task?: string;
}

interface WorkflowResult {
  workflow_id: string;
  status: string;
  subtasks: Subtask[];
  agents: Agent[];
  final_result?: string;
}

function statusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'done':
      return 'green';
    case 'running':
    case 'in_progress':
      return 'blue';
    case 'failed':
    case 'error':
      return 'red';
    default:
      return 'yellow';
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'done':
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    case 'running':
    case 'in_progress':
      return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    case 'failed':
    case 'error':
      return <AlertTriangle className="w-4 h-4 text-red-400" />;
    default:
      return <Clock className="w-4 h-4 text-yellow-400" />;
  }
}

export default function WorkflowStudio() {
  const [problem, setProblem] = useState('');
  const [provider, setProvider] = useState('anthropic');
  const [model, setModel] = useState(MODELS.anthropic[0].value);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [error, setError] = useState('');
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set());
  const [keyWarning, setKeyWarning] = useState('');

  const tour = useTour(TOUR_STEPS, 'workflow-studio');

  const handleProviderChange = (val: string) => {
    setProvider(val);
    setModel(MODELS[val][0].value);
  };

  const toggleSubtask = (id: string) => {
    setExpandedSubtasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLaunch = async () => {
    setError('');
    setKeyWarning('');

    const keyName = provider === 'anthropic' ? 'acc_anthropic_key' : 'acc_openai_key';
    const storedKey = localStorage.getItem(keyName);
    if (!storedKey) {
      setKeyWarning(
        `No ${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key found. Please add it in Settings before launching.`
      );
      return;
    }

    if (!problem.trim()) {
      setError('Please describe the problem you want to solve.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await api.launchWorkflow({
        problem_statement: problem.trim(),
        provider,
        model,
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to launch workflow. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
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

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30">
              <Workflow className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Workflow Studio</h1>
              <p className="text-sm text-slate-400">Launch agent workflows to solve complex problems</p>
            </div>
          </div>
          <button
            onClick={tour.start}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors text-sm"
          >
            <HelpCircle className="w-4 h-4" />
            Guided Tour
          </button>
        </div>

        {/* Example Scenarios */}
        <div data-tour="examples-section">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-300">Example Scenarios</h2>
            <span className="text-xs text-slate-500">— click any card to load it</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EXAMPLE_SCENARIOS.map((ex) => (
              <button
                key={ex.title}
                onClick={() => setProblem(ex.problem)}
                className={`text-left rounded-xl border p-4 transition-all hover:scale-[1.02] hover:shadow-lg ${
                  problem === ex.problem
                    ? 'border-indigo-500 bg-indigo-600/10 shadow-indigo-500/10'
                    : 'border-slate-800 bg-slate-900/40 hover:border-indigo-500/40 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-indigo-600/20 text-indigo-400">
                    {ex.icon}
                  </div>
                  <span className="font-semibold text-white text-sm">{ex.title}</span>
                  <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    ex.difficulty === 'Starter' ? 'bg-green-500/20 text-green-400' :
                    ex.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {ex.difficulty}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">{ex.description}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {ex.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Bot className="w-3 h-3" />
                  {ex.agents.length} agents: {ex.agents.join(' → ')}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Warnings */}
        {keyWarning && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {keyWarning}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Main Form Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <div data-tour="problem-input">
            <Field label="Problem Statement">
              <Textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Describe the problem or task you want the agent infrastructure to solve..."
                rows={4}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div data-tour="provider-select">
              <Field label="AI Provider">
                <Select
                  value={provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                >
                  {PROVIDERS.map((p: any) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div data-tour="model-select">
              <Field label="Model">
                <Select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {MODELS[provider].map((m: any) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          <div data-tour="launch-btn">
            <button
              onClick={handleLaunch}
              disabled={loading || !problem.trim()}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running Workflow...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Launch Agent Infrastructure
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6" data-tour="results-section">
            {/* Workflow ID + Status */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-indigo-400" />
                  <div>
                    <p className="text-sm text-slate-400">Workflow ID</p>
                    <p className="font-mono text-white text-sm">{result.workflow_id}</p>
                  </div>
                </div>
                <Badge variant={result.status}>{result.status}</Badge>
              </div>
            </div>

            {/* Subtasks */}
            {result.subtasks?.length > 0 && (
              <div data-tour="subtasks-section" className="space-y-3">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-400" />
                  Subtask Breakdown
                </h2>
                <div className="space-y-2">
                  {result.subtasks.map((st) => (
                    <div
                      key={st.task_id}
                      className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleSubtask(st.task_id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <StatusIcon status={st.status} />
                          <div className="min-w-0">
                            <p className="text-sm font-mono text-slate-300 truncate">{st.task_id}</p>
                            <p className="text-sm text-slate-400 truncate">{st.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          {st.assigned_agent && (
                            <span className="text-xs text-slate-500">{st.assigned_agent}</span>
                          )}
                          <Badge variant={st.status}>{st.status}</Badge>
                          {expandedSubtasks.has(st.task_id) ? (
                            <ChevronUp className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                      </button>
                      {expandedSubtasks.has(st.task_id) && st.result && (
                        <div className="px-4 pb-4 border-t border-slate-800">
                          <pre className="mt-3 text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                            {st.result}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agents */}
            {result.agents?.length > 0 && (
              <div data-tour="agents-section" className="space-y-3">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-400" />
                  Agents
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.agents.map((ag, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-sm">{ag.name}</span>
                        <Badge variant={ag.status}>{ag.status}</Badge>
                      </div>
                      <div className="space-y-1 text-xs text-slate-400">
                        <p>
                          <span className="text-slate-500">Skill:</span> {ag.skill}
                        </p>
                        <p>
                          <span className="text-slate-500">Provider:</span> {ag.provider}
                        </p>
                        <p>
                          <span className="text-slate-500">Model:</span> {ag.model}
                        </p>
                        {ag.assigned_task && (
                          <p>
                            <span className="text-slate-500">Task:</span>{' '}
                            <span className="font-mono">{ag.assigned_task}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Final Result */}
            {result.final_result && (
              <div data-tour="final-result" className="space-y-3">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  Final Result
                </h2>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {result.final_result}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import {
  Bot,
  Brain,
  Zap,
  GitBranch,
  Search,
  Code,
  BarChart3,
  Shield,
  Cpu,
  Wrench,
  ScrollText,
  ArrowRight,
  ChevronRight,
  Layers,
  Users,
  Activity,
  CheckCircle2,
  Workflow,
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Agent Control Center</span>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-primary px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-colors"
          >
            Open Platform
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            Autonomous Multi-Agent Orchestration
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Orchestrate Intelligent Agents.
            </span>
            <br />
            <span className="text-white">Solve Complex Problems.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            A powerful autonomous orchestration platform built on LangGraph. Describe any problem and watch
            specialized AI agents decompose, execute, and synthesize results — concurrently, reliably, and
            with full audit trails.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="btn-primary px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-base font-semibold transition-colors flex items-center gap-2"
            >
              Launch Platform <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#how-it-works"
              className="px-8 py-3 rounded-lg border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-base font-semibold transition-colors"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
              Workflow
            </span>
            <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
            <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
              From problem description to synthesized results in four automated steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: ScrollText,
                title: "Describe Problem",
                desc: "Provide a natural-language description of the task or question you want solved.",
              },
              {
                step: "02",
                icon: GitBranch,
                title: "Decompose into Subtasks",
                desc: "The orchestrator breaks the problem into independent, parallelizable subtasks.",
              },
              {
                step: "03",
                icon: Cpu,
                title: "Execute Agents Concurrently",
                desc: "Specialized agents work in parallel, each using the best-fit tools and LLM provider.",
              },
              {
                step: "04",
                icon: Layers,
                title: "Synthesize Results",
                desc: "Outputs are aggregated, validated, and presented as a unified, actionable response.",
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="card bg-slate-900/60 border border-slate-800/60 rounded-xl p-6 h-full hover:border-indigo-500/30 transition-colors">
                  <div className="text-indigo-500/30 text-4xl font-black mb-4">{item.step}</div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/10 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-indigo-500/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20 px-6 bg-slate-900/30 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
              Capabilities
            </span>
            <h2 className="text-3xl md:text-4xl font-bold">Platform Capabilities</h2>
            <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
              Enterprise-grade orchestration features designed for reliability, speed, and observability.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: GitBranch,
                title: "Task Decomposition",
                desc: "Automatically breaks complex problems into independent subtasks using LLM-driven planning.",
                color: "indigo",
              },
              {
                icon: Users,
                title: "Skill-Based Matching",
                desc: "Routes each subtask to the most capable agent based on skill profiles and historical performance.",
                color: "cyan",
              },
              {
                icon: Zap,
                title: "Concurrent Execution",
                desc: "Agents run in parallel with LangGraph state management — no sequential bottlenecks.",
                color: "emerald",
              },
              {
                icon: Brain,
                title: "Multi-Provider LLM",
                desc: "Supports Claude, GPT-4, Gemini, and local models. Select per-agent or let the orchestrator decide.",
                color: "violet",
              },
              {
                icon: Wrench,
                title: "Tool Access",
                desc: "Agents can browse the web, execute code, query databases, call APIs, and read/write files.",
                color: "amber",
              },
              {
                icon: Shield,
                title: "Audit Logging",
                desc: "Every decision, tool call, and agent interaction is logged with full provenance and timestamps.",
                color: "rose",
              },
            ].map((cap, i) => {
              const colorMap: Record<string, string> = {
                indigo: "from-indigo-600/10 to-indigo-600/5 border-indigo-500/20 text-indigo-400",
                cyan: "from-cyan-600/10 to-cyan-600/5 border-cyan-500/20 text-cyan-400",
                emerald: "from-emerald-600/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
                violet: "from-violet-600/10 to-violet-600/5 border-violet-500/20 text-violet-400",
                amber: "from-amber-600/10 to-amber-600/5 border-amber-500/20 text-amber-400",
                rose: "from-rose-600/10 to-rose-600/5 border-rose-500/20 text-rose-400",
              };
              const iconColorMap: Record<string, string> = {
                indigo: "text-indigo-400",
                cyan: "text-cyan-400",
                emerald: "text-emerald-400",
                violet: "text-violet-400",
                amber: "text-amber-400",
                rose: "text-rose-400",
              };
              const bgColorMap: Record<string, string> = {
                indigo: "bg-indigo-600/10",
                cyan: "bg-cyan-600/10",
                emerald: "bg-emerald-600/10",
                violet: "bg-violet-600/10",
                amber: "bg-amber-600/10",
                rose: "bg-rose-600/10",
              };
              return (
                <div
                  key={i}
                  className="card bg-slate-900/60 border border-slate-800/60 rounded-xl p-6 hover:border-indigo-500/30 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl ${bgColorMap[cap.color]} flex items-center justify-center mb-4`}>
                    <cap.icon className={`w-6 h-6 ${iconColorMap[cap.color]}`} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{cap.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{cap.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Agent Skills */}
      <section className="py-20 px-6 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
              Built-in Skills
            </span>
            <h2 className="text-3xl md:text-4xl font-bold">Agent Skills</h2>
            <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
              Pre-configured agent profiles ready to handle common task categories out of the box.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "Web Researcher",
                desc: "Searches the web, scrapes pages, summarizes findings, and cross-references sources for accuracy.",
                tools: ["Web Search", "Page Scraper", "Summarizer"],
                color: "indigo",
              },
              {
                icon: Code,
                title: "Code Developer",
                desc: "Writes, reviews, debugs, and refactors code across multiple languages and frameworks.",
                tools: ["Code Executor", "File I/O", "Linter"],
                color: "emerald",
              },
              {
                icon: BarChart3,
                title: "Data Analyst",
                desc: "Analyzes datasets, generates visualizations, runs statistical tests, and identifies trends.",
                tools: ["Data Query", "Chart Builder", "Stats Engine"],
                color: "cyan",
              },
            ].map((skill, i) => {
              const borderColor: Record<string, string> = {
                indigo: "hover:border-indigo-500/40",
                emerald: "hover:border-emerald-500/40",
                cyan: "hover:border-cyan-500/40",
              };
              const iconBg: Record<string, string> = {
                indigo: "bg-indigo-600/10",
                emerald: "bg-emerald-600/10",
                cyan: "bg-cyan-600/10",
              };
              const iconColor: Record<string, string> = {
                indigo: "text-indigo-400",
                emerald: "text-emerald-400",
                cyan: "text-cyan-400",
              };
              const badgeBg: Record<string, string> = {
                indigo: "bg-indigo-600/10 text-indigo-400 border-indigo-500/20",
                emerald: "bg-emerald-600/10 text-emerald-400 border-emerald-500/20",
                cyan: "bg-cyan-600/10 text-cyan-400 border-cyan-500/20",
              };
              return (
                <div
                  key={i}
                  className={`card bg-slate-900/60 border border-slate-800/60 rounded-xl p-6 ${borderColor[skill.color]} transition-colors`}
                >
                  <div className={`w-14 h-14 rounded-xl ${iconBg[skill.color]} flex items-center justify-center mb-5`}>
                    <skill.icon className={`w-7 h-7 ${iconColor[skill.color]}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{skill.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">{skill.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {skill.tools.map((tool) => (
                      <span
                        key={tool}
                        className={`badge inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-medium ${badgeBg[skill.color]}`}
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="py-20 px-6 bg-slate-900/30 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
              Architecture
            </span>
            <h2 className="text-3xl md:text-4xl font-bold">Architecture Overview</h2>
            <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
              LangGraph-powered state machine with parallel agent execution and unified result synthesis.
            </p>
          </div>
          <div className="card bg-slate-900/80 border border-slate-800/60 rounded-xl p-8 md:p-10">
            <div className="space-y-6">
              {/* Row 1 */}
              <div className="flex items-center justify-center">
                <div className="px-6 py-3 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-semibold text-sm">
                  User Problem Statement
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-px h-8 bg-gradient-to-b from-indigo-500/40 to-slate-700/40" />
              </div>
              {/* Row 2 */}
              <div className="flex items-center justify-center">
                <div className="px-6 py-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 font-semibold text-sm flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-indigo-400" />
                  LangGraph Orchestrator
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-px h-8 bg-gradient-to-b from-slate-700/40 to-slate-700/40" />
              </div>
              {/* Row 3 - Task Decomposer */}
              <div className="flex items-center justify-center">
                <div className="px-6 py-3 rounded-lg bg-violet-600/15 border border-violet-500/25 text-violet-300 font-semibold text-sm flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Task Decomposer (LLM Planner)
                </div>
              </div>
              <div className="flex justify-center">
                <div className="flex items-end gap-16">
                  <div className="w-px h-8 bg-gradient-to-b from-violet-500/30 to-emerald-500/30" />
                  <div className="w-px h-8 bg-gradient-to-b from-violet-500/30 to-cyan-500/30" />
                  <div className="w-px h-8 bg-gradient-to-b from-violet-500/30 to-amber-500/30" />
                </div>
              </div>
              {/* Row 4 - Parallel Agents */}
              <div className="grid grid-cols-3 gap-4">
                <div className="px-4 py-3 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-center">
                  <div className="text-emerald-400 font-semibold text-sm">Web Researcher</div>
                  <div className="text-slate-500 text-xs mt-1">Search &bull; Scrape &bull; Cite</div>
                </div>
                <div className="px-4 py-3 rounded-lg bg-cyan-600/10 border border-cyan-500/20 text-center">
                  <div className="text-cyan-400 font-semibold text-sm">Code Developer</div>
                  <div className="text-slate-500 text-xs mt-1">Write &bull; Test &bull; Debug</div>
                </div>
                <div className="px-4 py-3 rounded-lg bg-amber-600/10 border border-amber-500/20 text-center">
                  <div className="text-amber-400 font-semibold text-sm">Data Analyst</div>
                  <div className="text-slate-500 text-xs mt-1">Query &bull; Analyze &bull; Visualize</div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="flex items-end gap-16">
                  <div className="w-px h-8 bg-gradient-to-b from-emerald-500/30 to-indigo-500/30" />
                  <div className="w-px h-8 bg-gradient-to-b from-cyan-500/30 to-indigo-500/30" />
                  <div className="w-px h-8 bg-gradient-to-b from-amber-500/30 to-indigo-500/30" />
                </div>
              </div>
              {/* Row 5 - Synthesizer */}
              <div className="flex items-center justify-center">
                <div className="px-6 py-3 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-semibold text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Result Synthesizer + Audit Log
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-20 px-6 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
              Platform Metrics
            </span>
            <h2 className="text-3xl md:text-4xl font-bold">Built for Scale</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "N+", label: "Concurrent Agents", icon: Users, color: "indigo" },
              { value: "5", label: "Built-in Tools", icon: Wrench, color: "emerald" },
              { value: "3", label: "Agent Skills", icon: Brain, color: "cyan" },
              { value: "100%", label: "Full Audit Trail", icon: Shield, color: "violet" },
            ].map((stat, i) => {
              const colorMap: Record<string, string> = {
                indigo: "from-indigo-600 to-indigo-400",
                emerald: "from-emerald-600 to-emerald-400",
                cyan: "from-cyan-600 to-cyan-400",
                violet: "from-violet-600 to-violet-400",
              };
              const iconColorMap: Record<string, string> = {
                indigo: "text-indigo-400",
                emerald: "text-emerald-400",
                cyan: "text-cyan-400",
                violet: "text-violet-400",
              };
              return (
                <div
                  key={i}
                  className="card bg-slate-900/60 border border-slate-800/60 rounded-xl p-6 text-center hover:border-indigo-500/30 transition-colors"
                >
                  <stat.icon className={`w-8 h-8 mx-auto mb-3 ${iconColorMap[stat.color]}`} />
                  <div className={`text-3xl md:text-4xl font-extrabold bg-gradient-to-r ${colorMap[stat.color]} bg-clip-text text-transparent mb-1`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-slate-800/50">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card bg-gradient-to-br from-indigo-600/20 via-slate-900/80 to-indigo-600/10 border border-indigo-500/20 rounded-2xl p-10 md:p-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Orchestrate?</h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Describe your problem. Let the agents handle the rest.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn-primary px-10 py-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-base font-semibold transition-colors inline-flex items-center gap-2"
            >
              Open Agent Control Center <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-300">Agent Control Center</span>
          </div>
          <p className="text-sm text-slate-500">
            Developed by{" "}
            <a
              href="https://my-solution-registry.satszone.link"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Sathish Siva Shankar
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

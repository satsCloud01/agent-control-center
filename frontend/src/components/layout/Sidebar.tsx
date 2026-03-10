import { NavLink } from 'react-router-dom'
import {
  Bot, LayoutDashboard, Workflow, Users, BookOpen,
  ScrollText, Settings, ChevronRight, Sparkles
} from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/studio',      icon: Workflow,         label: 'Workflow Studio' },
  { to: '/agents',      icon: Users,            label: 'Agent Viewer' },
  { to: '/skills',      icon: BookOpen,         label: 'Skill Manager' },
  { to: '/audit',       icon: ScrollText,       label: 'Audit Logs' },
  { to: '/settings',    icon: Settings,         label: 'Settings' },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-slate-950 border-r border-slate-800 flex flex-col z-40">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold leading-tight">Agent Control Center</div>
          <div className="text-xs text-slate-500 leading-tight">Multi-Agent Orchestration</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="text-xs font-medium text-slate-600 px-2 mb-2 uppercase tracking-widest">Platform</div>
        <ul className="space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-brand-900/60 text-brand-300 font-medium'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-600 px-1">
          <Sparkles className="w-3 h-3" />
          <span>Powered by LangGraph</span>
        </div>
        <NavLink
          to="/"
          className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-400 transition-colors px-1"
        >
          <ChevronRight className="w-3 h-3 rotate-180" />
          Back to Landing
        </NavLink>
      </div>
    </aside>
  )
}

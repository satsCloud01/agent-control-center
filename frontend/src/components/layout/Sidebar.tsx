import { useTheme } from '../../context/ThemeContext'
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
  const { theme, toggleTheme } = useTheme()

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
        <button onClick={toggleTheme} className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors w-full">
          {theme === 'dark' ? (<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>)}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
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

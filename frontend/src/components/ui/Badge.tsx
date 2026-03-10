import clsx from 'clsx'

const VARIANTS: Record<string, string> = {
  completed: 'bg-emerald-900/50 border border-emerald-700/50 text-emerald-300',
  running:   'bg-sky-900/50 border border-sky-700/50 text-sky-300',
  failed:    'bg-red-900/50 border border-red-700/50 text-red-300',
  idle:      'bg-slate-800 border border-slate-700 text-slate-400',
  waiting:   'bg-yellow-900/50 border border-yellow-700/50 text-yellow-300',
  pending:   'bg-slate-800 border border-slate-700 text-slate-400',
  assigned:  'bg-violet-900/50 border border-violet-700/50 text-violet-300',
  info:      'bg-sky-900/50 border border-sky-700/50 text-sky-300',
  error:     'bg-red-900/50 border border-red-700/50 text-red-300',
  warn:      'bg-yellow-900/50 border border-yellow-700/50 text-yellow-300',
  anthropic: 'bg-orange-900/50 border border-orange-700/50 text-orange-300',
  openai:    'bg-emerald-900/50 border border-emerald-700/50 text-emerald-300',
  research:  'bg-violet-900/50 border border-violet-700/50 text-violet-300',
  code:      'bg-sky-900/50 border border-sky-700/50 text-sky-300',
  analysis:  'bg-teal-900/50 border border-teal-700/50 text-teal-300',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: string
  className?: string
}

export function Badge({ children, variant, className }: BadgeProps) {
  const key = variant ?? (typeof children === 'string' ? children.toLowerCase() : '')
  return (
    <span className={clsx('badge', VARIANTS[key] ?? 'bg-slate-800 text-slate-400', className)}>
      {children}
    </span>
  )
}

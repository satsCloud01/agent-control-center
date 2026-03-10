import clsx from 'clsx'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: 'default' | 'red' | 'green' | 'yellow' | 'brand'
  icon?: React.ReactNode
}

const COLOR_MAP = {
  default: 'text-slate-100',
  red:     'text-red-400',
  green:   'text-emerald-400',
  yellow:  'text-yellow-400',
  brand:   'text-brand-400',
}

export function StatCard({ label, value, sub, color = 'default', icon }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        {icon && <span className="text-slate-600">{icon}</span>}
      </div>
      <p className={clsx('text-3xl font-bold mt-1', COLOR_MAP[color])}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

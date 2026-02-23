import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  icon?: ReactNode
  color?: string
}

export function StatCard({ label, value, unit, icon, color }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary uppercase tracking-wide">{label}</p>
        {icon && <span className="text-text-muted">{icon}</span>}
      </div>
      <p
        className="text-2xl font-bold text-text-primary"
        style={color ? { color } : undefined}
      >
        {value}
        {unit && <span className="text-sm font-normal text-text-secondary ml-1">{unit}</span>}
      </p>
    </div>
  )
}

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  subtitle: string
  ctaLabel?: string
  ctaAction?: () => void
}

export function EmptyState({ icon, title, subtitle, ctaLabel, ctaAction }: EmptyStateProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      {icon && <div className="text-muted-foreground text-4xl">{icon}</div>}
      <h2 className="text-text-primary text-xl font-semibold">{title}</h2>
      <p className="text-text-secondary max-w-md text-sm">{subtitle}</p>
      {ctaLabel && ctaAction && (
        <Button onClick={ctaAction} className="mt-2">
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}

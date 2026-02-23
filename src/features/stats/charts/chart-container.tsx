import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface ChartContainerProps {
  title: string
  description?: string
  isLoading?: boolean
  children: ReactNode
  height?: number
}

export function ChartContainer({
  title,
  description,
  isLoading = false,
  children,
  height = 250,
}: ChartContainerProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div>
        <h3 className="text-sm font-medium text-text-primary">{title}</h3>
        {description && (
          <p className="text-xs text-text-secondary mt-0.5">{description}</p>
        )}
      </div>
      {isLoading ? (
        <Skeleton style={{ height }} className="w-full rounded-lg" />
      ) : (
        <div style={{ height }}>{children}</div>
      )}
    </div>
  )
}

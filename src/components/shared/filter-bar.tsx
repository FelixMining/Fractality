import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface FilterBarProps {
  activeCount: number
  onReset: () => void
  children: React.ReactNode
}

export function FilterBar({ activeCount, onReset, children }: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="mb-3">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
          className="relative"
          aria-label="Filtres"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="ml-1">Filtres</span>
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[10px] text-white font-bold">
              {activeCount}
            </span>
          )}
        </Button>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
            Réinitialiser
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="mt-2 rounded-xl border border-border bg-card p-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

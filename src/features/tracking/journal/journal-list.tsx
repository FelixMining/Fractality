import { useLiveQuery } from 'dexie-react-hooks'
import { journalEntryRepository } from '@/lib/db/repositories/journal.repository'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { toLocalDateString } from '@/lib/utils'
import type { JournalEntry } from '@/schemas/journal-entry.schema'

export interface JournalFilters {
  projectId: string | null
  from: string
  to: string
}

export function applyJournalFilters(
  entries: JournalEntry[],
  filters: JournalFilters,
): JournalEntry[] {
  return entries.filter((e) => {
    if (filters.projectId && e.projectId !== filters.projectId) return false
    const dateOnly = e.entryDate.substring(0, 10)
    if (filters.from && dateOnly < filters.from) return false
    if (filters.to && dateOnly > filters.to) return false
    return true
  })
}

export function countJournalFilters(filters: JournalFilters): number {
  let count = 0
  if (filters.projectId) count++
  if (filters.from) count++
  if (filters.to) count++
  return count
}

export function hasJournalFilters(filters: JournalFilters): boolean {
  return countJournalFilters(filters) > 0
}

function formatJournalDate(entryDate: string): string {
  const today = toLocalDateString(new Date())
  const yesterday = toLocalDateString(new Date(Date.now() - 86400000))
  const dateOnly = entryDate.slice(0, 10)
  const timeOnly = entryDate.slice(11, 16) // "HH:mm"

  if (dateOnly === today) return `Aujourd'hui à ${timeOnly}`
  if (dateOnly === yesterday) return `Hier à ${timeOnly}`

  const [year, month, day] = dateOnly.split('-').map(Number)
  const dateStr = new Date(year, month - 1, day).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return `${dateStr} à ${timeOnly}`
}

interface JournalCardProps {
  entry: JournalEntry
  onClick: () => void
}

function JournalCard({ entry, onClick }: JournalCardProps) {
  const preview = entry.content.split('\n')[0].slice(0, 120)
  const visibleTags = (entry.tags ?? []).slice(0, 3)
  const extraTags = (entry.tags ?? []).length - visibleTags.length

  return (
    <li
      className="rounded-2xl bg-card border border-border p-4 cursor-pointer active:scale-[0.99] transition-transform hover:bg-card/80"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{formatJournalDate(entry.entryDate)}</span>
        <div className="flex items-center gap-2">
          {entry.mood !== undefined && (
            <span className="text-xs text-purple-400">😊 {entry.mood}</span>
          )}
          {entry.energy !== undefined && (
            <span className="text-xs text-green-400">⚡ {entry.energy}</span>
          )}
        </div>
      </div>
      <p className="text-sm text-foreground line-clamp-2">{preview}</p>
      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5"
            >
              {tag}
            </span>
          ))}
          {extraTags > 0 && (
            <span className="text-xs text-muted-foreground">+{extraTags}</span>
          )}
        </div>
      )}
    </li>
  )
}

interface JournalListProps {
  filters: JournalFilters
  onAdd: () => void
  onSelect: (entry: JournalEntry) => void
}

export function JournalList({ filters, onAdd, onSelect }: JournalListProps) {
  const entries = useLiveQuery(() => journalEntryRepository.getAllByDateDesc(), [])

  if (entries === undefined) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    )
  }

  const filtered = applyJournalFilters(entries, filters)

  if (filtered.length === 0 && !hasJournalFilters(filters)) {
    return (
      <EmptyState
        title="Votre journal est vide"
        subtitle="Commencez à écrire vos pensées du jour."
        ctaLabel="Écrire une entrée"
        ctaAction={onAdd}
      />
    )
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        title="Aucun résultat"
        subtitle="Aucune entrée ne correspond à vos filtres."
      />
    )
  }

  return (
    <div className="space-y-3">
      <Button onClick={onAdd} variant="outline" className="w-full">
        + Nouvelle entrée
      </Button>
      <ul className="space-y-2">
        {filtered.map((entry) => (
          <JournalCard key={entry.id} entry={entry} onClick={() => onSelect(entry)} />
        ))}
      </ul>
    </div>
  )
}

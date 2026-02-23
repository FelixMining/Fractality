import { useState } from 'react'
import { journalEntryRepository } from '@/lib/db/repositories/journal.repository'
import { useUndo } from '@/hooks/use-undo'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { toast } from 'sonner'
import { toLocalDateString } from '@/lib/utils'
import type { JournalEntry } from '@/schemas/journal-entry.schema'

function formatFullDate(entryDate: string): string {
  const today = toLocalDateString(new Date())
  const yesterday = toLocalDateString(new Date(Date.now() - 86400000))
  const dateOnly = entryDate.slice(0, 10)
  const timeOnly = entryDate.slice(11, 16)

  if (dateOnly === today) return `Aujourd'hui à ${timeOnly}`
  if (dateOnly === yesterday) return `Hier à ${timeOnly}`

  const [year, month, day] = dateOnly.split('-').map(Number)
  const dateStr = new Date(year, month - 1, day).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return `${dateStr} à ${timeOnly}`
}

interface JournalDetailProps {
  entry: JournalEntry
  onEdit: () => void
  onDeleted: () => void
}

export function JournalDetail({ entry, onEdit, onDeleted }: JournalDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { withUndo } = useUndo()

  const handleDelete = async () => {
    const snapshot = { ...entry }
    try {
      await withUndo(
        'Entrée journal supprimée',
        async () => {
          await journalEntryRepository.softDelete(snapshot.id)
        },
        async () => {
          await journalEntryRepository.restore(snapshot.id)
        },
      )
      toast.success('Entrée supprimée')
      onDeleted()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const hasProperties = entry.mood !== undefined || entry.motivation !== undefined || entry.energy !== undefined
  const tags = entry.tags ?? []

  return (
    <div className="space-y-4">
      {/* Date */}
      <p className="text-sm text-muted-foreground">{formatFullDate(entry.entryDate)}</p>

      {/* Contenu texte */}
      <div className="text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</div>

      {/* Propriétés chiffrées */}
      {hasProperties && (
        <div className="rounded-xl bg-card border border-border p-3 space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">État du moment</p>
          <div className="flex flex-wrap gap-4 text-sm">
            {entry.mood !== undefined && (
              <span className="flex items-center gap-1">
                <span className="text-purple-400">😊</span>
                <span>Humeur : <strong>{entry.mood}</strong>/10</span>
              </span>
            )}
            {entry.motivation !== undefined && (
              <span className="flex items-center gap-1">
                <span className="text-blue-400">🎯</span>
                <span>Motivation : <strong>{entry.motivation}</strong>/10</span>
              </span>
            )}
            {entry.energy !== undefined && (
              <span className="flex items-center gap-1">
                <span className="text-green-400">⚡</span>
                <span>Énergie : <strong>{entry.energy}</strong>/10</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-1"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-border">
        <Button variant="outline" className="flex-1" onClick={onEdit}>
          Modifier
        </Button>
        <Button
          variant="outline"
          className="text-destructive border-destructive/40 hover:bg-destructive/10"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Supprimer
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Supprimer cette entrée ?"
        description="L'entrée sera déplacée dans la corbeille. Vous pourrez annuler cette action."
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { eventTypeRepository } from '@/lib/db/repositories/event.repository'
import { useUndo } from '@/hooks/use-undo'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EventTypeForm } from './event-type-form'
import { toast } from 'sonner'
import type { EventType } from '@/schemas/tracking-event-type.schema'

/** Composant autonome qui gère la liste des types + le formulaire de création/édition.
 *
 * Note : ce composant est rendu à l'intérieur d'une Sheet (depuis EventsPage).
 * Le formulaire est rendu inline pour éviter des Sheets imbriqués (M1 fix). */
export function EventTypeManager() {
  const [showForm, setShowForm] = useState(false)
  const [selectedType, setSelectedType] = useState<EventType | null>(null)
  const [typeToDelete, setTypeToDelete] = useState<EventType | null>(null)

  const types = useLiveQuery(() => eventTypeRepository.getAllSorted(), [])
  const { withUndo } = useUndo()

  if (types === undefined) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    )
  }

  const handleAdd = () => {
    setSelectedType(null)
    setShowForm(true)
  }

  const handleEdit = (type: EventType) => {
    setSelectedType(type)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedType(null)
  }

  const handleDeleteConfirm = async () => {
    if (!typeToDelete) return
    const snapshot = { ...typeToDelete }
    try {
      await withUndo(
        `Type "${snapshot.name}" supprimé`,
        async () => {
          await eventTypeRepository.softDelete(snapshot.id)
        },
        async () => {
          await eventTypeRepository.restore(snapshot.id)
        },
      )
      toast.success(`Type "${snapshot.name}" supprimé`)
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setTypeToDelete(null)
    }
  }

  // Formulaire inline (pas de Sheet imbriquée) — affiché à la place de la liste
  if (showForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleFormClose} className="p-0 h-auto">
            ← Retour
          </Button>
          <h3 className="text-sm font-medium">
            {selectedType ? 'Modifier le type' : 'Créer un type'}
          </h3>
        </div>
        <EventTypeForm
          initialData={selectedType ?? undefined}
          onSuccess={handleFormClose}
          onCancel={handleFormClose}
        />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          {types.length} type{types.length !== 1 ? 's' : ''}
        </h2>
        <Button size="sm" onClick={handleAdd}>
          + Ajouter
        </Button>
      </div>

      {types.length === 0 ? (
        <EmptyState
          title="Aucun type défini"
          subtitle="Créez des types pour catégoriser vos événements."
          ctaLabel="Créer un type"
          ctaAction={handleAdd}
        />
      ) : (
        <ul className="space-y-2">
          {types.map((type) => (
            <li
              key={type.id}
              className="flex items-center gap-3 rounded-xl bg-card border border-border p-3"
            >
              {/* Icône + couleur */}
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-base"
                style={{ backgroundColor: type.color ? `${type.color}20` : undefined }}
              >
                {type.icon ? (
                  <span>{type.icon}</span>
                ) : (
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: type.color ?? '#6B7280' }}
                  />
                )}
              </div>

              {/* Nom */}
              <span className="flex-1 text-sm font-medium">{type.name}</span>

              {/* Actions */}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(type)}
                  aria-label={`Modifier ${type.name}`}
                >
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setTypeToDelete(type)}
                  aria-label={`Supprimer ${type.name}`}
                >
                  Supprimer
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ConfirmDialog suppression */}
      <ConfirmDialog
        open={Boolean(typeToDelete)}
        onOpenChange={(open) => { if (!open) setTypeToDelete(null) }}
        title="Supprimer ce type ?"
        description={`Le type "${typeToDelete?.name}" sera déplacé dans la corbeille.`}
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}

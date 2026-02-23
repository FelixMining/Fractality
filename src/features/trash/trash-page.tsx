import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { TrashList } from './trash-list'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import {
  getAllDeletedItems,
  getEntityRepository,
  type DeletedItemGroup,
} from '@/lib/db/registry'

export function TrashPage() {
  const [groups, setGroups] = useState<DeletedItemGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [emptyTrashOpen, setEmptyTrashOpen] = useState(false)

  const loadDeletedItems = async () => {
    try {
      const items = await getAllDeletedItems()
      setGroups(items)
    } catch (err) {
      console.error('Error loading deleted items:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeletedItems()
  }, [])

  const handleRestore = async (key: string, id: string) => {
    const repo = getEntityRepository(key)
    if (!repo) return

    try {
      await repo.restore(id)
      toast.success('Élément restauré')
      await loadDeletedItems()
    } catch (err) {
      console.error('Error restoring item:', err)
      toast.error('Erreur lors de la restauration')
    }
  }

  const handleHardDelete = async (key: string, id: string) => {
    const repo = getEntityRepository(key)
    if (!repo) return

    try {
      await repo.hardDelete(id)
      toast.success('Élément supprimé définitivement')
      await loadDeletedItems()
    } catch (err) {
      console.error('Error hard deleting item:', err)
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleEmptyTrash = async () => {
    let errorCount = 0
    for (const group of groups) {
      const repo = getEntityRepository(group.key)
      if (!repo) continue
      for (const item of group.items) {
        try {
          await repo.hardDelete(item.id)
        } catch (err) {
          console.error(`Error deleting ${item.id}:`, err)
          errorCount++
        }
      }
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} élément(s) n'ont pas pu être supprimés`)
    } else {
      toast.success('Corbeille vidée')
    }
    await loadDeletedItems()
  }

  const totalItems = groups.reduce((acc, g) => acc + g.items.length, 0)
  const isEmpty = totalItems === 0

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-border bg-background px-4 py-3">
          <h1 className="text-xl font-semibold">Corbeille</h1>
        </header>
        <main className="flex-1 px-4 py-6">
          <div className="animate-pulse space-y-3">
            <div className="h-12 rounded-lg bg-muted" />
            <div className="h-12 rounded-lg bg-muted" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Corbeille</h1>
          {!isEmpty && (
            <button
              onClick={() => setEmptyTrashOpen(true)}
              className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10"
            >
              Vider la corbeille
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        {isEmpty ? (
          <EmptyState
            icon={<Trash2 className="h-12 w-12 text-muted-foreground/30" />}
            title="La corbeille est vide"
            subtitle="Les éléments supprimés apparaîtront ici."
          />
        ) : (
          <TrashList
            groups={groups}
            onRestore={handleRestore}
            onHardDelete={handleHardDelete}
          />
        )}
      </main>

      <ConfirmDialog
        open={emptyTrashOpen}
        onOpenChange={setEmptyTrashOpen}
        title="Vider la corbeille ?"
        description={`${totalItems} élément${totalItems > 1 ? 's' : ''} sera${totalItems > 1 ? 'ont' : ''} supprimé${totalItems > 1 ? 's' : ''} définitivement.`}
        confirmLabel="Vider la corbeille"
        variant="destructive"
        doubleConfirm
        doubleConfirmMessage="Tous les éléments seront supprimés de manière irréversible. Êtes-vous sûr ?"
        onConfirm={handleEmptyTrash}
      />
    </div>
  )
}

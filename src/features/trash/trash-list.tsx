import { useState } from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import type { BaseEntity } from '@/schemas/base.schema'
import type { DeletedItemGroup } from '@/lib/db/registry'

interface TrashListProps {
  groups: DeletedItemGroup[]
  onRestore: (key: string, id: string) => Promise<void>
  onHardDelete: (key: string, id: string) => Promise<void>
}

function getItemDisplayName(item: BaseEntity & Record<string, unknown>): string {
  if (typeof item.name === 'string') return item.name
  if (typeof item.title === 'string') return item.title
  return item.id.slice(0, 8)
}

export function TrashList({ groups, onRestore, onHardDelete }: TrashListProps) {
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    key: string
    id: string
    name: string
  }>({ open: false, key: '', id: '', name: '' })

  const handleHardDeleteClick = (key: string, id: string, name: string) => {
    setConfirmState({ open: true, key, id, name })
  }

  const handleConfirmHardDelete = async () => {
    await onHardDelete(confirmState.key, confirmState.id)
  }

  return (
    <>
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.key}>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {group.label}s
            </h3>
            <div className="space-y-2">
              {group.items.map((item) => {
                const displayName = getItemDisplayName(item)
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{displayName}</span>
                        <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {group.label}
                        </span>
                      </div>
                      {item.deletedAt && (
                        <span className="text-xs text-muted-foreground">
                          Supprimé {formatRelativeTime(item.deletedAt)}
                        </span>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => onRestore(group.key, item.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restaurer
                      </button>
                      <button
                        onClick={() => handleHardDeleteClick(group.key, item.id, displayName)}
                        className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((s) => ({ ...s, open }))}
        title={`Supprimer définitivement "${confirmState.name}" ?`}
        description="Cet élément sera supprimé de manière permanente. Il ne pourra pas être récupéré."
        confirmLabel="Supprimer définitivement"
        variant="destructive"
        doubleConfirm
        doubleConfirmMessage="Cette action est irréversible. Êtes-vous sûr de vouloir supprimer définitivement cet élément ?"
        onConfirm={handleConfirmHardDelete}
      />
    </>
  )
}

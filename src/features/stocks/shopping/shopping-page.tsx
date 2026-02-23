import { useState } from 'react'
import { ShoppingList } from './shopping-list'
import { ShoppingForm } from './shopping-form'
import { ShoppingDetail } from './shopping-detail'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

type ViewMode = 'list' | 'detail'

export function ShoppingPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const handleSelectGroup = (dateKey: string) => {
    setSelectedDateKey(dateKey)
    setViewMode('detail')
  }

  const handleBack = () => {
    setViewMode('list')
    setSelectedDateKey(null)
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">
            Enregistrez vos courses pour mettre à jour votre stock
          </p>
        </div>
        {viewMode === 'list' && (
          <Button onClick={() => setFormOpen(true)} size="lg" className="gap-2">
            <Plus className="size-5" />
            Nouvelle course
          </Button>
        )}
      </div>

      {/* Content */}
      {viewMode === 'list' && (
        <ShoppingList
          onSelectGroup={handleSelectGroup}
          onAdd={() => setFormOpen(true)}
        />
      )}

      {viewMode === 'detail' && selectedDateKey && (
        <ShoppingDetail
          dateKey={selectedDateKey}
          onBack={handleBack}
        />
      )}

      {/* Form Sheet */}
      <Sheet open={formOpen} onOpenChange={(open) => !open && setFormOpen(false)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nouvelle course</SheetTitle>
            <SheetDescription>
              Sélectionnez les produits achetés et leurs quantités. Le stock sera mis à jour automatiquement.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ShoppingForm
              onSuccess={handleFormSuccess}
              onCancel={() => setFormOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  doubleConfirm?: boolean
  doubleConfirmMessage?: string
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'default',
  doubleConfirm = false,
  doubleConfirmMessage = 'Cette action est irréversible. Êtes-vous sûr ?',
  onConfirm,
}: ConfirmDialogProps) {
  const [showSecondConfirm, setShowSecondConfirm] = useState(false)

  const handleFirstConfirm = async () => {
    if (doubleConfirm) {
      setShowSecondConfirm(true)
    } else {
      await onConfirm()
      onOpenChange(false)
    }
  }

  const handleSecondConfirm = async () => {
    setShowSecondConfirm(false)
    await onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    setShowSecondConfirm(false)
    onOpenChange(false)
  }

  // Deuxième dialog de confirmation
  if (showSecondConfirm) {
    return (
      <AlertDialog open={true} onOpenChange={handleCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation finale</AlertDialogTitle>
            <AlertDialogDescription>{doubleConfirmMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction
              variant={variant}
              onClick={handleSecondConfirm}
            >
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  // Premier dialog
  return (
    <AlertDialog open={open} onOpenChange={handleCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={variant}
            onClick={handleFirstConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

import { Plus } from 'lucide-react'

interface FabButtonProps {
  onClick: () => void
}

export function FabButton({ onClick }: FabButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-16 left-1/2 z-50 flex h-[52px] w-[52px] -translate-x-1/2 items-center justify-center rounded-2xl shadow-lg transition-transform active:scale-95 lg:hidden"
      style={{ background: 'var(--gradient-accent)' }}
      aria-label="Créer une nouvelle entrée"
    >
      <Plus size={26} className="text-white" />
    </button>
  )
}

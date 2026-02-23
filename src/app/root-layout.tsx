import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'

interface RootLayoutProps {
  children: ReactNode
}

export function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      {children}
      <Toaster position="bottom-center" />
    </div>
  )
}

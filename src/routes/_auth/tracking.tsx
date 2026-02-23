import { createFileRoute, Outlet } from '@tanstack/react-router'
import { PillarTabs } from '@/components/shared/pillar-tabs'
import { pillars } from '@/lib/navigation'

export const Route = createFileRoute('/_auth/tracking')({
  component: TrackingLayout,
})

function TrackingLayout() {
  const pillar = pillars.find((p) => p.id === 'tracking')!

  return (
    <div className="flex flex-col gap-4">
      <PillarTabs tabs={pillar.subTypes} color={pillar.color} />
      <Outlet />
    </div>
  )
}

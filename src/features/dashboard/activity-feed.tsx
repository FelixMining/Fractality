import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from '@tanstack/react-router'
import {
  Timer,
  Dumbbell,
  Activity,
  CalendarDays,
  BookOpen,
  CheckSquare,
  History,
  type LucideIcon,
} from 'lucide-react'
import { db } from '@/lib/db/database'
import { ActivityFeedItem } from '@/components/shared/activity-feed-item'
import { SectionTitle } from '@/features/dashboard/today-summary'
import { formatDuration } from '@/lib/utils'

const FEED_LIMIT = 10

type FeedItemType = 'work' | 'workout' | 'cardio' | 'event' | 'journal' | 'recurring'

interface FeedItem {
  id: string
  type: FeedItemType
  title: string
  metadata: string
  createdAt: string
}

const ICON_CONFIG: Record<FeedItemType, { Icon: LucideIcon; color: string }> = {
  work: { Icon: Timer, color: 'text-blue-400' },
  workout: { Icon: Dumbbell, color: 'text-blue-400' },
  cardio: { Icon: Activity, color: 'text-blue-400' },
  event: { Icon: CalendarDays, color: 'text-purple-400' },
  journal: { Icon: BookOpen, color: 'text-purple-400' },
  recurring: { Icon: CheckSquare, color: 'text-purple-400' },
}

const NAVIGATE_TO: Record<FeedItemType, string> = {
  work: '/sessions/work',
  workout: '/sessions/workout',
  cardio: '/sessions/cardio',
  event: '/tracking/events',
  journal: '/tracking/journal',
  recurring: '/tracking/recurring',
}

function formatFeedTime(isoString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString))
}

export function ActivityFeed() {
  const navigate = useNavigate()

  const feedItems = useLiveQuery(async (): Promise<FeedItem[]> => {
    const [
      workSessions,
      workoutSessions,
      cardioSessions,
      events,
      journalEntries,
      responses,
      recurrings,
    ] = await Promise.all([
      db.work_sessions
        .orderBy('createdAt')
        .reverse()
        .filter((s) => !s.isDeleted)
        .limit(FEED_LIMIT)
        .toArray(),
      db.workout_sessions
        .orderBy('createdAt')
        .reverse()
        .filter((s) => !s.isDeleted)
        .limit(FEED_LIMIT)
        .toArray(),
      db.cardio_sessions
        .orderBy('createdAt')
        .reverse()
        .filter((s) => !s.isDeleted)
        .limit(FEED_LIMIT)
        .toArray(),
      db.tracking_events
        .orderBy('createdAt')
        .reverse()
        .filter((e) => !e.isDeleted)
        .limit(FEED_LIMIT)
        .toArray(),
      db.journal_entries
        .orderBy('createdAt')
        .reverse()
        .filter((e) => !e.isDeleted)
        .limit(FEED_LIMIT)
        .toArray(),
      db.tracking_responses
        .orderBy('createdAt')
        .reverse()
        .filter((r) => !r.isDeleted)
        .limit(FEED_LIMIT)
        .toArray(),
      db.tracking_recurrings.filter((r) => !r.isDeleted).toArray(),
    ])

    const recurringMap = new Map(recurrings.map((r) => [r.id, r]))

    const items: FeedItem[] = [
      ...workSessions.map((s) => ({
        id: s.id,
        type: 'work' as const,
        title: s.title,
        metadata: formatDuration(s.duration, false),
        createdAt: s.createdAt,
      })),
      ...workoutSessions.map((s) => ({
        id: s.id,
        type: 'workout' as const,
        title: s.title ?? 'Séance musculation',
        metadata: s.totalDuration ? formatDuration(s.totalDuration, false) : '',
        createdAt: s.createdAt,
      })),
      ...cardioSessions.map((s) => ({
        id: s.id,
        type: 'cardio' as const,
        title: s.title,
        metadata: s.distance
          ? `${(s.distance / 1000).toFixed(1)} km`
          : formatDuration(s.duration, false),
        createdAt: s.createdAt,
      })),
      ...events.map((e) => ({
        id: e.id,
        type: 'event' as const,
        title: e.title,
        metadata: e.location ?? '',
        createdAt: e.createdAt,
      })),
      ...journalEntries.map((e) => ({
        id: e.id,
        type: 'journal' as const,
        title: e.content.slice(0, 60) + (e.content.length > 60 ? '…' : ''),
        metadata: e.tags?.slice(0, 2).join(', ') ?? '',
        createdAt: e.createdAt,
      })),
      ...responses.map((r) => ({
        id: r.id,
        type: 'recurring' as const,
        title: recurringMap.get(r.recurringId)?.name ?? 'Suivi',
        metadata:
          r.valueBoolean !== undefined
            ? r.valueBoolean
              ? 'Oui'
              : 'Non'
            : r.valueNumber !== undefined
              ? String(r.valueNumber)
              : r.valueChoice ?? r.note ?? '',
        createdAt: r.createdAt,
      })),
    ]

    return items
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, FEED_LIMIT)
  }, [])

  if (feedItems === undefined) {
    return (
      <section aria-label="Activité récente">
        <SectionTitle icon={<History size={17} />} label="Activité récente" />
        <ul className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <li key={i} className="h-14 animate-pulse rounded-xl bg-card" />
          ))}
        </ul>
      </section>
    )
  }

  if (feedItems.length === 0) {
    return null
  }

  return (
    <section aria-label="Activité récente">
      <SectionTitle icon={<History size={17} />} label="Activité récente" />
      <ul className="flex flex-col gap-2">
        {feedItems.map((item) => {
          const { Icon, color } = ICON_CONFIG[item.type]
          return (
            <ActivityFeedItem
              key={`${item.type}-${item.id}`}
              icon={Icon}
              iconColor={color}
              title={item.title}
              metadata={item.metadata || undefined}
              time={formatFeedTime(item.createdAt)}
              onClick={() => navigate({ to: NAVIGATE_TO[item.type] as never })}
            />
          )
        })}
      </ul>
    </section>
  )
}

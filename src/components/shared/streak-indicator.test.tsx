import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StreakIndicator } from './streak-indicator'

const TODAY = '2026-02-23'

function makeDays(activityPattern: boolean[]): Array<{ date: string; hasActivity: boolean }> {
  return activityPattern.map((hasActivity, i) => {
    const d = new Date(TODAY + 'T12:00:00')
    d.setDate(d.getDate() - (activityPattern.length - 1 - i))
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return { date: `${y}-${m}-${day}`, hasActivity }
  })
}

describe('StreakIndicator', () => {
  it('affiche le chiffre du streak', () => {
    const days = makeDays([true, true, false, true, true, true, true])
    render(<StreakIndicator days={days} streakCount={4} today={TODAY} />)
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('affiche "jour" au singulier pour un streak de 1', () => {
    const days = makeDays([false, false, false, false, false, false, true])
    render(<StreakIndicator days={days} streakCount={1} today={TODAY} />)
    expect(screen.getByText(/1/)).toBeInTheDocument()
    expect(screen.getByText(/jour consécutif$/)).toBeInTheDocument()
  })

  it('affiche "jours consécutifs" au pluriel pour un streak > 1', () => {
    const days = makeDays([false, false, false, false, true, true, true])
    render(<StreakIndicator days={days} streakCount={3} today={TODAY} />)
    expect(screen.getByText('jours consécutifs')).toBeInTheDocument()
  })

  it('affiche 7 segments', () => {
    const days = makeDays([true, false, true, false, true, false, true])
    const { container } = render(<StreakIndicator days={days} streakCount={1} today={TODAY} />)
    // Chaque segment est un div.h-4.w-4
    const segments = container.querySelectorAll('.h-4.w-4')
    expect(segments).toHaveLength(7)
  })

  it('le segment aujourd\'hui sans activité a la classe animate-pulse', () => {
    // today est le dernier jour, sans activité
    const days = makeDays([true, true, true, true, true, true, false])
    const { container } = render(<StreakIndicator days={days} streakCount={6} today={TODAY} />)
    const pulsing = container.querySelectorAll('.animate-pulse')
    expect(pulsing).toHaveLength(1)
  })

  it('le segment aujourd\'hui avec activité n\'a pas animate-pulse', () => {
    const days = makeDays([false, false, false, false, false, false, true])
    const { container } = render(<StreakIndicator days={days} streakCount={1} today={TODAY} />)
    const pulsing = container.querySelectorAll('.animate-pulse')
    expect(pulsing).toHaveLength(0)
  })

  it('un jour passé sans activité n\'a pas animate-pulse', () => {
    // J-1 sans activité, today avec activité
    const days = makeDays([false, false, false, false, false, false, true])
    const { container } = render(<StreakIndicator days={days} streakCount={1} today={TODAY} />)
    const pulsing = container.querySelectorAll('.animate-pulse')
    expect(pulsing).toHaveLength(0)
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilterBar } from './filter-bar'

describe('FilterBar', () => {
  it('affiche le bouton Filtres', () => {
    render(
      <FilterBar activeCount={0} onReset={vi.fn()}>
        <div>Contenu filtre</div>
      </FilterBar>,
    )
    expect(screen.getByRole('button', { name: /filtres/i })).toBeInTheDocument()
  })

  it("n'affiche pas le badge quand activeCount === 0", () => {
    render(
      <FilterBar activeCount={0} onReset={vi.fn()}>
        <div />
      </FilterBar>,
    )
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('affiche le badge avec le compte quand activeCount > 0', () => {
    render(
      <FilterBar activeCount={2} onReset={vi.fn()}>
        <div />
      </FilterBar>,
    )
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it("n'affiche pas le bouton Réinitialiser quand activeCount === 0", () => {
    render(
      <FilterBar activeCount={0} onReset={vi.fn()}>
        <div />
      </FilterBar>,
    )
    expect(screen.queryByText(/réinitialiser/i)).not.toBeInTheDocument()
  })

  it('affiche le bouton Réinitialiser quand activeCount > 0', () => {
    render(
      <FilterBar activeCount={1} onReset={vi.fn()}>
        <div />
      </FilterBar>,
    )
    expect(screen.getByText(/réinitialiser/i)).toBeInTheDocument()
  })

  it('appelle onReset au clic sur Réinitialiser', () => {
    const onReset = vi.fn()
    render(
      <FilterBar activeCount={1} onReset={onReset}>
        <div />
      </FilterBar>,
    )
    fireEvent.click(screen.getByText(/réinitialiser/i))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('toggle le panneau de filtres au clic sur Filtres', () => {
    render(
      <FilterBar activeCount={0} onReset={vi.fn()}>
        <div>Panneau visible</div>
      </FilterBar>,
    )

    // Initialement masqué
    expect(screen.queryByText('Panneau visible')).not.toBeInTheDocument()

    // Clic pour ouvrir
    fireEvent.click(screen.getByRole('button', { name: /filtres/i }))
    expect(screen.getByText('Panneau visible')).toBeInTheDocument()

    // Clic pour fermer
    fireEvent.click(screen.getByRole('button', { name: /filtres/i }))
    expect(screen.queryByText('Panneau visible')).not.toBeInTheDocument()
  })
})

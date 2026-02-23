# Tests pour work-session.schema.ts

**Note:** Tests créés en Code Review mais déplacés en .md car Vitest n'est pas encore configuré dans le projet.

## Tests à implémenter (quand Vitest sera configuré)

```typescript
import { describe, it, expect } from 'vitest'
import { workSessionSchema } from './work-session.schema'

describe('workSessionSchema', () => {
  it('valide une session de travail correcte', () => {
    const validSession = {
      id: 'test-id',
      userId: 'user-123',
      title: 'Session de développement',
      description: 'Travail sur la feature X',
      duration: 3600,
      productivity: 8,
      concentration: 7,
      date: new Date().toISOString(),
      tags: ['dev', 'feature-x'],
      projectId: 'project-1',
      location: null,
      images: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
      deletedAt: null,
    }

    const result = workSessionSchema.safeParse(validSession)
    expect(result.success).toBe(true)
  })

  it('rejette une durée zéro', () => {
    const invalidSession = {
      id: 'test-id',
      userId: 'user-123',
      title: 'Session invalide',
      duration: 0,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
      deletedAt: null,
    }

    const result = workSessionSchema.safeParse(invalidSession)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('positif')
    }
  })

  it('rejette une durée négative')
  it('rejette un titre vide')
  it('accepte productivity et concentration optionnels')
  it('rejette productivity hors limite (< 1)')
  it('rejette productivity hors limite (> 10)')
}
```

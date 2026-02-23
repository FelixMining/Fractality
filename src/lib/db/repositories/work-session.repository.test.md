# Tests pour work-session.repository.ts

**Note:** Tests créés en Code Review mais déplacés en .md car Vitest n'est pas encore configuré dans le projet.

## Tests à implémenter (quand Vitest sera configuré)

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { workSessionRepository } from './work-session.repository'
import { db } from '@/lib/db/database'

describe('WorkSessionRepository', () => {
  beforeEach(async () => {
    await db.work_sessions.clear()
  })

  describe('getByDateRange', () => {
    it('retourne les sessions dans la plage de dates')
    it('ne retourne pas les sessions supprimées')
  })

  describe('getTodaySessions', () => {
    it('retourne uniquement les sessions du jour')
  })

  describe('getByProject', () => {
    it('retourne les sessions d\'un projet spécifique')
    it('trie les résultats par date décroissante')
  })
})
```

## Tests manuels à effectuer

1. **getByDateRange():**
   - Créer 3 sessions (hier, aujourd'hui, demain)
   - Appeler getByDateRange(aujourd'hui, demain)
   - Vérifier que seule la session d'aujourd'hui est retournée

2. **getTodaySessions():**
   - Créer 2 sessions (une aujourd'hui, une hier)
   - Appeler getTodaySessions()
   - Vérifier qu'une seule session est retournée

3. **getByProject():**
   - Créer 2 sessions avec projectId différents
   - Appeler getByProject('project-1')
   - Vérifier que seules les sessions du projet 1 sont retournées
   - Vérifier le tri décroissant par date

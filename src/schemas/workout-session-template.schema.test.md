# Tests Manuels - WorkoutSessionTemplate Schema

**Note:** Framework de tests automatisés (vitest/jest) non configuré dans le projet.
Ces tests doivent être exécutés manuellement via console ou ajoutés au framework quand installé.

## Test 1 : Validation programId requis UUID
```typescript
import { WorkoutSessionTemplateSchema } from './workout-session-template.schema'

// DEVRAIT ÉCHOUER - programId invalide (pas UUID)
WorkoutSessionTemplateSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  programId: 'not-a-uuid',
  name: 'Jour 1 - Push',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: ZodError "ID programme invalide"
```

## Test 2 : Validation programId requis
```typescript
// DEVRAIT ÉCHOUER - programId absent
WorkoutSessionTemplateSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  name: 'Jour 1 - Push',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: ZodError "Required"
```

## Test 3 : Validation nom requis
```typescript
// DEVRAIT ÉCHOUER - nom vide
WorkoutSessionTemplateSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  programId: crypto.randomUUID(),
  name: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: ZodError "Le nom est requis"
```

## Test 4 : Validation nom maximum 100 caractères
```typescript
// DEVRAIT ÉCHOUER - nom trop long
WorkoutSessionTemplateSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  programId: crypto.randomUUID(),
  name: 'a'.repeat(101),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: ZodError "Maximum 100 caractères"
```

## Test 5 : Schema valide complet
```typescript
// DEVRAIT RÉUSSIR
const template = WorkoutSessionTemplateSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  programId: crypto.randomUUID(),
  name: 'Jour 1 - Push',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})

console.assert(template.id, 'id manquant')
console.assert(template.programId, 'programId manquant')
console.assert(template.name === 'Jour 1 - Push', 'name incorrect')
console.assert(template.isDeleted === false, 'isDeleted devrait être false')
// Expected: All assertions pass
```

## Test 6 : TypeScript type inference
```typescript
import type { WorkoutSessionTemplate } from './workout-session-template.schema'

// DEVRAIT compiler sans erreur TypeScript
const template: WorkoutSessionTemplate = {
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  programId: crypto.randomUUID(),
  name: 'Test',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
}
// Expected: TypeScript compile success
```

# Tests Manuels - WorkoutProgram Schema

**Note:** Framework de tests automatisés (vitest/jest) non configuré dans le projet.
Ces tests doivent être exécutés manuellement via console ou ajoutés au framework quand installé.

## Test 1 : Validation nom requis
```typescript
import { WorkoutProgramSchema } from './workout-program.schema'

// DEVRAIT ÉCHOUER - nom vide
WorkoutProgramSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  name: '',
  description: 'Test description',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: ZodError "Le nom est requis"
```

## Test 2 : Validation nom maximum 100 caractères
```typescript
// DEVRAIT ÉCHOUER - nom trop long
WorkoutProgramSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  name: 'a'.repeat(101),
  description: 'Test',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: ZodError "Maximum 100 caractères"
```

## Test 3 : Description optionnelle
```typescript
// DEVRAIT RÉUSSIR - description absente
WorkoutProgramSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  name: 'Push Pull Legs',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: Success
```

## Test 4 : Description maximum 1000 caractères
```typescript
// DEVRAIT ÉCHOUER - description trop longue
WorkoutProgramSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  name: 'Test',
  description: 'a'.repeat(1001),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: ZodError "Maximum 1000 caractères"
```

## Test 5 : Extension BaseEntity + CommonProperties
```typescript
// DEVRAIT avoir tous les champs hérités
const program = WorkoutProgramSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  name: 'Programme Full Body',
  description: '3 séances par semaine',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})

console.assert(program.id, 'id manquant')
console.assert(program.userId, 'userId manquant')
console.assert(program.name === 'Programme Full Body', 'name incorrect')
console.assert(program.createdAt, 'createdAt manquant')
console.assert(program.isDeleted === false, 'isDeleted devrait être false')
// Expected: All assertions pass
```

## Test 6 : TypeScript type inference
```typescript
import type { WorkoutProgram } from './workout-program.schema'

// DEVRAIT compiler sans erreur TypeScript
const program: WorkoutProgram = {
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  name: 'Test',
  description: 'Description',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
}
// Expected: TypeScript compile success
```

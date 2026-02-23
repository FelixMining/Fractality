# Tests Manuels - WorkoutTemplateExercise Schema

**Note:** Framework de tests automatisés (vitest/jest) non configuré dans le projet.
Ces tests doivent être exécutés manuellement via console ou ajoutés au framework quand installé.

## Test 1 : Validation sessionTemplateId requis UUID
```typescript
import { WorkoutTemplateExerciseSchema } from './workout-template-exercise.schema'

// DEVRAIT ÉCHOUER - sessionTemplateId invalide
WorkoutTemplateExerciseSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: 'not-a-uuid',
  exerciseId: crypto.randomUUID(),
  order: 0,
  defaultSets: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: ZodError "ID séance-type invalide"
```

## Test 2 : Validation exerciseId requis UUID
```typescript
// DEVRAIT ÉCHOUER - exerciseId invalide
WorkoutTemplateExerciseSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: crypto.randomUUID(),
  exerciseId: 'not-a-uuid',
  order: 0,
  defaultSets: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: ZodError "ID exercice invalide"
```

## Test 3 : Validation order >= 0
```typescript
// DEVRAIT ÉCHOUER - order négatif
WorkoutTemplateExerciseSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: crypto.randomUUID(),
  exerciseId: crypto.randomUUID(),
  order: -1,
  defaultSets: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: ZodError "L'ordre doit être >= 0"
```

## Test 4 : Validation defaultSets requis 1-10
```typescript
// DEVRAIT ÉCHOUER - defaultSets = 0
WorkoutTemplateExerciseSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: crypto.randomUUID(),
  exerciseId: crypto.randomUUID(),
  order: 0,
  defaultSets: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: ZodError "Minimum 1 série"
```

## Test 5 : Validation defaultSets maximum 10
```typescript
// DEVRAIT ÉCHOUER - defaultSets > 10
WorkoutTemplateExerciseSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: crypto.randomUUID(),
  exerciseId: crypto.randomUUID(),
  order: 0,
  defaultSets: 11,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: ZodError "Maximum 10 séries"
```

## Test 6 : defaultReps optionnel
```typescript
// DEVRAIT RÉUSSIR - defaultReps absent
WorkoutTemplateExerciseSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: crypto.randomUUID(),
  exerciseId: crypto.randomUUID(),
  order: 0,
  defaultSets: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: Success
```

## Test 7 : Validation defaultReps 1-100
```typescript
// DEVRAIT ÉCHOUER - defaultReps = 0
WorkoutTemplateExerciseSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: crypto.randomUUID(),
  exerciseId: crypto.randomUUID(),
  order: 0,
  defaultSets: 3,
  defaultReps: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: ZodError "Minimum 1 répétition"
```

## Test 8 : Validation defaultReps maximum 100
```typescript
// DEVRAIT ÉCHOUER - defaultReps > 100
WorkoutTemplateExerciseSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: crypto.randomUUID(),
  exerciseId: crypto.randomUUID(),
  order: 0,
  defaultSets: 3,
  defaultReps: 101,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: ZodError "Maximum 100 reps"
```

## Test 9 : defaultWeight optionnel
```typescript
// DEVRAIT RÉUSSIR - defaultWeight absent
WorkoutTemplateExerciseSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: crypto.randomUUID(),
  exerciseId: crypto.randomUUID(),
  order: 0,
  defaultSets: 3,
  defaultReps: 12,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: Success
```

## Test 10 : Validation defaultWeight >= 0
```typescript
// DEVRAIT ÉCHOUER - defaultWeight négatif
WorkoutTemplateExerciseSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: crypto.randomUUID(),
  exerciseId: crypto.randomUUID(),
  order: 0,
  defaultSets: 3,
  defaultWeight: -10,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: ZodError "Le poids ne peut être négatif"
```

## Test 11 : Validation defaultWeight maximum 500
```typescript
// DEVRAIT ÉCHOUER - defaultWeight > 500
WorkoutTemplateExerciseSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: crypto.randomUUID(),
  exerciseId: crypto.randomUUID(),
  order: 0,
  defaultSets: 3,
  defaultWeight: 501,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: ZodError "Maximum 500kg"
```

## Test 12 : Schema valide complet avec tous les champs
```typescript
// DEVRAIT RÉUSSIR
const templateExercise = WorkoutTemplateExerciseSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: crypto.randomUUID(),
  exerciseId: crypto.randomUUID(),
  order: 2,
  defaultSets: 4,
  defaultReps: 8,
  defaultWeight: 80.5,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})

console.assert(templateExercise.order === 2, 'order incorrect')
console.assert(templateExercise.defaultSets === 4, 'defaultSets incorrect')
console.assert(templateExercise.defaultReps === 8, 'defaultReps incorrect')
console.assert(templateExercise.defaultWeight === 80.5, 'defaultWeight incorrect')
// Expected: All assertions pass
```

## Test 13 : TypeScript type inference
```typescript
import type { WorkoutTemplateExercise } from './workout-template-exercise.schema'

// DEVRAIT compiler sans erreur TypeScript
const templateExercise: WorkoutTemplateExercise = {
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: crypto.randomUUID(),
  exerciseId: crypto.randomUUID(),
  order: 0,
  defaultSets: 3,
  defaultReps: 12,
  defaultWeight: 20,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
}
// Expected: TypeScript compile success
```

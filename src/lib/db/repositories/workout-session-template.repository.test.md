# Tests Manuels - WorkoutSessionTemplateRepository

**Note:** Framework de tests automatisés (vitest/jest) non configuré dans le projet.
Ces tests doivent être exécutés manuellement via console ou ajoutés au framework quand installé.

## Setup
```typescript
import { workoutSessionTemplateRepository } from './workout-session-template.repository'
import { workoutExerciseRepository } from './workout-exercise.repository'
import { db } from '../database'

// Helper pour nettoyer la DB entre les tests
async function cleanup() {
  await db.workout_template_exercises.clear()
  await db.workout_session_templates.clear()
  await db.workout_exercises.clear()
}
```

## Test 1 : getTemplateExercises() - retourne exercices avec détails
```typescript
await cleanup()

// Créer une séance-type
const template = await workoutSessionTemplateRepository.create({
  programId: crypto.randomUUID(),
  name: 'Test Session',
})

// Créer 2 exercices dans la bibliothèque
const exercise1 = await workoutExerciseRepository.create({
  name: 'Bench Press',
  muscleGroup: 'chest',
})

const exercise2 = await workoutExerciseRepository.create({
  name: 'Squat',
  muscleGroup: 'legs',
})

// Ajouter les exercices à la séance-type
await db.workout_template_exercises.add({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: template.id,
  exerciseId: exercise1.id,
  order: 0,
  defaultSets: 3,
  defaultReps: 10,
  defaultWeight: 60,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})

await db.workout_template_exercises.add({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: template.id,
  exerciseId: exercise2.id,
  order: 1,
  defaultSets: 4,
  defaultReps: 8,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})

// Récupérer les exercices avec leurs détails
const result = await workoutSessionTemplateRepository.getTemplateExercises(template.id)

console.assert(result.length === 2, 'Should return 2 exercises')
console.assert(result[0].exercise.name === 'Bench Press', 'First exercise is Bench Press')
console.assert(result[0].templateExercise.order === 0, 'First has order 0')
console.assert(result[0].templateExercise.defaultSets === 3, 'First has 3 sets')
console.assert(result[1].exercise.name === 'Squat', 'Second exercise is Squat')
console.assert(result[1].templateExercise.order === 1, 'Second has order 1')
// Expected: Returns exercises with both templateExercise and exercise details
```

## Test 2 : getTemplateExercises() - tri par order
```typescript
await cleanup()

const template = await workoutSessionTemplateRepository.create({
  programId: crypto.randomUUID(),
  name: 'Test',
})

const exercise = await workoutExerciseRepository.create({
  name: 'Test Exercise',
  muscleGroup: 'chest',
})

// Ajouter 3 exercices dans un ordre non-séquentiel
await db.workout_template_exercises.add({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: template.id,
  exerciseId: exercise.id,
  order: 2,
  defaultSets: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})

await db.workout_template_exercises.add({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: template.id,
  exerciseId: exercise.id,
  order: 0,
  defaultSets: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})

await db.workout_template_exercises.add({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: template.id,
  exerciseId: exercise.id,
  order: 1,
  defaultSets: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})

const result = await workoutSessionTemplateRepository.getTemplateExercises(template.id)

console.assert(result[0].templateExercise.order === 0, 'First has order 0')
console.assert(result[1].templateExercise.order === 1, 'Second has order 1')
console.assert(result[2].templateExercise.order === 2, 'Third has order 2')
// Expected: Results sorted by order field
```

## Test 3 : getTemplateExercises() - ignore soft-deleted
```typescript
await cleanup()

const template = await workoutSessionTemplateRepository.create({
  programId: crypto.randomUUID(),
  name: 'Test',
})

const exercise = await workoutExerciseRepository.create({
  name: 'Test',
  muscleGroup: 'chest',
})

// Exercice actif
await db.workout_template_exercises.add({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: template.id,
  exerciseId: exercise.id,
  order: 0,
  defaultSets: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})

// Exercice soft-deleted
await db.workout_template_exercises.add({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  sessionTemplateId: template.id,
  exerciseId: exercise.id,
  order: 1,
  defaultSets: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: true,
  deletedAt: new Date().toISOString(),
})

const result = await workoutSessionTemplateRepository.getTemplateExercises(template.id)

console.assert(result.length === 1, 'Should return only non-deleted exercise')
// Expected: Ignores soft-deleted template exercises
```

## Test 4 : getTemplateExercises() - pas de requête N+1
```typescript
await cleanup()

const template = await workoutSessionTemplateRepository.create({
  programId: crypto.randomUUID(),
  name: 'Test',
})

// Créer 10 exercices
const exerciseIds = []
for (let i = 0; i < 10; i++) {
  const exercise = await workoutExerciseRepository.create({
    name: `Exercise ${i}`,
    muscleGroup: 'chest',
  })
  exerciseIds.push(exercise.id)
}

// Ajouter les 10 exercices à la séance
for (let i = 0; i < 10; i++) {
  await db.workout_template_exercises.add({
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    sessionTemplateId: template.id,
    exerciseId: exerciseIds[i],
    order: i,
    defaultSets: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
    deletedAt: null,
  })
}

// Appeler getTemplateExercises
// Vérifier manuellement dans les logs/profiler qu'il utilise bulkGet
// et non pas 10 requêtes séparées
const result = await workoutSessionTemplateRepository.getTemplateExercises(template.id)

console.assert(result.length === 10, 'Should return 10 exercises')
// Expected: Uses bulkGet to avoid N+1 queries
```

## Test 5 : addExercise() - calcul automatique de l'order
```typescript
await cleanup()

const template = await workoutSessionTemplateRepository.create({
  programId: crypto.randomUUID(),
  name: 'Test',
})

const exercise1 = await workoutExerciseRepository.create({
  name: 'Exercise 1',
  muscleGroup: 'chest',
})

const exercise2 = await workoutExerciseRepository.create({
  name: 'Exercise 2',
  muscleGroup: 'back',
})

const exercise3 = await workoutExerciseRepository.create({
  name: 'Exercise 3',
  muscleGroup: 'legs',
})

// Ajouter 3 exercices sans spécifier l'order (auto-calculé)
await workoutSessionTemplateRepository.addExercise(template.id, exercise1.id, {
  defaultSets: 3,
  defaultReps: 10,
})

await workoutSessionTemplateRepository.addExercise(template.id, exercise2.id, {
  defaultSets: 4,
  defaultReps: 8,
})

await workoutSessionTemplateRepository.addExercise(template.id, exercise3.id, {
  defaultSets: 5,
})

// Vérifier que les orders sont 0, 1, 2
const result = await workoutSessionTemplateRepository.getTemplateExercises(template.id)

console.assert(result[0].templateExercise.order === 0, 'First order is 0')
console.assert(result[1].templateExercise.order === 1, 'Second order is 1')
console.assert(result[2].templateExercise.order === 2, 'Third order is 2')
// Expected: Order auto-calculated as 0, 1, 2
```

## Test 6 : addExercise() - params optionnels
```typescript
await cleanup()

const template = await workoutSessionTemplateRepository.create({
  programId: crypto.randomUUID(),
  name: 'Test',
})

const exercise = await workoutExerciseRepository.create({
  name: 'Bodyweight Exercise',
  muscleGroup: 'core',
})

// Ajouter exercice sans reps ni weight
await workoutSessionTemplateRepository.addExercise(template.id, exercise.id, {
  defaultSets: 3,
})

const result = await workoutSessionTemplateRepository.getTemplateExercises(template.id)

console.assert(result[0].templateExercise.defaultSets === 3, 'Sets is 3')
console.assert(result[0].templateExercise.defaultReps === undefined, 'Reps is undefined')
console.assert(result[0].templateExercise.defaultWeight === undefined, 'Weight is undefined')
// Expected: Reps and weight can be omitted
```

## Test 7 : removeExercise() - soft delete
```typescript
await cleanup()

const template = await workoutSessionTemplateRepository.create({
  programId: crypto.randomUUID(),
  name: 'Test',
})

const exercise = await workoutExerciseRepository.create({
  name: 'Test',
  muscleGroup: 'chest',
})

await workoutSessionTemplateRepository.addExercise(template.id, exercise.id, {
  defaultSets: 3,
})

// Récupérer le template_exercise
const before = await workoutSessionTemplateRepository.getTemplateExercises(template.id)
const templateExerciseId = before[0].templateExercise.id

// Soft delete
await workoutSessionTemplateRepository.removeExercise(templateExerciseId)

// Vérifier qu'il n'apparaît plus dans getTemplateExercises
const after = await workoutSessionTemplateRepository.getTemplateExercises(template.id)
console.assert(after.length === 0, 'Should not return soft-deleted exercise')

// Vérifier qu'il existe toujours en DB avec isDeleted=true
const deleted = await db.workout_template_exercises.get(templateExerciseId)
console.assert(deleted?.isDeleted === true, 'Should be soft-deleted')
console.assert(deleted?.deletedAt !== null, 'Should have deletedAt timestamp')
// Expected: Soft deletes the template exercise
```

## Test 8 : removeExercise() - ne recalcule pas les orders
```typescript
await cleanup()

const template = await workoutSessionTemplateRepository.create({
  programId: crypto.randomUUID(),
  name: 'Test',
})

const exercise = await workoutExerciseRepository.create({
  name: 'Test',
  muscleGroup: 'chest',
})

// Ajouter 3 exercices (order 0, 1, 2)
await workoutSessionTemplateRepository.addExercise(template.id, exercise.id, { defaultSets: 3 })
await workoutSessionTemplateRepository.addExercise(template.id, exercise.id, { defaultSets: 3 })
await workoutSessionTemplateRepository.addExercise(template.id, exercise.id, { defaultSets: 3 })

const before = await workoutSessionTemplateRepository.getTemplateExercises(template.id)

// Supprimer le deuxième (order = 1)
await workoutSessionTemplateRepository.removeExercise(before[1].templateExercise.id)

const after = await workoutSessionTemplateRepository.getTemplateExercises(template.id)

console.assert(after.length === 2, 'Should have 2 exercises left')
console.assert(after[0].templateExercise.order === 0, 'First still has order 0')
console.assert(after[1].templateExercise.order === 2, 'Third still has order 2 (not recalculated)')
// Expected: Orders not recalculated - keeps gaps
```

## Test 9 : Héritage de BaseRepository
```typescript
await cleanup()

// Vérifier que les méthodes héritées fonctionnent
const template = await workoutSessionTemplateRepository.create({
  programId: crypto.randomUUID(),
  name: 'Test Template',
})

// getById
const found = await workoutSessionTemplateRepository.getById(template.id)
console.assert(found?.name === 'Test Template', 'getById works')

// update
await workoutSessionTemplateRepository.update(template.id, { name: 'Updated' })
const updated = await workoutSessionTemplateRepository.getById(template.id)
console.assert(updated?.name === 'Updated', 'update works')

// softDelete
await workoutSessionTemplateRepository.softDelete(template.id)
const deleted = await db.workout_session_templates.get(template.id)
console.assert(deleted?.isDeleted === true, 'softDelete works')

// restore
await workoutSessionTemplateRepository.restore(template.id)
const restored = await db.workout_session_templates.get(template.id)
console.assert(restored?.isDeleted === false, 'restore works')
// Expected: All BaseRepository methods work correctly
```

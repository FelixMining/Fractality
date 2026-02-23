# Tests Manuels - WorkoutProgramRepository

**Note:** Framework de tests automatisés (vitest/jest) non configuré dans le projet.
Ces tests doivent être exécutés manuellement via console ou ajoutés au framework quand installé.

## Setup
```typescript
import { workoutProgramRepository } from './workout-program.repository'
import { db } from '../database'

// Helper pour nettoyer la DB entre les tests
async function cleanup() {
  await db.workout_template_exercises.clear()
  await db.workout_session_templates.clear()
  await db.workout_programs.clear()
}
```

## Test 1 : getAllSorted() - tri alphabétique par nom
```typescript
await cleanup()

// Créer 3 programmes dans un ordre non-alphabétique
await workoutProgramRepository.create({
  name: 'Zebra Program',
  description: 'Test',
})

await workoutProgramRepository.create({
  name: 'Alpha Program',
  description: 'Test',
})

await workoutProgramRepository.create({
  name: 'Beta Program',
  description: 'Test',
})

// Récupérer la liste triée
const programs = await workoutProgramRepository.getAllSorted()

console.assert(programs.length === 3, 'Should have 3 programs')
console.assert(programs[0].name === 'Alpha Program', 'First should be Alpha')
console.assert(programs[1].name === 'Beta Program', 'Second should be Beta')
console.assert(programs[2].name === 'Zebra Program', 'Third should be Zebra')
// Expected: All assertions pass - programs sorted alphabetically
```

## Test 2 : getAllSorted() - tri avec locale français
```typescript
await cleanup()

await workoutProgramRepository.create({ name: 'Été' })
await workoutProgramRepository.create({ name: 'Automne' })
await workoutProgramRepository.create({ name: 'Été 2' })

const programs = await workoutProgramRepository.getAllSorted()

// Vérifier que le tri utilise localeCompare avec 'fr'
console.assert(programs[0].name === 'Automne', 'Automne first')
console.assert(programs[1].name === 'Été', 'Été second')
console.assert(programs[2].name === 'Été 2', 'Été 2 third')
// Expected: Correct French alphabetical order
```

## Test 3 : getSessionTemplates() - retourne séances d'un programme
```typescript
await cleanup()

// Créer un programme
const program = await workoutProgramRepository.create({
  name: 'Test Program',
  description: 'Test',
})

// Créer 2 séances-types pour ce programme
await db.workout_session_templates.add({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  programId: program.id,
  name: 'Session 1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})

await db.workout_session_templates.add({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  programId: program.id,
  name: 'Session 2',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})

// Récupérer les séances du programme
const templates = await workoutProgramRepository.getSessionTemplates(program.id)

console.assert(templates.length === 2, 'Should have 2 templates')
console.assert(templates[0].programId === program.id, 'Template belongs to program')
console.assert(templates[1].programId === program.id, 'Template belongs to program')
// Expected: Returns 2 session templates for the program
```

## Test 4 : getSessionTemplates() - ignore les séances soft-deleted
```typescript
await cleanup()

const program = await workoutProgramRepository.create({ name: 'Test' })

// Créer une séance active
await db.workout_session_templates.add({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  programId: program.id,
  name: 'Active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})

// Créer une séance soft-deleted
await db.workout_session_templates.add({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  programId: program.id,
  name: 'Deleted',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: true,
  deletedAt: new Date().toISOString(),
})

const templates = await workoutProgramRepository.getSessionTemplates(program.id)

console.assert(templates.length === 1, 'Should return only active template')
console.assert(templates[0].name === 'Active', 'Should be the active template')
// Expected: Only returns non-deleted templates
```

## Test 5 : deleteProgram() - cascade delete sur séances-types
```typescript
await cleanup()

// Créer un programme avec 2 séances-types
const program = await workoutProgramRepository.create({ name: 'Test' })

const template1 = await db.workout_session_templates.add({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  programId: program.id,
  name: 'Session 1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})

const template2 = await db.workout_session_templates.add({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  programId: program.id,
  name: 'Session 2',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})

// Supprimer le programme (cascade delete)
await workoutProgramRepository.deleteProgram(program.id)

// Vérifier que le programme est soft-deleted
const programAfter = await db.workout_programs.get(program.id)
console.assert(programAfter?.isDeleted === true, 'Program should be soft-deleted')

// Vérifier que les séances sont soft-deleted
const template1After = await db.workout_session_templates.get(template1)
console.assert(template1After?.isDeleted === true, 'Template 1 should be soft-deleted')

const template2After = await db.workout_session_templates.get(template2)
console.assert(template2After?.isDeleted === true, 'Template 2 should be soft-deleted')
// Expected: Program and all session templates are soft-deleted
```

## Test 6 : deleteProgram() - cascade delete sur exercices de séances
```typescript
await cleanup()

// Créer programme + séance + exercice
const program = await workoutProgramRepository.create({ name: 'Test' })

const templateId = crypto.randomUUID()
await db.workout_session_templates.add({
  id: templateId,
  userId: crypto.randomUUID(),
  programId: program.id,
  name: 'Session 1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})

const exerciseId = crypto.randomUUID()
await db.workout_template_exercises.add({
  id: exerciseId,
  userId: crypto.randomUUID(),
  sessionTemplateId: templateId,
  exerciseId: crypto.randomUUID(),
  order: 0,
  defaultSets: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})

// Supprimer le programme (cascade delete)
await workoutProgramRepository.deleteProgram(program.id)

// Vérifier que l'exercice est soft-deleted
const exerciseAfter = await db.workout_template_exercises.get(exerciseId)
console.assert(exerciseAfter?.isDeleted === true, 'Template exercise should be soft-deleted')
// Expected: Cascade deletes all the way to template exercises
```

## Test 7 : deleteProgram() - atomicité transaction
```typescript
await cleanup()

// Test que la transaction est atomique (tout ou rien)
const program = await workoutProgramRepository.create({ name: 'Test' })

// Simuler une erreur pendant la transaction (ce test est conceptuel)
// En production, vérifier que soit TOUT est deleted, soit RIEN ne l'est
// Si une erreur se produit pendant la transaction, aucun soft delete ne devrait persister
// Expected: Transaction is atomic (all-or-nothing)
```

## Test 8 : Héritage de BaseRepository
```typescript
await cleanup()

// Vérifier que les méthodes héritées de BaseRepository fonctionnent
const program = await workoutProgramRepository.create({
  name: 'Test Program',
  description: 'Test description',
})

// getById
const found = await workoutProgramRepository.getById(program.id)
console.assert(found?.name === 'Test Program', 'getById works')

// update
await workoutProgramRepository.update(program.id, { name: 'Updated' })
const updated = await workoutProgramRepository.getById(program.id)
console.assert(updated?.name === 'Updated', 'update works')

// softDelete
await workoutProgramRepository.softDelete(program.id)
const deleted = await db.workout_programs.get(program.id)
console.assert(deleted?.isDeleted === true, 'softDelete works')

// restore
await workoutProgramRepository.restore(program.id)
const restored = await db.workout_programs.get(program.id)
console.assert(restored?.isDeleted === false, 'restore works')
// Expected: All BaseRepository methods work correctly
```

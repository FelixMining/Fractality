# Tests Manuels - Workout Exercise Repository

**Note:** Framework de tests automatisés (vitest/jest) non configuré pour les repositories IndexedDB.
Ces tests doivent être exécutés manuellement via console navigateur ou ajoutés au framework quand installé.

## Setup
```typescript
import { workoutExerciseRepository } from './workout-exercise.repository'
// Assurez-vous d'être authentifié dans l'app
```

## Test 1 : Create exercise avec userId auto-injecté
```typescript
const exercise = await workoutExerciseRepository.create({
  name: 'Développé couché',
  muscleGroup: 'chest',
  description: 'Exercice de base pour les pectoraux',
})

console.assert(exercise.id, 'id devrait être généré')
console.assert(exercise.userId, 'userId devrait être auto-injecté')
console.assert(exercise.name === 'Développé couché', 'name incorrect')
console.assert(exercise.muscleGroup === 'chest', 'muscleGroup incorrect')
console.assert(exercise.description === 'Exercice de base pour les pectoraux', 'description incorrecte')
console.assert(!exercise.isDeleted, 'isDeleted devrait être false')
// Expected: Success, userId auto-récupéré depuis auth
```

## Test 2 : Create exercise sans description (optionnel)
```typescript
const exercise = await workoutExerciseRepository.create({
  name: 'Squat',
  muscleGroup: 'legs',
})

console.assert(exercise.id, 'id devrait être généré')
console.assert(exercise.name === 'Squat', 'name incorrect')
console.assert(exercise.muscleGroup === 'legs', 'muscleGroup incorrect')
console.assert(!exercise.description, 'description devrait être undefined')
// Expected: Success, description optionnelle
```

## Test 3 : getByMuscleGroup filtre correctement
```typescript
// Créer plusieurs exercices avec différents groupes musculaires
await workoutExerciseRepository.create({
  name: 'Développé couché',
  muscleGroup: 'chest',
})

await workoutExerciseRepository.create({
  name: 'Pec fly',
  muscleGroup: 'chest',
})

await workoutExerciseRepository.create({
  name: 'Squat',
  muscleGroup: 'legs',
})

// Tester le filtre
const chestExercises = await workoutExerciseRepository.getByMuscleGroup('chest')
console.assert(chestExercises.length >= 2, 'devrait avoir au moins 2 exercices chest')
chestExercises.forEach((ex) => {
  console.assert(ex.muscleGroup === 'chest', 'tous devraient être du groupe chest')
  console.assert(!ex.isDeleted, 'ne devrait pas inclure exercices supprimés')
})
// Expected: Seulement exercices du groupe 'chest'
```

## Test 4 : searchByName recherche case-insensitive
```typescript
// Créer des exercices avec différents noms
await workoutExerciseRepository.create({
  name: 'Développé Couché',
  muscleGroup: 'chest',
})

await workoutExerciseRepository.create({
  name: 'Développé Militaire',
  muscleGroup: 'shoulders',
})

await workoutExerciseRepository.create({
  name: 'Squat',
  muscleGroup: 'legs',
})

// Tester la recherche case-insensitive
const results = await workoutExerciseRepository.searchByName('développé')
console.assert(results.length >= 2, 'devrait trouver au moins 2 exercices avec "développé"')
results.forEach((ex) => {
  console.assert(
    ex.name.toLowerCase().includes('développé'),
    'tous devraient contenir "développé" dans le nom'
  )
})

// Tester avec différentes casses
const resultsUpper = await workoutExerciseRepository.searchByName('DÉVELOPPÉ')
console.assert(resultsUpper.length >= 2, 'devrait fonctionner avec majuscules')
// Expected: Recherche case-insensitive fonctionnelle
```

## Test 5 : getAllSorted trie par muscleGroup puis name
```typescript
// Créer exercices dans un ordre aléatoire
await workoutExerciseRepository.create({
  name: 'Squat',
  muscleGroup: 'legs',
})

await workoutExerciseRepository.create({
  name: 'Développé couché',
  muscleGroup: 'chest',
})

await workoutExerciseRepository.create({
  name: 'Curl biceps',
  muscleGroup: 'arms',
})

await workoutExerciseRepository.create({
  name: 'Pec fly',
  muscleGroup: 'chest',
})

const sorted = await workoutExerciseRepository.getAllSorted()
console.assert(Array.isArray(sorted), 'devrait retourner un array')

// Vérifier le tri par muscleGroup
for (let i = 0; i < sorted.length - 1; i++) {
  const current = sorted[i]
  const next = sorted[i + 1]

  if (current.muscleGroup === next.muscleGroup) {
    // Si même groupe, vérifier tri par nom
    console.assert(
      current.name.localeCompare(next.name) <= 0,
      `${current.name} devrait être avant ${next.name}`
    )
  } else {
    // Vérifier tri par groupe
    console.assert(
      current.muscleGroup.localeCompare(next.muscleGroup) < 0,
      `${current.muscleGroup} devrait être avant ${next.muscleGroup}`
    )
  }
}
// Expected: Array trié par muscleGroup puis name
```

## Test 6 : Soft delete fonctionne
```typescript
const exercise = await workoutExerciseRepository.create({
  name: 'To Delete',
  muscleGroup: 'chest',
})

await workoutExerciseRepository.softDelete(exercise.id)

const deleted = await workoutExerciseRepository.getById(exercise.id)
console.assert(!deleted, 'exercice soft-deleted ne devrait pas être retourné par getById')

const allIncludingDeleted = await workoutExerciseRepository.getAll(true)
const found = allIncludingDeleted.find((ex) => ex.id === exercise.id)
console.assert(found?.isDeleted === true, 'exercice devrait avoir isDeleted=true')

// Vérifier qu'il n'apparaît pas dans getByMuscleGroup
const chestExercises = await workoutExerciseRepository.getByMuscleGroup('chest')
const foundInMuscleGroup = chestExercises.find((ex) => ex.id === exercise.id)
console.assert(!foundInMuscleGroup, 'exercice supprimé ne devrait pas apparaître dans getByMuscleGroup')

// Vérifier qu'il n'apparaît pas dans searchByName
const searchResults = await workoutExerciseRepository.searchByName('To Delete')
const foundInSearch = searchResults.find((ex) => ex.id === exercise.id)
console.assert(!foundInSearch, 'exercice supprimé ne devrait pas apparaître dans searchByName')
// Expected: Exercice marqué isDeleted=true, invisible partout
```

## Test 7 : Restore fonctionne
```typescript
const exercise = await workoutExerciseRepository.create({
  name: 'To Restore',
  muscleGroup: 'back',
})

await workoutExerciseRepository.softDelete(exercise.id)
console.assert(!await workoutExerciseRepository.getById(exercise.id), 'devrait être invisible après suppression')

await workoutExerciseRepository.restore(exercise.id)
const restored = await workoutExerciseRepository.getById(exercise.id)
console.assert(restored?.id === exercise.id, 'devrait être visible après restore')
console.assert(!restored?.isDeleted, 'isDeleted devrait être false après restore')
console.assert(restored?.deletedAt === null, 'deletedAt devrait être null après restore')
// Expected: Exercice restauré et visible
```

## Test 8 : Update fonctionne
```typescript
const exercise = await workoutExerciseRepository.create({
  name: 'Original Name',
  muscleGroup: 'chest',
  description: 'Original description',
})

const updated = await workoutExerciseRepository.update(exercise.id, {
  name: 'Updated Name',
  description: 'Updated description',
})

console.assert(updated.name === 'Updated Name', 'name devrait être mis à jour')
console.assert(updated.description === 'Updated description', 'description devrait être mise à jour')
console.assert(updated.muscleGroup === 'chest', 'muscleGroup devrait rester inchangé')
console.assert(updated.updatedAt > exercise.updatedAt, 'updatedAt devrait être mis à jour')
// Expected: Champs mis à jour correctement
```

## Test 9 : Validation Zod empêche données invalides
```typescript
// Test avec nom vide (devrait échouer)
try {
  await workoutExerciseRepository.create({
    name: '',
    muscleGroup: 'chest',
  })
  console.error('ERREUR: nom vide aurait dû être rejeté!')
} catch (error) {
  console.assert(
    error.message.includes('Le nom est requis') || error.toString().includes('too_small'),
    'Message d\'erreur devrait mentionner le nom requis'
  )
}

// Test avec muscleGroup invalide (devrait échouer)
try {
  await workoutExerciseRepository.create({
    name: 'Test',
    muscleGroup: 'invalid' as any,
  })
  console.error('ERREUR: muscleGroup invalide aurait dû être rejeté!')
} catch (error) {
  console.assert(
    error.message.includes('Invalid enum value') || error.toString().includes('invalid_enum_value'),
    'Message d\'erreur devrait mentionner enum invalide'
  )
}
// Expected: Validation Zod fonctionne
```

## Test 10 : Enregistrement dans syncRegistry
```typescript
import { syncRegistry } from '@/lib/sync/sync-registry'

const isRegistered = syncRegistry.isRegistered('workout_exercises')
console.assert(isRegistered, 'table workout_exercises devrait être enregistrée dans syncRegistry')
// Expected: true
```

## Test 11 : Enregistrement dans entityRegistry pour corbeille
```typescript
import { getEntityRepository } from '@/lib/db/registry'

const repo = getEntityRepository('workout_exercises')
console.assert(repo !== undefined, 'workout_exercises devrait être dans entityRegistry')
console.assert(repo === workoutExerciseRepository, 'devrait retourner la même instance')
// Expected: Repository accessible via registry
```

# Tests Manuels - Project Repository

**Note:** Framework de tests automatisés (vitest/jest) non configuré dans le projet.
Ces tests doivent être exécutés manuellement via console navigateur ou ajoutés au framework quand installé.

## Setup
```typescript
import { projectRepository } from './project.repository'
// Assurez-vous d'être authentifié dans l'app
```

## Test 1 : Create project avec userId auto-injecté
```typescript
const project = await projectRepository.create({
  name: 'Test Project',
  color: '#FF6B6B',
  parentId: null,
})

console.assert(project.id, 'id devrait être généré')
console.assert(project.userId, 'userId devrait être auto-injecté')
console.assert(project.name === 'Test Project', 'name incorrect')
console.assert(project.color === '#FF6B6B', 'color incorrect')
console.assert(project.parentId === null, 'parentId devrait être null')
console.assert(!project.isDeleted, 'isDeleted devrait être false')
// Expected: Success, userId auto-récupéré depuis auth
```

## Test 2 : Validation référence circulaire bloquée
```typescript
// Créer projet A
const projectA = await projectRepository.create({
  name: 'Project A',
  color: '#FF0000',
  parentId: null,
})

// Créer projet B enfant de A
const projectB = await projectRepository.create({
  name: 'Project B',
  color: '#00FF00',
  parentId: projectA.id,
})

// DEVRAIT ÉCHOUER - Essayer de faire A enfant de B (boucle)
try {
  await projectRepository.update(projectA.id, { parentId: projectB.id })
  console.error('ERREUR: La boucle aurait dû être détectée!')
} catch (error) {
  console.assert(
    error.message.includes('circulaire'),
    'Message d\'erreur devrait mentionner "circulaire"'
  )
}
// Expected: Error "Référence circulaire détectée"
```

## Test 3 : getTree retourne tous projets non-supprimés
```typescript
const allProjects = await projectRepository.getTree()
console.assert(Array.isArray(allProjects), 'devrait retourner un array')
allProjects.forEach((p) => {
  console.assert(!p.isDeleted, 'ne devrait pas inclure projets supprimés')
})
// Expected: Array de projets, tous avec isDeleted=false
```

## Test 4 : getChildren retourne enfants directs
```typescript
// Créer parent
const parent = await projectRepository.create({
  name: 'Parent',
  color: '#FF0000',
  parentId: null,
})

// Créer 2 enfants
const child1 = await projectRepository.create({
  name: 'Child 1',
  color: '#00FF00',
  parentId: parent.id,
})

const child2 = await projectRepository.create({
  name: 'Child 2',
  color: '#0000FF',
  parentId: parent.id,
})

// Tester getChildren
const children = await projectRepository.getChildren(parent.id)
console.assert(children.length === 2, 'devrait avoir 2 enfants')
console.assert(
  children.every((c) => c.parentId === parent.id),
  'tous les enfants devraient avoir le bon parentId'
)
// Expected: 2 enfants retournés
```

## Test 5 : getRoots retourne seulement racines
```typescript
const roots = await projectRepository.getRoots()
console.assert(Array.isArray(roots), 'devrait retourner un array')
roots.forEach((r) => {
  console.assert(r.parentId === null, 'racine devrait avoir parentId null')
})
// Expected: Seulement projets avec parentId=null
```

## Test 6 : Soft delete fonctionne
```typescript
const project = await projectRepository.create({
  name: 'To Delete',
  color: '#FF0000',
  parentId: null,
})

await projectRepository.softDelete(project.id)

const deleted = await projectRepository.getById(project.id)
console.assert(!deleted, 'projet soft-deleted ne devrait pas être retourné par getById')

const allIncludingDeleted = await projectRepository.getAll(true)
const found = allIncludingDeleted.find((p) => p.id === project.id)
console.assert(found?.isDeleted === true, 'projet devrait avoir isDeleted=true')
// Expected: Projet marqué isDeleted=true, invisible via getById
```

## Test 7 : Enregistrement dans syncRegistry
```typescript
import { syncRegistry } from '@/lib/sync/sync-registry'

const isRegistered = syncRegistry.isRegistered('projects')
console.assert(isRegistered, 'table projects devrait être enregistrée dans syncRegistry')
// Expected: true
```

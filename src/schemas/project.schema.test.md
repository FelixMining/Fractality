# Tests Manuels - Project Schema

**Note:** Framework de tests automatisés (vitest/jest) non configuré dans le projet.
Ces tests doivent être exécutés manuellement via console ou ajoutés au framework quand installé.

## Test 1 : Validation nom requis
```typescript
import { projectSchema } from './project.schema'

// DEVRAIT ÉCHOUER - nom vide
projectSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  name: '',
  color: '#FF0000',
  parentId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: ZodError "Le nom est requis"
```

## Test 2 : Validation couleur format hex
```typescript
// DEVRAIT ÉCHOUER - format couleur invalide
projectSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  name: 'Test',
  color: 'rouge', // invalide
  parentId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: ZodError "Format couleur invalide (#RRGGBB)"
```

## Test 3 : Validation parentId UUID ou null
```typescript
// DEVRAIT RÉUSSIR
projectSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  name: 'Test',
  color: '#FF0000',
  parentId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})
// Expected: Success
```

## Test 4 : Extension baseEntitySchema
```typescript
// DEVRAIT avoir tous les champs de BaseEntity
const project = projectSchema.parse({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  name: 'Test',
  color: '#FF0000',
  parentId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
  deletedAt: null,
})

console.assert(project.id, 'id manquant')
console.assert(project.userId, 'userId manquant')
console.assert(project.createdAt, 'createdAt manquant')
console.assert(project.isDeleted === false, 'isDeleted devrait être false')
// Expected: All assertions pass
```

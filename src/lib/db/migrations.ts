/**
 * Database migrations for Fractality.
 *
 * Version 1 (Story 1.4):
 * - syncQueue: FIFO queue for pending sync operations
 * - mediaBlobs: Local blob storage for images/media
 *
 * Version 2 (Story 1.6):
 * - projects: Hierarchical project organization with colors
 *
 * Version 3 (Story 2.1):
 * - work_sessions: Work sessions with timer and custom properties
 *
 * Version 4 (Story 3.1):
 * - workout_exercises: Exercise library for workout programs
 *
 * Version 5 (Story 3.2):
 * - workout_programs: Workout program templates
 * - workout_session_templates: Session templates within programs
 * - workout_template_exercises: Many-to-many junction table for exercises in templates
 *
 * Version 6 (Story 3.3):
 * - workout_sessions: Live workout sessions with real-time tracking
 * - workout_series: Individual series within workout sessions
 *
 * Version 7 (Story 3.4):
 * - pain_notes: Pain notes for exercises during workout sessions
 *
 * Version 8 (Story 4.1):
 * - cardio_sessions: Cardio sessions with optional GPX import
 *
 * Version 9 (Story 5.1):
 * - stock_products: Products with type, current stock, base price and optional image
 *
 * Version 10 (Story 5.2):
 * - stock_purchases: Achats avec produit, quantité, prix et date de course
 *
 * Version 11 (Story 5.3):
 * - stock_routines: Routines de consommation liées aux produits (récurrence, quantité, estimation jours restants)
 *
 * Version 12 (Story 6.1):
 * - tracking_recurrings: Définitions de suivis récurrents
 * - tracking_responses: Réponses aux suivis par date
 *
 * Version 13 (Story 6.2):
 * - tracking_event_types: Types d'événements définis par l'utilisateur (nom, icône, couleur)
 * - tracking_events: Événements créés (titre, type, date, priorité, description, localisation)
 *
 * Version 14 (Story 6.3):
 * - journal_entries: Entrées de journal avec texte, propriétés chiffrées et tags libres
 *
 * Future stories will add entity stores by bumping the version
 * and adding new .stores() entries.
 *
 * Migration strategy:
 * - Each new version adds new stores or modifies indexes
 * - Dexie handles schema upgrades automatically
 * - Use .upgrade() callback for data transformations
 */

export const DB_VERSION = 15

export const DB_STORES_V1 = {
  syncQueue: '++id, entity, entityId, operation, createdAt',
  mediaBlobs: '&id, entityId, createdAt',
} as const

export const DB_STORES_V2 = {
  ...DB_STORES_V1,
  projects: '&id, userId, parentId, name, createdAt, updatedAt, isDeleted',
} as const

export const DB_STORES_V3 = {
  ...DB_STORES_V2,
  work_sessions: '&id, userId, createdAt, updatedAt, isDeleted, date',
} as const

export const DB_STORES_V4 = {
  ...DB_STORES_V3,
  workout_exercises: '&id, userId, createdAt, updatedAt, isDeleted, muscleGroup, name',
} as const

export const DB_STORES_V5 = {
  ...DB_STORES_V4,
  workout_programs: '&id, userId, createdAt, updatedAt, isDeleted, name',
  workout_session_templates: '&id, userId, programId, createdAt, updatedAt, isDeleted, name',
  workout_template_exercises: '&id, userId, sessionTemplateId, exerciseId, isDeleted, order',
} as const

export const DB_STORES_V6 = {
  ...DB_STORES_V5,
  workout_sessions:
    '&id, userId, sessionTemplateId, programId, status, startedAt, createdAt, isDeleted',
  workout_series: '&id, userId, sessionId, exerciseId, isDeleted, order, completed',
} as const

export const DB_STORES_V7 = {
  ...DB_STORES_V6,
  pain_notes: '&id, userId, sessionId, exerciseId, isDeleted, createdAt',
} as const

export const DB_STORES_V8 = {
  ...DB_STORES_V7,
  cardio_sessions: '&id, userId, createdAt, updatedAt, isDeleted, date, activityType',
} as const

export const DB_STORES_V9 = {
  ...DB_STORES_V8,
  stock_products: '&id, userId, createdAt, updatedAt, isDeleted, name, productType',
} as const

export const DB_STORES_V10 = {
  ...DB_STORES_V9,
  stock_purchases: '&id, userId, productId, createdAt, updatedAt, isDeleted, date',
} as const

/**
 * Version 11 (Story 5.3):
 * - stock_routines: Routines de consommation liées aux produits (récurrence, quantité, estimation jours restants)
 */
export const DB_STORES_V11 = {
  ...DB_STORES_V10,
  stock_routines: '&id, userId, productId, createdAt, updatedAt, isDeleted, isActive',
} as const

/**
 * Version 12 (Story 6.1):
 * - tracking_recurrings: Définitions de suivis récurrents (type réponse + récurrence)
 * - tracking_responses: Réponses aux suivis par date (une par suivi par jour)
 */
export const DB_STORES_V12 = {
  ...DB_STORES_V11,
  tracking_recurrings:
    '&id, userId, createdAt, updatedAt, isDeleted, isActive, name, recurrenceType',
  tracking_responses: '&id, userId, recurringId, date, createdAt, updatedAt, isDeleted',
} as const

/**
 * Version 13 (Story 6.2):
 * - tracking_event_types: Types d'événements définis par l'utilisateur (nom, icône, couleur)
 * - tracking_events: Événements créés (titre, type, date, priorité, description, localisation)
 */
export const DB_STORES_V13 = {
  ...DB_STORES_V12,
  tracking_event_types: '&id, userId, createdAt, updatedAt, isDeleted, name',
  tracking_events: '&id, userId, typeId, eventDate, createdAt, updatedAt, isDeleted, priority',
} as const

/**
 * Version 14 (Story 6.3):
 * - journal_entries: Entrées de journal avec texte, propriétés chiffrées et tags libres
 */
export const DB_STORES_V14 = {
  ...DB_STORES_V13,
  journal_entries: '&id, userId, entryDate, createdAt, updatedAt, isDeleted',
} as const

/**
 * Version 15 (BUG-001 extension):
 * - work_sessions: Ajout de l'index status pour trouver les sessions en cours (cross-device)
 */
export const DB_STORES_V15 = {
  ...DB_STORES_V14,
  work_sessions: '&id, userId, createdAt, updatedAt, isDeleted, date, status',
} as const

import { createRoot } from 'react-dom/client'
import { Providers } from '@/app/providers'
import { registerSyncTables, registerEntity } from '@/lib/db/registry'
import { projectRepository } from '@/lib/db/repositories/project.repository'
import { workSessionRepository } from '@/lib/db/repositories/work-session.repository'
import { workoutExerciseRepository } from '@/lib/db/repositories/workout-exercise.repository'
import { workoutProgramRepository } from '@/lib/db/repositories/workout-program.repository'
import { workoutSessionTemplateRepository } from '@/lib/db/repositories/workout-session-template.repository'
import { workoutSessionRepository } from '@/lib/db/repositories/workout-session.repository'
import { workoutSeriesRepository } from '@/lib/db/repositories/workout-series.repository'
import { painNoteRepository } from '@/lib/db/repositories/pain-note.repository'
import { journalEntryRepository } from '@/lib/db/repositories/journal.repository'
import type { BaseRepository } from '@/lib/db/repositories/base.repository'
import type { BaseEntity } from '@/schemas/base.schema'
import './index.css'

// Enregistrer les tables dans le sync registry avant le démarrage de l'app
registerSyncTables()

// Enregistrer les entités dans le registry pour la corbeille multi-table
registerEntity({
  key: 'projects',
  repository: projectRepository as unknown as BaseRepository<BaseEntity>,
  label: 'Projet',
  entityType: 'project',
})

registerEntity({
  key: 'work_sessions',
  repository: workSessionRepository as unknown as BaseRepository<BaseEntity>,
  label: 'Session de travail',
  entityType: 'work-session',
})

registerEntity({
  key: 'workout_exercises',
  repository: workoutExerciseRepository as unknown as BaseRepository<BaseEntity>,
  label: 'Exercice',
  entityType: 'workout-exercise',
})

registerEntity({
  key: 'workout_programs',
  repository: workoutProgramRepository as unknown as BaseRepository<BaseEntity>,
  label: 'Programme d\'entraînement',
  entityType: 'workout-program',
})

registerEntity({
  key: 'workout_session_templates',
  repository: workoutSessionTemplateRepository as unknown as BaseRepository<BaseEntity>,
  label: 'Séance-type',
  entityType: 'workout-session-template',
})

registerEntity({
  key: 'workout_sessions',
  repository: workoutSessionRepository as unknown as BaseRepository<BaseEntity>,
  label: 'Séance de musculation',
  entityType: 'workout-session',
})

registerEntity({
  key: 'workout_series',
  repository: workoutSeriesRepository as unknown as BaseRepository<BaseEntity>,
  label: 'Série',
  entityType: 'workout-series',
})

registerEntity({
  key: 'pain_notes',
  repository: painNoteRepository as unknown as BaseRepository<BaseEntity>,
  label: 'Note de douleur',
  entityType: 'pain-note',
})

registerEntity({
  key: 'journal_entries',
  repository: journalEntryRepository as unknown as BaseRepository<BaseEntity>,
  label: 'Entrée journal',
  entityType: 'journal-entry',
})

createRoot(document.getElementById('root')!).render(<Providers />)

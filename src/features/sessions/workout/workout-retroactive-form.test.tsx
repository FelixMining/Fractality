import { describe, it, expect } from 'vitest'
import { z } from 'zod'

/**
 * Tests de la logique de validation du formulaire de création rétroactive.
 * Le schéma est reconstruit ici pour tester la validation Zod indépendamment du composant.
 * Story 3.5 : Modification et création rétroactive de séances — AC3, AC4
 */

const retroactiveSeriesSchema = z.object({
  reps: z.number().int().min(1).max(100),
  weight: z.number().min(0).max(500).optional(),
  restTime: z.number().int().min(0).max(3600).optional(),
  rpe: z.number().int().min(0).max(10).optional(),
})

const retroactiveFormSchema = z
  .object({
    date: z
      .string()
      .min(1, 'Date requise')
      .refine((val) => {
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)
        return new Date(val) <= todayEnd
      }, 'La date ne peut pas être dans le futur'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
    initialFatigue: z.number().int().min(1).max(10).optional(),
    programId: z.string().optional(),
    sessionTemplateId: z.string().optional(),
    exercises: z
      .array(
        z.object({
          exerciseId: z.string(),
          exerciseName: z.string(),
          muscleGroup: z.string(),
          series: z
            .array(retroactiveSeriesSchema)
            .min(1, 'Au moins une série requise'),
        }),
      )
      .min(1, 'Au moins un exercice requis'),
  })
  .superRefine((data, ctx) => {
    if (data.startTime && data.endTime && data.date) {
      const start = new Date(`${data.date}T${data.startTime}:00`)
      const end = new Date(`${data.date}T${data.endTime}:00`)
      if (end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "L'heure de fin doit être après l'heure de début",
          path: ['endTime'],
        })
      }
    }
  })

const yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1)
const yesterdayStr = yesterday.toISOString().split('T')[0]

const todayStr = new Date().toISOString().split('T')[0]

const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
const tomorrowStr = tomorrow.toISOString().split('T')[0]

const validExercise = {
  exerciseId: 'exercise-uuid-1',
  exerciseName: 'Développé couché',
  muscleGroup: 'Pectoraux',
  series: [{ reps: 10, weight: 80, restTime: 90 }],
}

const validForm = {
  date: yesterdayStr,
  startTime: '10:00',
  endTime: '11:00',
  exercises: [validExercise],
}

describe('WorkoutRetroactiveForm — Validation Zod', () => {
  describe('Validation date', () => {
    it('devrait accepter une date passée (hier)', () => {
      const result = retroactiveFormSchema.safeParse(validForm)
      expect(result.success).toBe(true)
    })

    it("devrait accepter la date d'aujourd'hui", () => {
      const form = { ...validForm, date: todayStr }
      const result = retroactiveFormSchema.safeParse(form)
      expect(result.success).toBe(true)
    })

    it('devrait rejeter une date dans le futur', () => {
      const form = { ...validForm, date: tomorrowStr }
      const result = retroactiveFormSchema.safeParse(form)
      expect(result.success).toBe(false)
      if (!result.success) {
        const dateError = result.error.issues.find((i) => i.path.includes('date'))
        expect(dateError?.message).toBe('La date ne peut pas être dans le futur')
      }
    })

    it('devrait rejeter une date vide', () => {
      const form = { ...validForm, date: '' }
      const result = retroactiveFormSchema.safeParse(form)
      expect(result.success).toBe(false)
    })
  })

  describe('Validation heure début / fin', () => {
    it('devrait accepter endTime > startTime', () => {
      const form = { ...validForm, startTime: '09:00', endTime: '10:30' }
      const result = retroactiveFormSchema.safeParse(form)
      expect(result.success).toBe(true)
    })

    it('devrait rejeter endTime <= startTime (identiques)', () => {
      const form = { ...validForm, startTime: '10:00', endTime: '10:00' }
      const result = retroactiveFormSchema.safeParse(form)
      expect(result.success).toBe(false)
      if (!result.success) {
        const endTimeError = result.error.issues.find((i) => i.path.includes('endTime'))
        expect(endTimeError?.message).toBe("L'heure de fin doit être après l'heure de début")
      }
    })

    it('devrait rejeter endTime < startTime', () => {
      const form = { ...validForm, startTime: '14:00', endTime: '13:00' }
      const result = retroactiveFormSchema.safeParse(form)
      expect(result.success).toBe(false)
    })

    it('devrait rejeter un format heure invalide', () => {
      const form = { ...validForm, startTime: '10h00' }
      const result = retroactiveFormSchema.safeParse(form)
      expect(result.success).toBe(false)
    })
  })

  describe('Calcul de la durée', () => {
    it('devrait calculer correctement 1h de durée', () => {
      const startedAt = new Date(`${yesterdayStr}T10:00:00`).toISOString()
      const completedAt = new Date(`${yesterdayStr}T11:00:00`).toISOString()
      const totalDuration = Math.floor(
        (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000,
      )
      expect(totalDuration).toBe(3600)
    })

    it('devrait calculer correctement 1h30 de durée', () => {
      const startedAt = new Date(`${yesterdayStr}T09:00:00`).toISOString()
      const completedAt = new Date(`${yesterdayStr}T10:30:00`).toISOString()
      const totalDuration = Math.floor(
        (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000,
      )
      expect(totalDuration).toBe(5400)
    })

    it('devrait calculer correctement 45 minutes de durée', () => {
      const startedAt = new Date(`${yesterdayStr}T08:15:00`).toISOString()
      const completedAt = new Date(`${yesterdayStr}T09:00:00`).toISOString()
      const totalDuration = Math.floor(
        (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000,
      )
      expect(totalDuration).toBe(2700)
    })
  })

  describe('Validation exercices', () => {
    it('devrait rejeter un formulaire sans exercice', () => {
      const form = { ...validForm, exercises: [] }
      const result = retroactiveFormSchema.safeParse(form)
      expect(result.success).toBe(false)
    })

    it('devrait rejeter un exercice sans série', () => {
      const form = {
        ...validForm,
        exercises: [{ ...validExercise, series: [] }],
      }
      const result = retroactiveFormSchema.safeParse(form)
      expect(result.success).toBe(false)
    })

    it('devrait accepter plusieurs exercices', () => {
      const form = {
        ...validForm,
        exercises: [
          validExercise,
          {
            exerciseId: 'exercise-uuid-2',
            exerciseName: 'Squat',
            muscleGroup: 'Quadriceps',
            series: [{ reps: 5, weight: 100 }],
          },
        ],
      }
      const result = retroactiveFormSchema.safeParse(form)
      expect(result.success).toBe(true)
    })

    it('devrait rejeter reps < 1', () => {
      const form = {
        ...validForm,
        exercises: [{ ...validExercise, series: [{ reps: 0 }] }],
      }
      const result = retroactiveFormSchema.safeParse(form)
      expect(result.success).toBe(false)
    })

    it('devrait accepter une série sans charge (exercice au poids de corps)', () => {
      const form = {
        ...validForm,
        exercises: [{ ...validExercise, series: [{ reps: 15 }] }],
      }
      const result = retroactiveFormSchema.safeParse(form)
      expect(result.success).toBe(true)
    })
  })

  describe('Calcul du volume total', () => {
    it('devrait calculer le volume correctement', () => {
      const exercises = [
        { series: [{ reps: 10, weight: 80 }, { reps: 8, weight: 80 }] },
        { series: [{ reps: 5, weight: 100 }] },
      ]
      const totalVolume = exercises
        .flatMap((ex) => ex.series)
        .reduce((sum, s) => sum + s.reps * (s.weight ?? 0), 0)
      // 10*80 + 8*80 + 5*100 = 800 + 640 + 500 = 1940
      expect(totalVolume).toBe(1940)
    })

    it('devrait ignorer les séries sans charge dans le calcul', () => {
      const exercises = [{ series: [{ reps: 15, weight: undefined }] }]
      const totalVolume = exercises
        .flatMap((ex) => ex.series)
        .reduce((sum, s) => sum + s.reps * (s.weight ?? 0), 0)
      expect(totalVolume).toBe(0)
    })
  })

  describe('Validation fatigue initiale', () => {
    it('devrait accepter fatigue optionnelle absente', () => {
      const form = { ...validForm, initialFatigue: undefined }
      const result = retroactiveFormSchema.safeParse(form)
      expect(result.success).toBe(true)
    })

    it('devrait accepter fatigue entre 1 et 10', () => {
      for (let i = 1; i <= 10; i++) {
        const form = { ...validForm, initialFatigue: i }
        const result = retroactiveFormSchema.safeParse(form)
        expect(result.success).toBe(true)
      }
    })

    it('devrait rejeter fatigue > 10', () => {
      const form = { ...validForm, initialFatigue: 11 }
      const result = retroactiveFormSchema.safeParse(form)
      expect(result.success).toBe(false)
    })
  })
})

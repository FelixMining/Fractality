import { describe, it, expect } from 'vitest'
import { painNoteSchema, painZoneEnum, type PainZone } from './pain-note.schema'

describe('PainZoneEnum', () => {
  it('should accept valid zones', () => {
    const validZones: PainZone[] = [
      'shoulder',
      'elbow',
      'wrist',
      'back',
      'hip',
      'knee',
      'ankle',
    ]

    validZones.forEach(zone => {
      const result = painZoneEnum.safeParse(zone)
      expect(result.success).toBe(true)
    })
  })

  it('should reject invalid zones', () => {
    const invalidZones = ['head', 'foot', 'hand', '']

    invalidZones.forEach(zone => {
      const result = painZoneEnum.safeParse(zone)
      expect(result.success).toBe(false)
    })
  })
})

describe('PainNoteSchema', () => {
  const validPainNote = {
    id: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
    userId: '550e8400-e29b-41d4-a716-446655440001',
    sessionId: '550e8400-e29b-41d4-a716-446655440002',
    exerciseId: '550e8400-e29b-41d4-a716-446655440003',
    zone: 'shoulder' as PainZone,
    intensity: 7,
    note: 'Douleur aiguë pendant le développé couché',
    createdAt: '2026-02-17T10:00:00.000Z',
    updatedAt: '2026-02-17T10:00:00.000Z',
    isDeleted: false,
    deletedAt: null,
  }

  it('should validate a complete valid pain note', () => {
    const result = painNoteSchema.safeParse(validPainNote)
    expect(result.success).toBe(true)
  })

  it('should validate without optional note', () => {
    const { note, ...painNoteWithoutNote } = validPainNote
    const result = painNoteSchema.safeParse(painNoteWithoutNote)
    expect(result.success).toBe(true)
  })

  it('should reject missing required field sessionId', () => {
    const { sessionId, ...painNoteWithoutSession } = validPainNote
    const result = painNoteSchema.safeParse(painNoteWithoutSession)
    expect(result.success).toBe(false)
  })

  it('should reject missing required field exerciseId', () => {
    const { exerciseId, ...painNoteWithoutExercise } = validPainNote
    const result = painNoteSchema.safeParse(painNoteWithoutExercise)
    expect(result.success).toBe(false)
  })

  it('should reject missing required field zone', () => {
    const { zone, ...painNoteWithoutZone } = validPainNote
    const result = painNoteSchema.safeParse(painNoteWithoutZone)
    expect(result.success).toBe(false)
  })

  it('should reject missing required field intensity', () => {
    const { intensity, ...painNoteWithoutIntensity } = validPainNote
    const result = painNoteSchema.safeParse(painNoteWithoutIntensity)
    expect(result.success).toBe(false)
  })

  it('should reject invalid sessionId (not UUID)', () => {
    const invalidPainNote = { ...validPainNote, sessionId: 'not-a-uuid' }
    const result = painNoteSchema.safeParse(invalidPainNote)
    expect(result.success).toBe(false)
  })

  it('should reject invalid exerciseId (not UUID)', () => {
    const invalidPainNote = { ...validPainNote, exerciseId: 'not-a-uuid' }
    const result = painNoteSchema.safeParse(invalidPainNote)
    expect(result.success).toBe(false)
  })

  it('should reject intensity below 1', () => {
    const invalidPainNote = { ...validPainNote, intensity: 0 }
    const result = painNoteSchema.safeParse(invalidPainNote)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Minimum 1')
    }
  })

  it('should reject intensity above 10', () => {
    const invalidPainNote = { ...validPainNote, intensity: 11 }
    const result = painNoteSchema.safeParse(invalidPainNote)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Maximum 10')
    }
  })

  it('should accept intensity at boundary (1)', () => {
    const painNoteMin = { ...validPainNote, intensity: 1 }
    const result = painNoteSchema.safeParse(painNoteMin)
    expect(result.success).toBe(true)
  })

  it('should accept intensity at boundary (10)', () => {
    const painNoteMax = { ...validPainNote, intensity: 10 }
    const result = painNoteSchema.safeParse(painNoteMax)
    expect(result.success).toBe(true)
  })

  it('should reject intensity as float', () => {
    const invalidPainNote = { ...validPainNote, intensity: 7.5 }
    const result = painNoteSchema.safeParse(invalidPainNote)
    expect(result.success).toBe(false)
  })

  it('should reject note longer than 500 characters', () => {
    const longNote = 'a'.repeat(501)
    const invalidPainNote = { ...validPainNote, note: longNote }
    const result = painNoteSchema.safeParse(invalidPainNote)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Maximum 500')
    }
  })

  it('should accept note exactly 500 characters', () => {
    const note500 = 'a'.repeat(500)
    const painNote = { ...validPainNote, note: note500 }
    const result = painNoteSchema.safeParse(painNote)
    expect(result.success).toBe(true)
  })

  it('should reject invalid zone', () => {
    const invalidPainNote = { ...validPainNote, zone: 'invalid-zone' }
    const result = painNoteSchema.safeParse(invalidPainNote)
    expect(result.success).toBe(false)
  })
})

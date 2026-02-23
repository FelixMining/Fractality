-- Story 3.1: Workout Exercises Table
-- This migration creates the workout_exercises table for managing
-- a library of workout exercises with muscle group categorization

CREATE TABLE IF NOT EXISTS workout_exercises (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Exercise specific properties
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  muscle_group TEXT NOT NULL CHECK (
    muscle_group IN ('chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'full-body')
  ),
  description TEXT CHECK (char_length(description) <= 500),

  -- Base entity properties (inherited from BaseEntitySchema)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_exercises_user_id ON workout_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_created_at ON workout_exercises(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_is_deleted ON workout_exercises(is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_workout_exercises_muscle_group ON workout_exercises(muscle_group) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_workout_exercises_name ON workout_exercises(name) WHERE is_deleted = false;

-- Row Level Security
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own workout exercises
CREATE POLICY "Users can view their own workout exercises"
  ON workout_exercises FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own workout exercises
CREATE POLICY "Users can insert their own workout exercises"
  ON workout_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own workout exercises
CREATE POLICY "Users can update their own workout exercises"
  ON workout_exercises FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own workout exercises
CREATE POLICY "Users can delete their own workout exercises"
  ON workout_exercises FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_workout_exercises_updated_at
  BEFORE UPDATE ON workout_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migration 009: Workout Series Table
-- Story 3.3: Séance musculation live
-- Table pour les séries individuelles dans les séances de musculation

CREATE TABLE workout_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,

  -- Propriétés spécifiques
  "order" INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL CHECK (reps >= 1 AND reps <= 100),
  weight DECIMAL(5,1) CHECK (weight IS NULL OR (weight >= 0 AND weight <= 500)),
  rest_time INTEGER CHECK (rest_time IS NULL OR (rest_time >= 0 AND rest_time <= 3600)),
  rpe INTEGER CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
  completed BOOLEAN NOT NULL DEFAULT FALSE,

  -- BaseEntity
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Index pour performance
CREATE INDEX idx_workout_series_user_id ON workout_series(user_id);
CREATE INDEX idx_workout_series_session_id ON workout_series(session_id);
CREATE INDEX idx_workout_series_exercise_id ON workout_series(exercise_id);
CREATE INDEX idx_workout_series_order ON workout_series("order");
CREATE INDEX idx_workout_series_is_deleted ON workout_series(is_deleted) WHERE is_deleted = false;

-- RLS
ALTER TABLE workout_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own series"
  ON workout_series FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own series"
  ON workout_series FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own series"
  ON workout_series FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own series"
  ON workout_series FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_workout_series_updated_at
  BEFORE UPDATE ON workout_series
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

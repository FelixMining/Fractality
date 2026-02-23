-- fractality/supabase/migrations/007_workout_template_exercises_table.sql
CREATE TABLE workout_template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_template_id UUID NOT NULL REFERENCES workout_session_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,

  -- Propriétés spécifiques
  "order" INTEGER NOT NULL DEFAULT 0, -- Position dans la séance
  default_sets INTEGER NOT NULL CHECK (default_sets >= 1 AND default_sets <= 10),
  default_reps INTEGER CHECK (default_reps IS NULL OR (default_reps >= 1 AND default_reps <= 100)),
  default_weight DECIMAL(5,1) CHECK (default_weight IS NULL OR (default_weight >= 0 AND default_weight <= 500)),

  -- BaseEntity
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Index pour performance
CREATE INDEX idx_workout_template_exercises_user_id ON workout_template_exercises(user_id);
CREATE INDEX idx_workout_template_exercises_session_template_id ON workout_template_exercises(session_template_id);
CREATE INDEX idx_workout_template_exercises_exercise_id ON workout_template_exercises(exercise_id);
CREATE INDEX idx_workout_template_exercises_order ON workout_template_exercises("order");
CREATE INDEX idx_workout_template_exercises_is_deleted ON workout_template_exercises(is_deleted) WHERE is_deleted = false;

-- RLS
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own template exercises"
  ON workout_template_exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own template exercises"
  ON workout_template_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own template exercises"
  ON workout_template_exercises FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own template exercises"
  ON workout_template_exercises FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_workout_template_exercises_updated_at
  BEFORE UPDATE ON workout_template_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

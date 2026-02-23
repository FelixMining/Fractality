-- fractality/supabase/migrations/005_workout_programs_table.sql
CREATE TABLE workout_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Propriétés spécifiques
  name TEXT NOT NULL,
  description TEXT,

  -- BaseEntity
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Index pour performance
CREATE INDEX idx_workout_programs_user_id ON workout_programs(user_id);
CREATE INDEX idx_workout_programs_name ON workout_programs(name);
CREATE INDEX idx_workout_programs_is_deleted ON workout_programs(is_deleted) WHERE is_deleted = false;

-- RLS
ALTER TABLE workout_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own programs"
  ON workout_programs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own programs"
  ON workout_programs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own programs"
  ON workout_programs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own programs"
  ON workout_programs FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_workout_programs_updated_at
  BEFORE UPDATE ON workout_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- fractality/supabase/migrations/006_workout_session_templates_table.sql
CREATE TABLE workout_session_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES workout_programs(id) ON DELETE CASCADE,

  -- Propriétés spécifiques
  name TEXT NOT NULL,

  -- BaseEntity
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Index pour performance
CREATE INDEX idx_workout_session_templates_user_id ON workout_session_templates(user_id);
CREATE INDEX idx_workout_session_templates_program_id ON workout_session_templates(program_id);
CREATE INDEX idx_workout_session_templates_is_deleted ON workout_session_templates(is_deleted) WHERE is_deleted = false;

-- RLS
ALTER TABLE workout_session_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own session templates"
  ON workout_session_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own session templates"
  ON workout_session_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own session templates"
  ON workout_session_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own session templates"
  ON workout_session_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_workout_session_templates_updated_at
  BEFORE UPDATE ON workout_session_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migration 008: Workout Sessions Table
-- Story 3.3: Séance musculation live
-- Table pour les séances de musculation réalisées (live tracking)

CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES workout_programs(id) ON DELETE SET NULL,
  session_template_id UUID REFERENCES workout_session_templates(id) ON DELETE SET NULL,

  -- Propriétés spécifiques
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  initial_fatigue INTEGER CHECK (initial_fatigue >= 1 AND initial_fatigue <= 10),
  total_duration INTEGER CHECK (total_duration >= 0), -- secondes
  total_volume DECIMAL(10,2) CHECK (total_volume >= 0), -- kg
  status TEXT NOT NULL CHECK (status IN ('in-progress', 'completed', 'abandoned')),

  -- BaseEntity
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Index pour performance
CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_session_template_id ON workout_sessions(session_template_id);
CREATE INDEX idx_workout_sessions_program_id ON workout_sessions(program_id);
CREATE INDEX idx_workout_sessions_status ON workout_sessions(status);
CREATE INDEX idx_workout_sessions_started_at ON workout_sessions(started_at);
CREATE INDEX idx_workout_sessions_is_deleted ON workout_sessions(is_deleted) WHERE is_deleted = false;

-- RLS
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON workout_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON workout_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_workout_sessions_updated_at
  BEFORE UPDATE ON workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

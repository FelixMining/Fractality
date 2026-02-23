-- Story 2.1: Work Sessions Table
-- This migration creates the work_sessions table for tracking work sessions
-- with timer functionality and custom properties (productivity, concentration)

CREATE TABLE IF NOT EXISTS work_sessions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Work session specific properties
  duration INTEGER NOT NULL CHECK (duration > 0),
  productivity INTEGER CHECK (productivity >= 1 AND productivity <= 10),
  concentration INTEGER CHECK (concentration >= 1 AND concentration <= 10),

  -- Common properties (inherited from CommonPropertiesSchema)
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location TEXT,
  images TEXT[],
  tags TEXT[],
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Base entity properties (inherited from BaseEntitySchema)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_sessions_user_id ON work_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_created_at ON work_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_sessions_date ON work_sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_work_sessions_is_deleted ON work_sessions(is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_work_sessions_project_id ON work_sessions(project_id) WHERE project_id IS NOT NULL;

-- Row Level Security
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own work sessions
CREATE POLICY "Users can view their own work sessions"
  ON work_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own work sessions
CREATE POLICY "Users can insert their own work sessions"
  ON work_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own work sessions
CREATE POLICY "Users can update their own work sessions"
  ON work_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own work sessions
CREATE POLICY "Users can delete their own work sessions"
  ON work_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_work_sessions_updated_at
  BEFORE UPDATE ON work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migration 016: Colonnes timer pour sessions de travail cross-device
-- Story BUG-001 extension: persistance du timer en base pour sync cross-device

ALTER TABLE work_sessions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timer_elapsed_secs DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timer_paused BOOLEAN NOT NULL DEFAULT FALSE;

-- Index pour trouver rapidement les sessions en cours
CREATE INDEX IF NOT EXISTS idx_work_sessions_status ON work_sessions(user_id, status) WHERE status = 'in_progress';

-- Ajouter à la publication Realtime (déjà activée dans migration 015)
-- work_sessions est déjà dans supabase_realtime via migration 015

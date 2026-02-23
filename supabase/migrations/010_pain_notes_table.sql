-- Migration 010: Pain Notes Table
-- Story 3.4: Personnalisation spontanée et notes de douleur
--
-- Cette table stocke les notes de douleur articulaire lors des séances de musculation.
-- Elle permet de documenter les douleurs ressenties pendant les exercices pour référence future
-- et analyse des patterns de douleur.

CREATE TABLE pain_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,

  -- Propriétés spécifiques
  zone TEXT NOT NULL CHECK (zone IN ('shoulder', 'elbow', 'wrist', 'back', 'hip', 'knee', 'ankle')),
  intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
  note TEXT,

  -- BaseEntity
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Index pour performance
CREATE INDEX idx_pain_notes_user_id ON pain_notes(user_id);
CREATE INDEX idx_pain_notes_session_id ON pain_notes(session_id);
CREATE INDEX idx_pain_notes_exercise_id ON pain_notes(exercise_id);
CREATE INDEX idx_pain_notes_created_at ON pain_notes(created_at);
CREATE INDEX idx_pain_notes_is_deleted ON pain_notes(is_deleted) WHERE is_deleted = false;

-- RLS (Row Level Security)
ALTER TABLE pain_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres notes de douleur
CREATE POLICY "Users can view their own pain notes"
  ON pain_notes FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent insérer leurs propres notes de douleur
CREATE POLICY "Users can insert their own pain notes"
  ON pain_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres notes de douleur
CREATE POLICY "Users can update their own pain notes"
  ON pain_notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leurs propres notes de douleur
CREATE POLICY "Users can delete their own pain notes"
  ON pain_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_pain_notes_updated_at
  BEFORE UPDATE ON pain_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour la documentation
COMMENT ON TABLE pain_notes IS 'Notes de douleur articulaire lors des séances de musculation';
COMMENT ON COLUMN pain_notes.zone IS 'Zone du corps affectée (shoulder, elbow, wrist, back, hip, knee, ankle)';
COMMENT ON COLUMN pain_notes.intensity IS 'Intensité de la douleur sur une échelle de 1 (légère) à 10 (forte)';
COMMENT ON COLUMN pain_notes.note IS 'Note optionnelle décrivant la douleur (max 500 caractères)';

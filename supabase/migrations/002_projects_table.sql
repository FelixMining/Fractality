-- Story 1.6: Projects table
-- Système de projets hiérarchiques avec couleurs pour organiser les entrées

CREATE TABLE projects (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ
);

-- Indexes pour queries hiérarchiques et delta sync
CREATE INDEX idx_projects_user_id ON projects USING btree (user_id);
CREATE INDEX idx_projects_parent_id ON projects USING btree (parent_id);
CREATE INDEX idx_projects_user_updated ON projects USING btree (user_id, updated_at);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select" ON projects
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "projects_insert" ON projects
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "projects_update" ON projects
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "projects_delete" ON projects
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Auto-update updated_at
-- Réutilise la fonction update_updated_at_column() de 001_base_infrastructure.sql
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

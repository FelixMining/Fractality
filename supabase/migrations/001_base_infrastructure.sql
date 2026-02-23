-- ============================================================
-- Fractality — Base Infrastructure SQL
-- Story 1.5: Reference patterns for syncable entity tables
-- ============================================================

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TEMPLATE: Copy and adapt for each new syncable entity table
-- ============================================================
--
-- CREATE TABLE {table_name} (
--   id UUID PRIMARY KEY,
--   user_id UUID NOT NULL REFERENCES auth.users(id),
--   -- ... colonnes metier ...
--   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
--   updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
--   is_deleted BOOLEAN NOT NULL DEFAULT false,
--   deleted_at TIMESTAMPTZ
-- );
--
-- -- Index for delta sync pull: WHERE updated_at > last_sync
-- CREATE INDEX idx_{table_name}_user_updated
--   ON {table_name} USING btree (user_id, updated_at);
--
-- -- Row Level Security
-- ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "{table_name}_select" ON {table_name}
--   FOR SELECT TO authenticated
--   USING ((SELECT auth.uid()) = user_id);
--
-- CREATE POLICY "{table_name}_insert" ON {table_name}
--   FOR INSERT TO authenticated
--   WITH CHECK ((SELECT auth.uid()) = user_id);
--
-- CREATE POLICY "{table_name}_update" ON {table_name}
--   FOR UPDATE TO authenticated
--   USING ((SELECT auth.uid()) = user_id)
--   WITH CHECK ((SELECT auth.uid()) = user_id);
--
-- -- Auto-update updated_at trigger
-- CREATE TRIGGER set_{table_name}_updated_at
--   BEFORE UPDATE ON {table_name}
--   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

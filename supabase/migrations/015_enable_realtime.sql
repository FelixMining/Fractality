-- Migration 015: Activation Supabase Realtime sur toutes les tables syncables
-- À exécuter dans le SQL Editor de Supabase
--
-- Permet aux clients connectés de recevoir les changements en temps réel
-- via postgres_changes (WebSockets). Sans ça, le SyncEngine ne reçoit
-- pas de notifications et doit attendre le polling de 60s.

-- Activer REPLICA IDENTITY FULL sur chaque table pour que les événements
-- DELETE incluent les anciennes valeurs (nécessaire pour la résolution de conflits)
ALTER TABLE projects REPLICA IDENTITY FULL;
ALTER TABLE work_sessions REPLICA IDENTITY FULL;
ALTER TABLE workout_exercises REPLICA IDENTITY FULL;
ALTER TABLE workout_programs REPLICA IDENTITY FULL;
ALTER TABLE workout_session_templates REPLICA IDENTITY FULL;
ALTER TABLE workout_template_exercises REPLICA IDENTITY FULL;
ALTER TABLE workout_sessions REPLICA IDENTITY FULL;
ALTER TABLE workout_series REPLICA IDENTITY FULL;
ALTER TABLE pain_notes REPLICA IDENTITY FULL;
ALTER TABLE cardio_sessions REPLICA IDENTITY FULL;
ALTER TABLE stock_products REPLICA IDENTITY FULL;
ALTER TABLE stock_purchases REPLICA IDENTITY FULL;
ALTER TABLE stock_routines REPLICA IDENTITY FULL;
ALTER TABLE tracking_recurrings REPLICA IDENTITY FULL;
ALTER TABLE tracking_responses REPLICA IDENTITY FULL;
ALTER TABLE tracking_event_types REPLICA IDENTITY FULL;
ALTER TABLE tracking_events REPLICA IDENTITY FULL;
ALTER TABLE journal_entries REPLICA IDENTITY FULL;

-- Ajouter toutes les tables à la publication Realtime de Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE
  projects,
  work_sessions,
  workout_exercises,
  workout_programs,
  workout_session_templates,
  workout_template_exercises,
  workout_sessions,
  workout_series,
  pain_notes,
  cardio_sessions,
  stock_products,
  stock_purchases,
  stock_routines,
  tracking_recurrings,
  tracking_responses,
  tracking_event_types,
  tracking_events,
  journal_entries;

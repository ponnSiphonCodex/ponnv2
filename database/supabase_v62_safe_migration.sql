-- V62 SAFE MIGRATION: additive only, no existing data deleted
BEGIN;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS gantt_health TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_progress NUMERIC(5,2) DEFAULT 0;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_gantt_health_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_gantt_health_check CHECK (gantt_health IS NULL OR gantt_health IN ('green','yellow','red'));
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_actual_progress_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_actual_progress_check CHECK (actual_progress >= 0 AND actual_progress <= 100);
COMMIT;

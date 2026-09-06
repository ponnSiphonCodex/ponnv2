-- PonnV2 v33 SAFE MIGRATION: ไม่ล้างข้อมูลเดิม
BEGIN;
ALTER TABLE products ADD COLUMN IF NOT EXISTS owner_id TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date BIGINT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date BIGINT;
CREATE INDEX IF NOT EXISTS products_owner_id_idx ON products(owner_id);
CREATE INDEX IF NOT EXISTS projects_timeline_idx ON projects(start_date,end_date);
CREATE UNIQUE INDEX IF NOT EXISTS project_managers_project_user_uidx ON project_managers(project_id,user_id);
COMMIT;

-- database/migrations/schema.sql
-- SQL รวมไฟล์เดียวจบ: สร้างตารางทั้งหมด 23 ตาราง + ใส่ local user ทดสอบ
--
-- ⚠️ ห้ามใส่ PRAGMA — D1 Console รัน PRAGMA ไม่ได้ ถ้าใส่จะ error ทั้ง batch (สาเหตุ
--    "no such table: users" ที่เจอมาก่อน)
--
-- ทุกคำสั่งใช้ IF NOT EXISTS / INSERT OR IGNORE / ON CONFLICT จึง "รันซ้ำได้" ปลอดภัย
-- ไม่ error แม้เคยรันไปแล้วบางส่วน
--
-- วิธีรัน: Cloudflare Dashboard > D1 > ponn_platform > Console
--   1) เปิดไฟล์นี้ Ctrl+A → Ctrl+C
--   2) วางในกล่อง Query
--   3) กด Run (ถ้ามีปุ่มลูกศร dropdown ข้าง Run ให้เลือก "Run all" ถ้ามี)
--   4) ต้องเห็น "Executed 40/40" (หรือใกล้เคียง) ไม่ใช่ "1/1"

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT, email TEXT NOT NULL UNIQUE, email_verified INTEGER, image TEXT,
  password_hash TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS accounts (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL, provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL, refresh_token TEXT, access_token TEXT, expires_at INTEGER, token_type TEXT,
  scope TEXT, id_token TEXT, session_state TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (provider, provider_account_id)
);
CREATE INDEX IF NOT EXISTS accounts_user_idx ON accounts(user_id);

CREATE TABLE IF NOT EXISTS sessions (
  session_token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL, token TEXT NOT NULL, expires INTEGER NOT NULL, PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS system_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT, role_name TEXT NOT NULL, module TEXT NOT NULL CHECK (module IN ('PM','RENTALS','GLOBAL')),
  permissions TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_role_uniq ON user_roles(user_id, role_id);

CREATE TABLE IF NOT EXISTS themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS initiatives (
  id INTEGER PRIMARY KEY AUTOINCREMENT, theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT, initiative_id INTEGER NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  title TEXT NOT NULL, type TEXT, owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS priorities (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, level INTEGER NOT NULL, color TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT, requirement_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  name TEXT NOT NULL, status TEXT, priority_id INTEGER REFERENCES priorities(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, status TEXT, theme_id INTEGER REFERENCES themes(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS features (
  id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE, name TEXT NOT NULL, status TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS workflow_statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL, color TEXT, category TEXT NOT NULL CHECK (category IN ('todo','doing','done')), sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS workflow_statuses_project_idx ON workflow_statuses(project_id);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT, feature_id INTEGER NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL, title TEXT NOT NULL,
  workflow_status_id INTEGER NOT NULL REFERENCES workflow_statuses(id) ON DELETE RESTRICT,
  start_date INTEGER, due_date INTEGER, estimated_hours REAL, budget_cost REAL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS tasks_feature_idx ON tasks(feature_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(workflow_status_id);
CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON tasks(assignee_id);

CREATE TABLE IF NOT EXISTS custom_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL CHECK (entity_type IN ('task','project','feature')),
  field_name TEXT NOT NULL, field_type TEXT NOT NULL CHECK (field_type IN ('text','number','date','select','checkbox')), field_options TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS custom_field_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT, custom_field_id INTEGER NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_id INTEGER NOT NULL, value TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS custom_field_values_field_entity_uniq ON custom_field_values(custom_field_id, entity_id);
CREATE INDEX IF NOT EXISTS custom_field_values_entity_idx ON custom_field_values(entity_id);

CREATE TABLE IF NOT EXISTS task_worklogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, work_date INTEGER NOT NULL, hours_spent REAL NOT NULL, note TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS task_worklogs_task_idx ON task_worklogs(task_id);

CREATE TABLE IF NOT EXISTS issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS risks (
  id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT,
  probability TEXT NOT NULL DEFAULT 'medium' CHECK (probability IN ('low','medium','high')),
  impact TEXT NOT NULL DEFAULT 'medium' CHECK (impact IN ('low','medium','high')),
  mitigation_plan TEXT, owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL CHECK (entity_type IN ('task','project','feature','issue','risk')),
  entity_id INTEGER NOT NULL, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS comments_entity_idx ON comments(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL, entity_id INTEGER NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL, action TEXT NOT NULL,
  field_changed TEXT, old_value TEXT, new_value TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS activity_logs_entity_idx ON activity_logs(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL CHECK (entity_type IN ('task','project','feature','issue')),
  entity_id INTEGER NOT NULL, google_drive_file_id TEXT NOT NULL, file_name TEXT,
  uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS attachments_entity_idx ON attachments(entity_type, entity_id);

-- ===== ข้อมูลตั้งต้น (idempotent — รันซ้ำไม่พัง) =====

INSERT OR IGNORE INTO priorities (id, name, level, color) VALUES
  (1, 'Critical', 1, '#EC186E'),
  (2, 'High', 2, '#D4A017'),
  (3, 'Medium', 3, '#6B7280'),
  (4, 'Low', 4, '#9AA0A6');

-- local user ทดสอบ — email: admin@ponnsth.com / password: Ponnsth@2026
-- password_hash = PBKDF2-SHA256 (100000 รอบ) ตรงกับ apps/web/src/lib/password.ts
INSERT INTO users (id, name, email, password_hash)
VALUES (
  lower(hex(randomblob(16))),
  'Admin (Local)',
  'admin@ponnsth.com',
  '100000:c06ddce4df12fa9a36fbd46283897aba:f1cf10ea3c4bfa5734a35cf7116a1f67f07ea87bfa1e8a2aec2890a63e76287b'
)
ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash;

-- ===== Seed ข้อมูล Project ทดสอบ (ให้ /pm/board?id=1 มีข้อมูลแสดงทันที) =====

INSERT OR IGNORE INTO themes (id, name) VALUES (1, 'Digital Transformation');
INSERT OR IGNORE INTO projects (id, name, status, theme_id) VALUES (1, 'PM Platform Rollout', 'in_progress', 1);
INSERT OR IGNORE INTO workflow_statuses (id, project_id, name, category, sort_order) VALUES
  (1, 1, 'To Do', 'todo', 1),
  (2, 1, 'Doing', 'doing', 2),
  (3, 1, 'Done', 'done', 3);

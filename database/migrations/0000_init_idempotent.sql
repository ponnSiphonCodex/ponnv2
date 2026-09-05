-- database/migrations/0000_init_idempotent.sql
--
-- ไฟล์นี้แทนไฟล์ schema เดิมทั้งหมด (ใช้ไฟล์นี้ไฟล์เดียวจากนี้ไป)
-- ทุกคำสั่งเป็น "idempotent" คือรันซ้ำกี่ครั้งก็ปลอดภัย ไม่ error ไม่ซ้ำข้อมูล
-- (ใช้ IF NOT EXISTS ทุกจุด + INSERT OR IGNORE / WHERE NOT EXISTS สำหรับ seed data)
--
-- ⚠️ ก่อนรัน ให้เช็คก่อนว่า Worker (pm-platform-web / pm-platform-api) ผูกกับ
-- D1 database ตัวเดียวกับที่กำลังเปิด Console อยู่จริง — เปิด Worker →
-- Settings → Bindings (หรือ "D1 Database Bindings") → เทียบชื่อฐานข้อมูล +
-- Database ID ให้ตรงกับที่นี่ ถ้าไม่ตรง ต่อให้รัน SQL สำเร็จก็จะยังเจอ
-- "no such table" อยู่ดี เพราะ Worker มองไปคนละฐานข้อมูล
--
-- วิธีใช้: Cloudflare Dashboard > D1 > (เลือก database) > Console
-- วางทั้งไฟล์นี้ → Ctrl+A เลือกทั้งหมดในกล่อง Query → กด Run

PRAGMA foreign_keys = ON;

-- 1) AUTH & USERS LAYER
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER,
  image TEXT,
  password_hash TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS accounts (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (provider, provider_account_id)
);
CREATE INDEX IF NOT EXISTS accounts_user_idx ON accounts(user_id);

CREATE TABLE IF NOT EXISTS sessions (
  session_token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires INTEGER NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- 2) ROLES & PERMISSIONS LAYER
CREATE TABLE IF NOT EXISTS system_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_name TEXT NOT NULL,
  module TEXT NOT NULL CHECK (module IN ('PM','RENTALS','GLOBAL')),
  permissions TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS system_roles_name_module_uniq ON system_roles(role_name, module);

CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_role_uniq ON user_roles(user_id, role_id);

-- 3) STRATEGY LAYER
CREATE TABLE IF NOT EXISTS themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS initiatives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  initiative_id INTEGER NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT,
  owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

-- 4) PRODUCT & PROJECT LAYER
CREATE TABLE IF NOT EXISTS priorities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  level INTEGER NOT NULL,
  color TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requirement_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT,
  priority_id INTEGER REFERENCES priorities(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  status TEXT,
  theme_id INTEGER REFERENCES themes(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

-- 5) TASK & KANBAN LAYER
CREATE TABLE IF NOT EXISTS workflow_statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  category TEXT NOT NULL CHECK (category IN ('todo','doing','done')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS workflow_statuses_project_idx ON workflow_statuses(project_id);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id INTEGER NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  workflow_status_id INTEGER NOT NULL REFERENCES workflow_statuses(id) ON DELETE RESTRICT,
  start_date INTEGER,
  due_date INTEGER,
  estimated_hours REAL,
  budget_cost REAL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS tasks_feature_idx ON tasks(feature_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(workflow_status_id);
CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON tasks(assignee_id);

CREATE TABLE IF NOT EXISTS custom_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task','project','feature')),
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text','number','date','select','checkbox')),
  field_options TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS custom_field_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_field_id INTEGER NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_id INTEGER NOT NULL,
  value TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS custom_field_values_field_entity_uniq ON custom_field_values(custom_field_id, entity_id);
CREATE INDEX IF NOT EXISTS custom_field_values_entity_idx ON custom_field_values(entity_id);

-- 6) TRACKING & COLLABORATION LAYER
CREATE TABLE IF NOT EXISTS task_worklogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_date INTEGER NOT NULL,
  hours_spent REAL NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS task_worklogs_task_idx ON task_worklogs(task_id);

CREATE TABLE IF NOT EXISTS issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS risks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  probability TEXT NOT NULL DEFAULT 'medium' CHECK (probability IN ('low','medium','high')),
  impact TEXT NOT NULL DEFAULT 'medium' CHECK (impact IN ('low','medium','high')),
  mitigation_plan TEXT,
  owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task','project','feature','issue','risk')),
  entity_id INTEGER NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS comments_entity_idx ON comments(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS activity_logs_entity_idx ON activity_logs(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task','project','feature','issue')),
  entity_id INTEGER NOT NULL,
  google_drive_file_id TEXT NOT NULL,
  file_name TEXT,
  uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS attachments_entity_idx ON attachments(entity_type, entity_id);

-- ═══════════════════════════════════════════════════════════
-- SEED DATA — ปลอดภัยต่อการรันซ้ำ (ข้าม row ที่มีอยู่แล้วอัตโนมัติ)
-- ═══════════════════════════════════════════════════════════

-- lookup ตั้งต้น (กันซ้ำด้วย WHERE NOT EXISTS เพราะยังไม่มี unique constraint บน name)
INSERT INTO priorities (name, level, color)
  SELECT 'Critical', 1, '#EC186E' WHERE NOT EXISTS (SELECT 1 FROM priorities WHERE name = 'Critical');
INSERT INTO priorities (name, level, color)
  SELECT 'High', 2, '#D4A017' WHERE NOT EXISTS (SELECT 1 FROM priorities WHERE name = 'High');
INSERT INTO priorities (name, level, color)
  SELECT 'Medium', 3, '#6B7280' WHERE NOT EXISTS (SELECT 1 FROM priorities WHERE name = 'Medium');
INSERT INTO priorities (name, level, color)
  SELECT 'Low', 4, '#9AA0A6' WHERE NOT EXISTS (SELECT 1 FROM priorities WHERE name = 'Low');

-- บัญชี Admin ตั้งต้น
-- email: ponnsiphon@gmail.com · password: pn2811qp (hash ด้วย PBKDF2-SHA256 100k รอบ
-- ตรงกับ apps/web/src/lib/password.ts — ทดสอบ verify แล้วก่อนส่งไฟล์นี้)
-- ถ้า email นี้เคย login ด้วย Google มาก่อนแล้ว INSERT OR IGNORE จะข้าม แต่จะยัง
-- ไม่มี password_hash ให้ — กรณีนั้นให้รันคำสั่งนี้แยกแทน:
--   UPDATE users SET password_hash = '<hash ด้านล่าง>' WHERE email = 'ponnsiphon@gmail.com';
INSERT OR IGNORE INTO users (id, email, name, password_hash) VALUES (
  '6f286f5d-c7d0-44c3-8433-4979325be58f',
  'ponnsiphon@gmail.com',
  'สิภณ สถิตโภควาณิช',
  'HcL2/Xg+Ih/JQImyrYxHow==:MTJrqEqJq4t78SBehR3ZmJkU3PXnh2pDTMlXogUQZ4Q='
);

-- สิทธิ์ System Admin (มองเห็นทุกระบบ) + PMO (สิทธิ์เต็มในโมดูล PM)
INSERT OR IGNORE INTO system_roles (role_name, module, permissions) VALUES ('System Admin', 'GLOBAL', '{}');
INSERT OR IGNORE INTO system_roles (role_name, module, permissions) VALUES ('PMO', 'PM', '{}');

INSERT OR IGNORE INTO user_roles (user_id, role_id)
  SELECT u.id, r.id FROM users u, system_roles r
  WHERE u.email = 'ponnsiphon@gmail.com' AND r.role_name = 'System Admin' AND r.module = 'GLOBAL';

INSERT OR IGNORE INTO user_roles (user_id, role_id)
  SELECT u.id, r.id FROM users u, system_roles r
  WHERE u.email = 'ponnsiphon@gmail.com' AND r.role_name = 'PMO' AND r.module = 'PM';

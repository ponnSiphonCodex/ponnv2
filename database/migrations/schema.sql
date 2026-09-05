-- database/migrations/schema.sql — SQL รวมไฟล์เดียว (ห้าม PRAGMA), idempotent
-- วิธีรัน: D1 Console → วางทั้งไฟล์ → Ctrl+A ในกล่อง Query → Run

CREATE TABLE IF NOT EXISTS users ( id TEXT PRIMARY KEY, name TEXT, email TEXT NOT NULL UNIQUE, email_verified INTEGER, image TEXT, password_hash TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()) );
CREATE TABLE IF NOT EXISTS accounts ( user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL, provider TEXT NOT NULL, provider_account_id TEXT NOT NULL, refresh_token TEXT, access_token TEXT, expires_at INTEGER, token_type TEXT, scope TEXT, id_token TEXT, session_state TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), PRIMARY KEY (provider, provider_account_id) );
CREATE INDEX IF NOT EXISTS accounts_user_idx ON accounts(user_id);
CREATE TABLE IF NOT EXISTS sessions ( session_token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL );
CREATE TABLE IF NOT EXISTS system_roles ( id INTEGER PRIMARY KEY AUTOINCREMENT, role_name TEXT NOT NULL, module TEXT NOT NULL CHECK (module IN ('PM','RENTALS','GLOBAL')), permissions TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL );
CREATE TABLE IF NOT EXISTS user_roles ( id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role_id INTEGER NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL );
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_role_uniq ON user_roles(user_id, role_id);
CREATE TABLE IF NOT EXISTS themes ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL );
CREATE TABLE IF NOT EXISTS initiatives ( id INTEGER PRIMARY KEY AUTOINCREMENT, theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL );
CREATE TABLE IF NOT EXISTS requirements ( id INTEGER PRIMARY KEY AUTOINCREMENT, initiative_id INTEGER NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE, title TEXT NOT NULL, type TEXT, owner_id TEXT REFERENCES users(id) ON DELETE SET NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL );
CREATE TABLE IF NOT EXISTS priorities ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, level INTEGER NOT NULL, color TEXT );
CREATE TABLE IF NOT EXISTS products ( id INTEGER PRIMARY KEY AUTOINCREMENT, requirement_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE, name TEXT NOT NULL, status TEXT, priority_id INTEGER REFERENCES priorities(id) ON DELETE SET NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL );
CREATE TABLE IF NOT EXISTS projects ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, status TEXT, theme_id INTEGER REFERENCES themes(id) ON DELETE SET NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL );
CREATE TABLE IF NOT EXISTS features ( id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER REFERENCES products(id) ON DELETE SET NULL, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE, name TEXT NOT NULL, status TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL );
CREATE TABLE IF NOT EXISTS workflow_statuses ( id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE, name TEXT NOT NULL, color TEXT, category TEXT NOT NULL CHECK (category IN ('todo','doing','done')), sort_order INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL );
CREATE INDEX IF NOT EXISTS workflow_statuses_project_idx ON workflow_statuses(project_id);
CREATE TABLE IF NOT EXISTS tasks ( id INTEGER PRIMARY KEY AUTOINCREMENT, feature_id INTEGER NOT NULL REFERENCES features(id) ON DELETE CASCADE, assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL, title TEXT NOT NULL, workflow_status_id INTEGER NOT NULL REFERENCES workflow_statuses(id) ON DELETE RESTRICT, start_date INTEGER, due_date INTEGER, estimated_hours REAL, budget_cost REAL, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL );
CREATE INDEX IF NOT EXISTS tasks_feature_idx ON tasks(feature_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(workflow_status_id);
CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON tasks(assignee_id);
CREATE TABLE IF NOT EXISTS task_worklogs ( id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, work_date INTEGER NOT NULL, hours_spent REAL NOT NULL, note TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL );
CREATE INDEX IF NOT EXISTS task_worklogs_task_idx ON task_worklogs(task_id);
CREATE TABLE IF NOT EXISTS attachments ( id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL CHECK (entity_type IN ('task','project','feature','issue')), entity_id INTEGER NOT NULL, google_drive_file_id TEXT NOT NULL, file_name TEXT, file_url TEXT, uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch()) );
CREATE INDEX IF NOT EXISTS attachments_entity_idx ON attachments(entity_type, entity_id);

-- ========================= SEED DATA =========================

-- priorities
INSERT OR IGNORE INTO priorities (id, name, level, color) VALUES (1,'Critical',1,'#EC186E'),(2,'High',2,'#D4A017'),(3,'Medium',3,'#6B7280'),(4,'Low',4,'#9AA0A6');

-- system_roles (Admin=GLOBAL เห็นทุกเมนู)
INSERT OR IGNORE INTO system_roles (id, role_name, module) VALUES (1,'Admin','GLOBAL'),(2,'PMO','PM'),(3,'PM','PM'),(4,'Member','PM');

-- users (5 คน — 2 admin + 3 member ตัวอย่าง)
INSERT INTO users (id, name, email, password_hash) VALUES ('u-admin-ponnsth','Admin (Local)','admin@ponnsth.com','100000:c06ddce4df12fa9a36fbd46283897aba:f1cf10ea3c4bfa5734a35cf7116a1f67f07ea87bfa1e8a2aec2890a63e76287b') ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash;
INSERT INTO users (id, name, email, password_hash) VALUES ('u-ponnsiphon','Ponn STH','ponnsiphon@gmail.com','100000:daca21d51faa4bb33df1e64c89bcc1a6:bdf65982b7a605f19d8829622e5d4933b05a8832e4a6f8b52e4a644a179708ac') ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash;
INSERT OR IGNORE INTO users (id, name, email) VALUES ('u-somchai','สมชาย ใจดี','somchai@viriyah.co.th');
INSERT OR IGNORE INTO users (id, name, email) VALUES ('u-suda','สุดา วิริยะ','suda@viriyah.co.th');
INSERT OR IGNORE INTO users (id, name, email) VALUES ('u-nattapong','ณัฐพงษ์ พัฒนา','nattapong@viriyah.co.th');

-- assign roles: ponnsiphon=Admin+PMO, admin@ponnsth=Admin, somchai=PM, suda=Member, nattapong=Member
INSERT OR IGNORE INTO user_roles (user_id, role_id) SELECT id,1 FROM users WHERE email='ponnsiphon@gmail.com';
INSERT OR IGNORE INTO user_roles (user_id, role_id) SELECT id,2 FROM users WHERE email='ponnsiphon@gmail.com';
INSERT OR IGNORE INTO user_roles (user_id, role_id) SELECT id,1 FROM users WHERE email='admin@ponnsth.com';
INSERT OR IGNORE INTO user_roles (user_id, role_id) SELECT id,3 FROM users WHERE email='somchai@viriyah.co.th';
INSERT OR IGNORE INTO user_roles (user_id, role_id) SELECT id,4 FROM users WHERE email='suda@viriyah.co.th';
INSERT OR IGNORE INTO user_roles (user_id, role_id) SELECT id,4 FROM users WHERE email='nattapong@viriyah.co.th';

-- themes (2)
INSERT OR IGNORE INTO themes (id, name, description) VALUES (1,'Digital Transformation','ยกระดับกระบวนการทำงานด้วยดิจิทัล'),(2,'Customer Experience','ปรับปรุงประสบการณ์ลูกค้า');

-- projects (5 ตัวอย่าง)
INSERT OR IGNORE INTO projects (id, name, status, theme_id) VALUES
  (1,'PM Platform Rollout','in_progress',1),
  (2,'CRM Modernization','in_progress',2),
  (3,'Data Warehouse Migration','planning',1),
  (4,'Mobile App Revamp','in_progress',2),
  (5,'AI Chatbot Pilot','planning',1);

-- workflow_statuses (project 1 มี 3 คอลัมน์ + project 2 มี 3 คอลัมน์)
INSERT OR IGNORE INTO workflow_statuses (id, project_id, name, category, sort_order) VALUES
  (1,1,'To Do','todo',1),(2,1,'Doing','doing',2),(3,1,'Done','done',3),
  (4,2,'To Do','todo',1),(5,2,'Doing','doing',2),(6,2,'Done','done',3);

-- initiatives + requirements + products + features (ให้มี task ผูกได้)
INSERT OR IGNORE INTO initiatives (id, theme_id, name) VALUES (1,1,'Core Platform'),(2,2,'CRM Core');
INSERT OR IGNORE INTO requirements (id, initiative_id, title, type) VALUES (1,1,'ระบบจัดการงาน','Functional'),(2,2,'ระบบลูกค้า','Functional');
INSERT OR IGNORE INTO products (id, requirement_id, name, status, priority_id) VALUES (1,1,'PM Web App','active',2),(2,2,'CRM Web App','active',1);
INSERT OR IGNORE INTO features (id, product_id, project_id, name, status) VALUES
  (1,1,1,'Kanban Board','active'),
  (2,1,1,'Reporting','active'),
  (3,2,2,'Customer 360','active');

-- tasks (6 ตัวอย่าง กระจายตามคอลัมน์)
INSERT OR IGNORE INTO tasks (id, feature_id, assignee_id, title, workflow_status_id, estimated_hours) VALUES
  (1,1,'u-somchai','ออกแบบ Data Schema',3,8),
  (2,1,'u-suda','ทำ UI หน้า Login',3,6),
  (3,1,'u-nattapong','เชื่อมต่อ Google OAuth',2,10),
  (4,2,'u-somchai','ทำหน้า Dashboard',2,12),
  (5,2,'u-suda','ทำ Export รายงาน',1,5),
  (6,3,'u-nattapong','ออกแบบหน้า Customer 360',4,9);

-- task_worklogs (5 ตัวอย่าง — ให้ actual hours มีค่า)
INSERT OR IGNORE INTO task_worklogs (id, task_id, user_id, work_date, hours_spent, note) VALUES
  (1,1,'u-somchai',unixepoch(),8,'เสร็จ schema หลัก'),
  (2,2,'u-suda',unixepoch(),6,'UI login เสร็จ'),
  (3,3,'u-nattapong',unixepoch(),4,'ตั้งค่า OAuth client'),
  (4,4,'u-somchai',unixepoch(),5,'วาง layout dashboard'),
  (5,3,'u-nattapong',unixepoch(),3,'debug callback');

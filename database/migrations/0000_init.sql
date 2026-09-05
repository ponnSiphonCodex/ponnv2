-- database/migrations/0000_init.sql
PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY, name TEXT, email TEXT NOT NULL UNIQUE, email_verified INTEGER, image TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE accounts (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL, provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL, refresh_token TEXT, access_token TEXT, expires_at INTEGER, token_type TEXT,
  scope TEXT, id_token TEXT, session_state TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (provider, provider_account_id)
);
CREATE INDEX accounts_user_idx ON accounts(user_id);

CREATE TABLE sessions (
  session_token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL
);

CREATE TABLE verification_tokens (
  identifier TEXT NOT NULL, token TEXT NOT NULL, expires INTEGER NOT NULL, PRIMARY KEY (identifier, token)
);

CREATE TABLE system_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT, role_name TEXT NOT NULL, module TEXT NOT NULL CHECK (module IN ('PM','RENTALS','GLOBAL')),
  permissions TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX user_roles_user_role_uniq ON user_roles(user_id, role_id);

CREATE TABLE themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE initiatives (
  id INTEGER PRIMARY KEY AUTOINCREMENT, theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT, initiative_id INTEGER NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  title TEXT NOT NULL, type TEXT, owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE priorities (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, level INTEGER NOT NULL, color TEXT
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT, requirement_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  name TEXT NOT NULL, status TEXT, priority_id INTEGER REFERENCES priorities(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, status TEXT, theme_id INTEGER REFERENCES themes(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE features (
  id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE, name TEXT NOT NULL, status TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE workflow_statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL, color TEXT, category TEXT NOT NULL CHECK (category IN ('todo','doing','done')), sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX workflow_statuses_project_idx ON workflow_statuses(project_id);

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT, feature_id INTEGER NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL, title TEXT NOT NULL,
  workflow_status_id INTEGER NOT NULL REFERENCES workflow_statuses(id) ON DELETE RESTRICT,
  start_date INTEGER, due_date INTEGER, estimated_hours REAL, budget_cost REAL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX tasks_feature_idx ON tasks(feature_id);
CREATE INDEX tasks_status_idx ON tasks(workflow_status_id);
CREATE INDEX tasks_assignee_idx ON tasks(assignee_id);

CREATE TABLE custom_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL CHECK (entity_type IN ('task','project','feature')),
  field_name TEXT NOT NULL, field_type TEXT NOT NULL CHECK (field_type IN ('text','number','date','select','checkbox')), field_options TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE custom_field_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT, custom_field_id INTEGER NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_id INTEGER NOT NULL, value TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX custom_field_values_field_entity_uniq ON custom_field_values(custom_field_id, entity_id);
CREATE INDEX custom_field_values_entity_idx ON custom_field_values(entity_id);

CREATE TABLE task_worklogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, work_date INTEGER NOT NULL, hours_spent REAL NOT NULL, note TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX task_worklogs_task_idx ON task_worklogs(task_id);

CREATE TABLE issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE risks (
  id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT,
  probability TEXT NOT NULL DEFAULT 'medium' CHECK (probability IN ('low','medium','high')),
  impact TEXT NOT NULL DEFAULT 'medium' CHECK (impact IN ('low','medium','high')),
  mitigation_plan TEXT, owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL CHECK (entity_type IN ('task','project','feature','issue','risk')),
  entity_id INTEGER NOT NULL, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX comments_entity_idx ON comments(entity_type, entity_id);

CREATE TABLE activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL, entity_id INTEGER NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL, action TEXT NOT NULL,
  field_changed TEXT, old_value TEXT, new_value TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX activity_logs_entity_idx ON activity_logs(entity_type, entity_id);

CREATE TABLE attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL CHECK (entity_type IN ('task','project','feature','issue')),
  entity_id INTEGER NOT NULL, google_drive_file_id TEXT NOT NULL, file_name TEXT,
  uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX attachments_entity_idx ON attachments(entity_type, entity_id);

INSERT INTO priorities (name, level, color) VALUES
  ('Critical', 1, '#EC186E'), ('High', 2, '#D4A017'), ('Medium', 3, '#6B7280'), ('Low', 4, '#9AA0A6');

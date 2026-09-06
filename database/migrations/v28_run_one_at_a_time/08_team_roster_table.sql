CREATE TABLE IF NOT EXISTS team_roster (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, responsibility TEXT,
  pm_role TEXT, project_id INTEGER, product_id INTEGER, owner_user_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================
-- v26_production_safe.sql — PRODUCTION SAFE (โครงสร้างเท่านั้น)
-- ⚠️ ไม่มี DROP/DELETE — รันบน Production ได้ ไม่ลบข้อมูล
-- D1 Console: วางทั้งไฟล์ → Run  (ถ้าขึ้น "duplicate column" = มีแล้ว ข้ามได้)
-- ============================================================
ALTER TABLE meetings ADD COLUMN start_time TEXT;
ALTER TABLE meetings ADD COLUMN organizer TEXT;
ALTER TABLE meetings ADD COLUMN attendees TEXT;
ALTER TABLE meetings ADD COLUMN project_name TEXT;
CREATE INDEX IF NOT EXISTS meetings_date_idx ON meetings(meeting_date);
CREATE INDEX IF NOT EXISTS attachments_meeting_idx ON attachments(reference_type, reference_id);

-- ===== v27: Working Team roster (คนที่ไม่ login) + per-user hidden list =====
CREATE TABLE IF NOT EXISTS team_roster (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  responsibility TEXT,
  pm_role TEXT,
  project_id INTEGER,
  product_id INTEGER,
  owner_user_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS team_hidden (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  viewer_id TEXT NOT NULL,
  target_kind TEXT NOT NULL,
  target_id TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS team_hidden_uniq ON team_hidden(viewer_id, target_kind, target_id);
CREATE INDEX IF NOT EXISTS team_roster_owner_idx ON team_roster(owner_user_id);

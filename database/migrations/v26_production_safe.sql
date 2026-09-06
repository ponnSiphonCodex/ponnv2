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

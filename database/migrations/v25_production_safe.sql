-- ============================================================
-- v25_production_safe.sql  —  PRODUCTION SAFE (โครงสร้างเท่านั้น)
-- ⚠️ ห้ามมี DROP / DELETE / TRUNCATE  — รันบน Production ได้ ไม่ลบข้อมูล
-- รันใน D1 Console: วางทั้งไฟล์ → Ctrl+A → Run
-- ทุกคำสั่ง idempotent: รันซ้ำได้ ถ้ามีอยู่แล้วจะข้าม (จะขึ้น error "duplicate column" ให้ข้ามได้)
-- ============================================================

-- meetings: เพิ่มคอลัมน์รองรับ Calendar View + Rich Text + organizer
-- (ถ้าคอลัมน์มีอยู่แล้ว SQLite จะ error "duplicate column name" — ข้ามได้ปลอดภัย)
ALTER TABLE meetings ADD COLUMN start_time TEXT;
ALTER TABLE meetings ADD COLUMN organizer TEXT;

-- index ช่วย query ปฏิทิน (IF NOT EXISTS ปลอดภัย)
CREATE INDEX IF NOT EXISTS meetings_date_idx ON meetings(meeting_date);
CREATE INDEX IF NOT EXISTS attachments_meeting_idx ON attachments(reference_type, reference_id);

-- scope lookup (ถ้ายังไม่มีจาก v21)
CREATE INDEX IF NOT EXISTS product_owners_user_idx ON product_owners(user_id);
CREATE INDEX IF NOT EXISTS project_managers_user_idx ON project_managers(user_id);

-- หมายเหตุ: ไม่มีการลบตาราง/ข้อมูลใด ๆ ทั้งสิ้น

-- database/migrations/0001_add_password.sql
-- เพิ่มคอลัมน์ password_hash ให้ตาราง users (รองรับ Login แบบอีเมล+รหัสผ่าน)
-- วิธีใช้: วางในกล่อง Console ของ D1 Dashboard (Cloudflare) แล้วกด Ctrl+A เลือกทั้งหมดก่อน Run

ALTER TABLE users ADD COLUMN password_hash TEXT;

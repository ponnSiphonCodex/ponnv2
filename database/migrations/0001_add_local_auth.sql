-- database/migrations/0001_add_local_auth.sql
-- เพิ่มคอลัมน์ password_hash ให้ตาราง users ที่มีอยู่แล้ว (ไม่ใช่สร้างตารางใหม่)
-- ใช้เมื่อ D1 database เดิมรันไฟล์ 0000_init.sql ไปแล้ว
--
-- วิธีใช้: Cloudflare Dashboard > Workers & Pages > D1 > (เลือก ponn_platform) > Console
-- วาง SQL นี้ทั้งหมด (Ctrl+A ในกล่อง Query ก่อน) แล้วกด Execute/Run

ALTER TABLE users ADD COLUMN password_hash TEXT;

-- ตัวอย่าง: สร้าง local user ทดสอบ 1 คน (email: admin@ponnsth.com, password: Ponnsth@2026)
-- password_hash ด้านล่างคำนวณไว้ล่วงหน้าด้วย PBKDF2-SHA256 (100,000 รอบ) ให้ตรงกับโค้ดใน
-- apps/web/src/lib/password.ts พอดี — ถ้าต้องการเปลี่ยนรหัสผ่าน ให้ดูวิธี generate hash ใหม่
-- ใน DEPLOY_GUIDE_GUI.md หัวข้อ "สร้าง Local User เพิ่ม"

-- ใช้ ON CONFLICT เผื่อ email นี้มีอยู่แล้ว (เช่น เคย login ผ่าน Google มาก่อน) จะได้แค่
-- "เติม" password_hash เข้าไปในบัญชีเดิม แทนที่จะ error ว่า email ซ้ำ
INSERT INTO users (id, name, email, password_hash)
VALUES (
  lower(hex(randomblob(16))),
  'Admin (Local)',
  'admin@ponnsth.com',
  '100000:c06ddce4df12fa9a36fbd46283897aba:f1cf10ea3c4bfa5734a35cf7116a1f67f07ea87bfa1e8a2aec2890a63e76287b'
)
ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash;

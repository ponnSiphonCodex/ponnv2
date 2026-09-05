-- database/migrations/0001_add_local_auth.sql
-- ใช้เฉพาะกรณี database เดิมรัน 0000_init.sql เวอร์ชันก่อนหน้าที่ไม่มีคอลัมน์ password_hash ไปแล้ว
-- ถ้าสร้าง database ใหม่ด้วย 0000_init.sql ชุดล่าสุด (มี password_hash อยู่แล้ว) ข้ามไฟล์นี้ได้เลย

ALTER TABLE users ADD COLUMN password_hash TEXT;

INSERT INTO users (id, name, email, password_hash)
VALUES (
  lower(hex(randomblob(16))),
  'Admin (Local)',
  'admin@ponnsth.com',
  '100000:c06ddce4df12fa9a36fbd46283897aba:f1cf10ea3c4bfa5734a35cf7116a1f67f07ea87bfa1e8a2aec2890a63e76287b'
)
ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash;

-- database/migrations/0002_seed_local_user.sql
-- ใช้เมื่อสร้าง database ใหม่จาก 0000_init.sql ชุดล่าสุด (มี password_hash แล้ว)
-- แค่ต้องการ insert local user ทดสอบ 1 คน ไม่ต้อง ALTER TABLE

INSERT INTO users (id, name, email, password_hash)
VALUES (
  lower(hex(randomblob(16))),
  'Admin (Local)',
  'admin@ponnsth.com',
  '100000:c06ddce4df12fa9a36fbd46283897aba:f1cf10ea3c4bfa5734a35cf7116a1f67f07ea87bfa1e8a2aec2890a63e76287b'
)
ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash;

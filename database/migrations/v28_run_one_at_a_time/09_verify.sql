-- ตรวจว่าคอลัมน์/ตารางครบ (ดูผลลัพธ์ — ต้องเห็นครบตามชื่อ)
SELECT name FROM pragma_table_info('meetings')
WHERE name IN ('start_time','organizer','attendees','project_name','project_ids','product_ids');

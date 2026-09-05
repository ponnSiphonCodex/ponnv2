# Portfolio Workspace — v17 (Sidebar UI + Admin + Role Management)

## ใหม่ในเวอร์ชันนี้
- **Sidebar แบบ Hamburger** — กดย่อเหลือไอคอน / กดขยายเห็นไอคอน+ชื่อ (จำสถานะใน localStorage)
- **เมนู**: แดชบอร์ด, กระดานงาน, โครงการ, ผู้ใช้งาน&สิทธิ์ (admin), ตั้งค่าระบบ (admin)
- **Admin user เพิ่ม**: ponnsiphon@gmail.com / pn2811qp → Admin + PMO (เห็นทุกเมนู)
- **จัดการ Role**: หน้า "ผู้ใช้งาน & สิทธิ์" กดปุ่ม role เพื่อเพิ่ม/ถอนสิทธิ์ให้ใครก็ได้

## Login
- admin@ponnsth.com / Ponnsth@2026 (Admin)
- ponnsiphon@gmail.com / pn2811qp (Admin + PMO)

## ⚠️ Google invalid_client — เป็นปัญหาฝั่ง Google ไม่ใช่โค้ด
error "OAuth client was not found" = client_id/secret ไม่ตรงกับที่มีจริงใน Google Cloud
เช็ค: (1) Client Secret ถูก Reset ไปหรือยัง → ถ้าใช่ ต้องเอาค่าใหม่มาใส่ wrangler.jsonc
      (2) OAuth client ยังมีอยู่จริงใน project เดิมไหม
ระหว่างนี้ใช้ Local login (email+password) เทสได้เต็มที่

## Roles
Admin(GLOBAL)=เห็นทุกเมนู, PMO/PM/Member(PM). แก้ role ผ่านหน้า Team ได้

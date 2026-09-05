# คู่มืออัปเดต (v6) — แก้หน้า Login (ไม่ scroll) + เพิ่ม Favicon/โลโก้จรวด

ระบบ deploy สำเร็จแล้ว 🎉 รอบนี้เป็นแค่การอัปเดตไฟล์เพิ่ม ไม่ต้องสร้าง Worker ใหม่

## สิ่งที่แก้ในรอบนี้

1. **หน้า login สูงเกิน 100vh ต้อง scroll** → แก้เป็น `height: 100dvh` + `overflow: hidden`
   (ใช้ dvh แทน vh ธรรมดา แม่นยำกว่าบนมือถือที่มี browser address bar)
2. **Favicon + โลโก้จรวด** → เพิ่มไฟล์ภาพจรวด 4 ไฟล์ใหม่ (ดูรายละเอียดใน README หัวข้อ 3)

---

## วิธีอัปเดต — ใช้ GitHub Desktop (เหมือนที่เคยตั้งไว้)

เนื่องจากมีไฟล์ภาพ (.png, .ico) ปนมาด้วยรอบนี้ **ห้ามใช้วิธีสร้างไฟล์ผ่านเว็บ GitHub แบบพิมพ์โค้ด**
(ใช้ได้แค่กับไฟล์ text เท่านั้น ไฟล์ภาพต้องอัปโหลดแบบไฟล์จริง) แนะนำ GitHub Desktop ที่ตั้งไว้แล้ว:

1. เปิดโปรแกรม **GitHub Desktop** → เลือก repo `ponnv2` ที่ clone ไว้ (path เดิม `C:\ponnv2` หรือที่เคยตั้งไว้)
2. ดาวน์โหลด + แตกไฟล์ zip ใหม่ที่แนบมา (ยังคงตั้งชื่อสั้นเพื่อกัน path length เหมือนเดิม — แตกที่ `C:\pm2` หรือโฟลเดอร์สั้นๆ)
3. เปิด File Explorer 2 หน้าต่าง: โฟลเดอร์ที่แตก zip ใหม่ กับ `C:\ponnv2` (repo เดิม)
4. คัดลอกไฟล์ทั้งหมดจากโฟลเดอร์ที่แตกใหม่ → วางทับใน `C:\ponnv2` (ยืนยัน "Replace" ถ้า Windows ถาม)
5. เปิด GitHub Desktop → จะเห็นรายการไฟล์ที่เปลี่ยนแปลง (ไฟล์ .tsx ที่แก้ + ไฟล์ .png/.ico ใหม่ 4 ไฟล์)
6. ใส่ commit message เช่น "add favicon + fix login page height" → **Commit to main**
7. คลิก **Push origin**

---

## เช็คว่าไฟล์ภาพอัปโหลดขึ้นจริง (สำคัญ)

ก่อน push ให้เปิด GitHub Desktop ดูที่แท็บ **Changed files** (ซ้ายมือ) ต้องเห็นไฟล์เหล่านี้ขึ้นเป็น
"Added" (เครื่องหมาย + สีเขียว):

```
apps/web/src/app/icon.png
apps/web/src/app/apple-icon.png
apps/web/src/app/favicon.ico
apps/web/public/rocket-logo.png
```

ถ้าไม่เห็น 4 ไฟล์นี้ในลิสต์ = ไฟล์ยังไม่ถูกคัดลอกไปวางใน `C:\ponnv2` ให้กลับไปทำ STEP 4 ใหม่

---

## Retry Build

Push เสร็จแล้ว Cloudflare จะ build ให้อัตโนมัติภายใน 1 นาที เข้า Dashboard → Worker `pm-platform-web`
→ Deployments เช็คว่าสถานะเปลี่ยนเป็น success (ไม่ต้องกด Retry เอง ถ้า auto-deploy ทำงาน)

## ทดสอบ

| # | ทำอะไร | ผลที่ควรได้ |
|---|---|---|
| 1 | เปิดแท็บใหม่ที่ URL เว็บ (Incognito จะชัวร์กว่า กัน cache เก่า) | หน้า login พอดีจอ ไม่มี scrollbar |
| 2 | ดูที่แท็บเบราว์เซอร์ (tab title bar) | เห็นไอคอนจรวดแทนไอคอน default |
| 3 | บนมือถือ ลอง "Add to Home Screen" | ไอคอนจรวดขึ้นเป็นไอคอนแอป |

⚠️ **Favicon มัก cache ฝั่ง browser นาน** — ถ้า deploy สำเร็จแล้วแต่ยังเห็นไอคอนเดิม ให้ลอง:
- Hard refresh: `Ctrl+Shift+R`
- หรือเปิด Incognito/Private window ใหม่
- หรือรอสัก 5-10 นาทีให้ CDN cache หมดอายุ

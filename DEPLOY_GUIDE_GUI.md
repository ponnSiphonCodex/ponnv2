# คู่มือ Deploy (v5) — แก้ปัญหา Windows Path Length

## 🔍 Root cause ที่แท้จริง (พบหลังไล่ debug 4 รอบ)

ทุกรอบที่ผ่านมา `apps/web/src/app` หายไปหลัง extract zip — สาเหตุคือ **Windows จำกัดความยาว
path รวมไว้ที่ 260 ตัวอักษร (MAX_PATH)** พอ:

```
C:\Users\<ชื่อ>\Downloads\20260905_1550_pm-platform-v4\apps\web\src\app\api\auth\[...nextauth]\route.ts
```

รวมกันยาวเกิน 260 ตัวอักษร **Windows จะข้ามไฟล์นั้นไปเงียบ ๆ ตอน "Extract All" โดยไม่มี error
เตือนเลย** — อธิบายได้ว่าทำไม `apps/api` (path สั้นกว่า ไม่มีวงเล็บ) ไม่เคยมีปัญหา แต่ `apps/web/src`
หายทุกรอบไม่ว่าจะแก้โค้ดยังไง

## ✅ สิ่งที่แก้ในโค้ดชุดนี้

- ตัดโฟลเดอร์วงเล็บ `[projectId]` ออก → เปลี่ยนเป็น query param `/pm/board?id=1`
- เหลือโฟลเดอร์วงเล็บแค่ 1 ที่เดียวที่เลี่ยงไม่ได้: `[...nextauth]` (Auth.js บังคับ)
- **zip ไฟล์นี้ตั้งชื่อสั้นเป็นพิเศษ** เพื่อไม่ให้ path ยาวเกินตั้งแต่ต้น

---

## STEP A — แตกไฟล์แบบ path สั้นที่สุด (ทำตามนี้เป๊ะ ๆ)

1. เปิด File Explorer → ไปที่ไดรฟ์ **C:** โดยตรง
2. คลิกขวาพื้นที่ว่าง → **New → Folder** → ตั้งชื่อ **`pm`** (สั้นที่สุด) → จะได้ `C:\pm`
3. ดาวน์โหลดไฟล์ zip ที่แนบมา (ชื่อไฟล์สั้น) → ย้ายไฟล์ zip นั้นไปไว้ใน `C:\pm` ก่อน (ลาก/ตัดวาง)
4. คลิกขวาไฟล์ zip ใน `C:\pm` → **Extract All...**
5. ในหน้าต่างที่ขึ้นมา **ลบข้อความ path เดิมออกให้หมด** แล้วพิมพ์แค่ `C:\pm` แทน (ไม่ต้องให้มันสร้างโฟลเดอร์ย่อยเพิ่ม)
6. กด **Extract**

### ✅ เช็คผลทันที (สำคัญมาก ทำก่อนไปขั้นต่อไป)
เปิด File Explorer → คลิกที่แถบ address bar ด้านบน (ที่โชว์ path) → พิมพ์ทับด้วย:
```
C:\pm\apps\web\src\app\api\auth\[...nextauth]
```
→ กด Enter

- **ถ้าเจอไฟล์ `route.ts`** → ผ่าน ไปทำ STEP B ต่อได้เลย
- **ถ้า Explorer ขึ้นว่าง/หาไม่เจอ** → แปลว่า path ยังยาวไปอยู่ (เช่น username ยาว) ให้ลองสร้าง
  โฟลเดอร์ที่ `D:\pm` แทน (ถ้ามีไดรฟ์ D:) หรือแจ้งกลับมาว่าเจอปัญหานี้ จะช่วยหาทางแก้เพิ่ม

---

## STEP B — อัปโหลดขึ้น GitHub ผ่าน GitHub Desktop (เสถียรที่สุด)

เมื่อไฟล์อยู่ครบใน `C:\pm` แล้ว การอัปโหลดจะไม่มีปัญหาอีกต่อไป ไม่ว่าจะใช้วิธีไหน แต่แนะนำ
GitHub Desktop เพราะแม่นยำกว่าเว็บ:

1. ดาวน์โหลด https://desktop.github.com → ติดตั้ง → Sign in ด้วยบัญชี GitHub เดิม
2. **File → Clone repository** → เลือก repo `ponnv2` → เลือก path clone เป็น `C:\ponnv2` (สั้นเช่นกัน) → Clone
3. เปิด File Explorer 2 หน้าต่าง: `C:\pm` (ไฟล์ใหม่) กับ `C:\ponnv2` (repo ที่ clone มา)
4. ใน `C:\ponnv2` **ลบทุกไฟล์/โฟลเดอร์ข้างในออกให้หมด** (ยกเว้นโฟลเดอร์ `.git` ที่อาจซ่อนอยู่ — ถ้าไม่เห็นไม่ต้องไปยุ่ง)
5. เปิดโฟลเดอร์ `C:\pm` → Ctrl+A เลือกทุกอย่างข้างใน → Copy (Ctrl+C)
6. วางใน `C:\ponnv2` (Ctrl+V)
7. เปิดโปรแกรม GitHub Desktop → จะเห็นรายการไฟล์เปลี่ยนแปลงขึ้นอัตโนมัติทางซ้าย
8. ใส่ข้อความ commit ด้านล่างซ้าย (เช่น "fix path length issue") → **Commit to main**
9. คลิก **Push origin** ด้านบน

---

## STEP C — Retry Build

Cloudflare Dashboard → Worker `pm-platform-web` → **Deployments** → รอ auto-deploy (จาก push ใหม่)
หรือกด **Retry build** เอง

---

## STEP D — ทดสอบ

| # | ทำอะไร | ผลที่ควรได้ |
|---|---|---|
| 1 | `https://ponnv2.ponnsiphon.workers.dev/health` | `{"status":"ok"}` |
| 2 | เปิด URL ของ `pm-platform-web` | redirect ไป `/login` |
| 3 | Login ด้วย Google | ไป `/` → `/pm` → **`/pm/board?id=1`** |
| 4 | หน้า board ขึ้น "ไม่พบ Project" | ปกติ ยังไม่มีข้อมูล → ทำ STEP E |

## STEP E — ใส่ข้อมูลทดสอบ

D1 Dashboard → `ponn_platform` → Console → วาง (Ctrl+A ก่อน Run):
```sql
INSERT INTO themes (name) VALUES ('Digital Transformation');
INSERT INTO projects (name, status, theme_id) VALUES ('PM Platform Rollout', 'in_progress', 1);
INSERT INTO workflow_statuses (project_id, name, category, sort_order) VALUES
  (1,'To Do','todo',1),(1,'Doing','doing',2),(1,'Done','done',3);
```

---

## Troubleshooting

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| `Couldn't find any pages or app directory` (ซ้ำอีก) | ยังแตก zip ที่ path ยาวอยู่ | ทำ STEP A ใหม่ให้เป๊ะ ตรวจด้วย address bar ก่อนอัปโหลด |
| Explorer หา `[...nextauth]` ไม่เจอแม้แตกที่ `C:\pm` แล้ว | username/computer name ยาวผิดปกติ หรือมี OneDrive sync path แทรก | ลองปิด OneDrive sync ชั่วคราว หรือแตกที่ `D:\pm` แทน |
| Push จาก GitHub Desktop แล้วไม่เห็น build ใหม่ | Worker ยังไม่ auto-deploy | เข้า Cloudflare Dashboard กด Retry build เอง |

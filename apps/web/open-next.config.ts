// apps/web/open-next.config.ts
// ไฟล์ config บังคับของ @opennextjs/cloudflare (ดู https://opennext.js.org/cloudflare)
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // ใช้ default (ไม่มี incremental cache ข้าม request) เพียงพอสำหรับ scaffold นี้
  // เพิ่ม R2 incremental cache ได้ภายหลังถ้าต้องการ ISR/ full caching ดู docs ด้านบน
});

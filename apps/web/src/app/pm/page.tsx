/**
 * apps/web/src/app/pm/page.tsx
 * หน้าแรกของระบบ PM — redirect ไปที่ Kanban board ของ Project id=1
 * ใส่ force-dynamic กัน prerender เผื่อไว้ (redirect ควรเกิดตอน request จริง)
 */
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function PmHomePage() {
  redirect("/pm/board?id=1");
}

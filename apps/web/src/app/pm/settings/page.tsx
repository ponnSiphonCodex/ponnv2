import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const a = await requireAuth(); if (!a) redirect("/login"); if (!a.admin) redirect("/pm/dashboard");
  return (
    <AppShell active="settings" {...shellProps(a)}>
      <PageHeader title="อัปโหลด & ระบบ" subtitle="ข้อมูลระบบสำหรับผู้ดูแล" />
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ marginTop: 0, color: "#001D58" }}>ข้อมูลระบบ</h3>
          <p style={{ fontSize: 14, color: "#374151" }}>ผู้ใช้: {a.user.email}<br />สิทธิ์: {a.roleLabel}</p>
          <p style={{ fontSize: 13, color: "#6B7280" }}>ตรวจสอบ env/config ได้ที่ <a href="/api/debug" target="_blank" style={{ color: "#EC186E" }}>/api/debug</a></p>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ marginTop: 0, color: "#001D58" }}>Telegram แจ้งเตือน</h3>
          <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.8 }}>Bot Token + Admin Chat ID ตั้งใน Cloudflare Secret:<br /><code style={{ background: "#F4F4F6", padding: "1px 6px", borderRadius: 4 }}>TELEGRAM_BOT_TOKEN</code>, <code style={{ background: "#F4F4F6", padding: "1px 6px", borderRadius: 4 }}>TELEGRAM_ADMIN_CHAT_ID</code><br />ผู้ใช้ตั้ง Telegram User ID เองในหน้าโปรไฟล์ และเปิด Toggle รับแจ้งเตือน</p>
        </div>
      </div>
    </AppShell>
  );
}

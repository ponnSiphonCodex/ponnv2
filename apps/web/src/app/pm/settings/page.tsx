import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { FileUpload } from "@/components/file-upload";
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const auth = await requireAuth();
  if (!auth) redirect("/login");
  if (!auth.admin) redirect("/pm/dashboard");
  return (
    <AppShell active="settings" user={auth.user} isAdmin={auth.admin} roleLabel={auth.roleLabel}>
      <PageHeader title="ตั้งค่าระบบ" subtitle="สำหรับผู้ดูแลระบบ" />
      <div style={{ padding: 28, maxWidth: 640 }}>
        <section style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 20 }}>
          <h3 style={{ marginTop: 0, color: "#001D58" }}>ทดสอบอัปโหลดไฟล์ → Google Drive</h3>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>อัปโหลดผ่าน Google Apps Script (ตั้งค่า URL ใน lib/upload.ts)</p>
          <FileUpload />
        </section>
        <section style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h3 style={{ marginTop: 0, color: "#001D58" }}>ข้อมูลระบบ</h3>
          <p style={{ fontSize: 13, color: "#6B7280" }}>ผู้ใช้: {auth.user.email}<br/>สิทธิ์: {auth.roleLabel}</p>
        </section>
      </div>
    </AppShell>
  );
}

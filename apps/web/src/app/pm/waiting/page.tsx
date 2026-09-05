import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell } from "@/components/app-shell";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
export default async function WaitingPage() {
  const a = await requireAuth(); if (!a) redirect("/login");
  if (!a.guest) redirect("/pm/dashboard");
  return (
    <AppShell active="" {...shellProps(a)}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80dvh", padding: 24 }}>
        <div className="card" style={{ padding: 40, maxWidth: 480, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <h2 style={{ color: "#001D58", margin: "0 0 10px" }}>รอเปิดสิทธิ์ใช้งาน</h2>
          <p style={{ color: "#6B7280", lineHeight: 1.7 }}>บัญชีของคุณเข้าสู่ระบบสำเร็จแล้ว แต่ยังไม่ได้รับสิทธิ์ใช้งาน<br />กรุณารอให้ผู้ดูแลเพิ่มชื่อของคุณ หรือติดต่อ <b>ponnSTH@gmail.com</b> เพื่อเริ่มใช้งานครั้งแรก</p>
          <p style={{ color: "#9AA0A6", fontSize: 13, marginTop: 16 }}>คุณสามารถกดที่รูปโปรไฟล์ (มุมซ้ายล่าง) เพื่อแก้ไขข้อมูลส่วนตัวได้</p>
        </div>
      </div>
    </AppShell>
  );
}

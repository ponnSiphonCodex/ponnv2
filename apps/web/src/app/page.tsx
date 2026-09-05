import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/db";
import { getCurrentUser } from "@/lib/current-user";
import { getUserModules } from "@/lib/board-data";
export const dynamic = "force-dynamic";
export default async function HomePage() {
  const { env } = await getCloudflareContext({ async: true });
  const user = await getCurrentUser(env.AUTH_SECRET);
  if (!user) redirect("/login");
  const db = createDb(env.DB);
  const modules = await getUserModules(db, user.sub);
  if (modules.length === 0 || (modules.length === 1 && modules[0] === "PM")) redirect("/pm");
  return (
    <main style={{ padding: 48, background: "#F4F4F6", minHeight: "100vh" }}>
      <h1 style={{ color: "#001D58", marginBottom: 8 }}>ระบบของคุณ</h1>
      <p style={{ color: "#6B7280", marginBottom: 32 }}>เลือกระบบที่ต้องการเข้าใช้งาน</p>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {modules.includes("PM") && (<a href="/pm" style={{ display: "block", width: 260, padding: 24, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", textDecoration: "none", color: "#111827", borderTop: "4px solid #001D58" }}><h3 style={{ margin: 0, color: "#001D58" }}>PM & Portfolio</h3><p style={{ margin: "8px 0 0", fontSize: 14, color: "#6B7280" }}>Project Management &amp; Portfolio</p></a>)}
        {modules.includes("RENTALS") && (<a href="https://rentals.ponnsth.com" style={{ display: "block", width: 260, padding: 24, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", textDecoration: "none", color: "#111827", borderTop: "4px solid #EC186E" }}><h3 style={{ margin: 0, color: "#EC186E" }}>Rentals Management</h3><p style={{ margin: "8px 0 0", fontSize: 14, color: "#6B7280" }}>ระบบบริหารหอพัก (ระบบภายนอก)</p></a>)}
      </div>
    </main>
  );
}

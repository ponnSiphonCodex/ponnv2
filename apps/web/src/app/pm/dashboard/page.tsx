import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { dashboardStats, listProjects } from "@/lib/board-data";
import { visibleProjectIds } from "@/lib/access";
import { AppShell, PageHeader } from "@/components/app-shell";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
const NAVY = "#001D58";
export default async function DashboardPage() {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  const ids = await visibleProjectIds(a.d1, a.scope);
  const stats = await dashboardStats(a.d1, ids);
  const projects = await listProjects(a.d1, ids);
  return (
    <AppShell active="dashboard" {...shellProps(a)}>
      <PageHeader title="แดชบอร์ด" subtitle={`ยินดีต้อนรับ ${a.user.name ?? a.user.email}`} />
      <div style={{ padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 22 }}>
          <Stat label="โครงการที่เห็น" value={String(stats.projects)} color="#001D58" />
          <Stat label="กำลังดำเนินการ" value={String(stats.active)} color="#EC186E" />
          <Stat label="Issues ค้าง" value={String(stats.openIssues)} color="#D4A017" />
          <Stat label="Risks เปิดอยู่" value={String(stats.risks)} color="#6B7280" />
        </div>
        <h2 style={{ fontSize: 17, color: NAVY }}>โครงการ</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {projects.length === 0 && <div className="card" style={{ padding: 18, color: "#6B7280" }}>ยังไม่มีโครงการที่คุณเข้าถึงได้</div>}
          {projects.map((p) => (
            <a key={p.id} href={`/pm/board?id=${p.id}`} className="card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none" }}>
              <span style={{ fontWeight: 600, color: "#1F2937" }}>{p.name}</span>
              <span style={{ fontSize: 12.5, color: "#6B7280" }}>{p.status ?? "-"}</span>
            </a>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return <div className="card" style={{ padding: "18px 20px", borderTop: `3px solid ${color}` }}><div style={{ fontSize: 13, color: "#6B7280" }}>{label}</div><div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div></div>;
}

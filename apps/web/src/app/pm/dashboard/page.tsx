import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { dashboardStats, listProjects, statusBreakdown, workloadByUser } from "@/lib/board-data";
import { visibleProjectIds } from "@/lib/access";
import { AppShell, PageHeader } from "@/components/app-shell";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
const NAVY = "#001D58";
const CAT_COLOR: Record<string, string> = { backlog: "#9AA0A6", todo: "#6B7280", doing: "#D4A017", done: "#2E7D32", drop: "#EC186E" };
const CAT_LABEL: Record<string, string> = { backlog: "Backlog", todo: "To Do", doing: "In Progress", done: "Done", drop: "Drop" };
export default async function DashboardPage() {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  const ids = await visibleProjectIds(a.d1, a.scope);
  const stats = await dashboardStats(a.d1, ids);
  const projects = await listProjects(a.d1, ids);
  const breakdown = await statusBreakdown(a.d1, ids);
  const workload = await workloadByUser(a.d1, ids);
  const totalTasks = breakdown.reduce((s, b) => s + b.c, 0);
  const maxWl = Math.max(1, ...workload.map((w) => w.c));
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16, marginBottom: 22 }}>
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, color: NAVY }}>สถานะงานทั้งหมด ({totalTasks})</h3>
            {totalTasks === 0 ? <div style={{ color: "#9AA0A6", fontSize: 13 }}>ยังไม่มีงาน</div> : (
              <>
                <div style={{ display: "flex", height: 20, borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
                  {breakdown.map((b) => <div key={b.category} title={`${CAT_LABEL[b.category] ?? b.category}: ${b.c}`} style={{ width: `${(b.c / totalTasks) * 100}%`, background: CAT_COLOR[b.category] ?? "#ccc" }} />)}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {breakdown.map((b) => <span key={b.category} style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: CAT_COLOR[b.category] ?? "#ccc" }} />{CAT_LABEL[b.category] ?? b.category} <b>{b.c}</b></span>)}
                </div>
              </>
            )}
          </div>
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, color: NAVY }}>ภาระงานต่อคน (ที่ยังไม่เสร็จ)</h3>
            {workload.length === 0 ? <div style={{ color: "#9AA0A6", fontSize: 13 }}>ไม่มีข้อมูล</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {workload.map((w) => (
                  <div key={w.name} style={{ display: "grid", gridTemplateColumns: "120px 1fr 30px", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</span>
                    <div style={{ background: "#F4F4F6", borderRadius: 5, height: 14 }}><div style={{ width: `${(w.c / maxWl) * 100}%`, height: "100%", background: "#001D58", borderRadius: 5 }} /></div>
                    <span style={{ fontSize: 12.5, fontWeight: 600, textAlign: "right" }}>{w.c}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
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

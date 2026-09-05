import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { getGanttRows, listProjects } from "@/lib/board-data";
import { visibleProjectIds } from "@/lib/access";
import { AppShell, PageHeader } from "@/components/app-shell";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
const NAVY = "#001D58";
function catColor(c: string | null) { return c === "done" ? "#2E7D32" : c === "doing" ? "#D4A017" : c === "drop" ? "#EC186E" : "#6B7280"; }
export default async function GanttPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  const sp = await searchParams;
  const ids = await visibleProjectIds(a.d1, a.scope);
  const projects = await listProjects(a.d1, ids);
  let projectId = Number(sp.id ?? "1") || 1;
  if (ids && !ids.includes(projectId)) projectId = projects[0]?.id ?? projectId;
  const rows = await getGanttRows(a.d1, projectId);
  const proj = projects.find((p) => p.id === projectId);
  let min = Infinity, max = -Infinity;
  for (const r of rows) { if (r.start! < min) min = r.start!; if (r.due! > max) max = r.due!; }
  const span = max > min ? max - min : 1; const day = 86400;
  return (
    <AppShell active="gantt" {...shellProps(a)}>
      <PageHeader title={`Gantt — ${proj?.name ?? ""}`} subtitle="ไทม์ไลน์งานที่มีวันเริ่ม/กำหนดส่ง" actions={<form action="/pm/gantt" method="get"><select name="id" className="input" defaultValue={projectId}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="btn-ghost" style={{ marginLeft: 8 }}>ดู</button></form>} />
      <div style={{ padding: 24 }}>
        {rows.length === 0 ? <div className="card" style={{ padding: 20, color: "#6B7280" }}>ยังไม่มีงานที่กำหนดวันเริ่ม + วันส่ง</div> : (
          <div className="card" style={{ padding: 18, overflowX: "auto" }}>
            <div style={{ minWidth: 640, display: "flex", flexDirection: "column", gap: 10 }}>
              {rows.map((r) => {
                const left = ((r.start! - min) / span) * 100; const width = Math.max(2, ((r.due! - r.start!) / span) * 100); const days = Math.round((r.due! - r.start!) / day);
                return (
                  <div key={r.id} style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12, alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}<div style={{ fontSize: 11, color: "#9AA0A6", fontWeight: 400 }}>{r.assignee ?? "—"} · {days} วัน</div></div>
                    <div style={{ position: "relative", height: 22, background: "#F4F4F6", borderRadius: 6 }}><div style={{ position: "absolute", left: `${left}%`, width: `${width}%`, top: 3, height: 16, background: catColor(r.category), borderRadius: 6 }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

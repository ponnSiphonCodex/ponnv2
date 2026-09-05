import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { listProjects } from "@/lib/board-data";
import { visibleProjectIds } from "@/lib/access";
import { AppShell, PageHeader } from "@/components/app-shell";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
const NAVY = "#001D58";
export default async function SprintBoardPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  const sp = await searchParams;
  const ids = await visibleProjectIds(a.d1, a.scope);
  const projects = await listProjects(a.d1, ids);
  let projectId = Number(sp.id ?? projects[0]?.id ?? 1) || 1;
  const spr = await a.d1.prepare(`SELECT id, name, goal, status, start_date, end_date FROM sprints WHERE project_id=? ORDER BY id DESC`).bind(projectId).all();
  const sprints = (spr.results ?? []) as any[];
  const tk = await a.d1.prepare(`SELECT t.id, t.title, t.sprint_id, ws.category AS cat, u.name AS assignee FROM tasks t LEFT JOIN workflow_statuses ws ON t.workflow_status_id=ws.id LEFT JOIN users u ON t.assignee_id=u.id WHERE t.project_id=? OR t.feature_id IN (SELECT id FROM features WHERE project_id=?)`).bind(projectId, projectId).all();
  const tasks = (tk.results ?? []) as any[];
  const bySprint = (sid: number | null) => tasks.filter((t) => t.sprint_id === sid);
  const catDot: Record<string, string> = { done: "#2E7D32", doing: "#D4A017", drop: "#EC186E", todo: "#6B7280", backlog: "#9AA0A6" };
  const cols = [...sprints, { id: null, name: "Backlog (ไม่มี Sprint)", goal: null, status: null } as any];
  return (
    <AppShell active="sprint-board" {...shellProps(a)}>
      <PageHeader title="Sprint Board" subtitle="งานแยกตาม Sprint" actions={<form action="/pm/sprint-board" method="get"><select name="id" className="input" defaultValue={projectId}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="btn-ghost" style={{ marginLeft: 8 }}>ดู</button></form>} />
      <div style={{ padding: 20, display: "flex", gap: 14, overflowX: "auto" }}>
        {cols.map((s) => {
          const items = bySprint(s.id);
          const done = items.filter((t) => t.cat === "done").length;
          return (
            <div key={String(s.id)} style={{ minWidth: 280, width: 280, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12 }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid #F0F1F3" }}>
                <div style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>{s.name}</div>
                {s.goal && <div style={{ fontSize: 11.5, color: "#9AA0A6" }}>{s.goal}</div>}
                <div style={{ fontSize: 11.5, color: "#6B7280", marginTop: 4 }}>{done}/{items.length} เสร็จ {s.status ? `· ${s.status}` : ""}</div>
              </div>
              <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, maxHeight: "calc(100dvh - 240px)", overflowY: "auto" }}>
                {items.length === 0 && <div style={{ color: "#C7CCD4", fontSize: 13, textAlign: "center", padding: 10 }}>ว่าง</div>}
                {items.map((t) => (
                  <a key={t.id} href={`/pm/board?id=${projectId}`} style={{ border: "1px solid #ECEEF1", borderRadius: 10, padding: 10, textDecoration: "none" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2937" }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: catDot[t.cat] ?? "#ccc", marginRight: 6 }} />{t.title}</div>
                    <div style={{ fontSize: 11.5, color: "#9AA0A6", marginTop: 3 }}>{t.assignee ?? "ยังไม่มอบหมาย"}</div>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

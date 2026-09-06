import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
const NAVY = "#001D58";
export default async function CalendarPage() {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  const now = new Date(); const y = now.getUTCFullYear(), m = now.getUTCMonth();
  const first = new Date(Date.UTC(y, m, 1)); const startDay = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const monthStart = Math.floor(Date.UTC(y, m, 1) / 1000); const monthEnd = Math.floor(Date.UTC(y, m + 1, 1) / 1000);
  const tk = await a.d1.prepare(`SELECT t.id, t.title, t.due_date, u.name AS assignee FROM tasks t LEFT JOIN users u ON t.assignee_id=u.id WHERE t.due_date>=? AND t.due_date<? ORDER BY t.due_date`).bind(monthStart, monthEnd).all();
  const tasks = (tk.results ?? []) as any[];
  const ms = await a.d1.prepare(`SELECT id, title, target_date FROM project_milestones WHERE target_date>=? AND target_date<? ORDER BY target_date`).bind(monthStart, monthEnd).all();
  const milestones = (ms.results ?? []) as any[];
  const byDay: Record<number, any[]> = {};
  for (const t of tasks) { const d = new Date(t.due_date * 1000).getUTCDate(); (byDay[d] ||= []).push({ ...t, kind: "task" }); }
  for (const m of milestones) { const d = new Date(m.target_date * 1000).getUTCDate(); (byDay[d] ||= []).push({ ...m, kind: "milestone" }); }
  const cells: (number | null)[] = []; for (let i = 0; i < startDay; i++) cells.push(null); for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const monthName = `${y}-${String(m + 1).padStart(2, "0")}`;
  return (
    <AppShell active="calendar" {...shellProps(a)}>
      <PageHeader title="ปฏิทิน — Due Date" subtitle={`งานที่ครบกำหนดในเดือน ${monthName}`} />
      <div style={{ padding: 24 }}><div className="card" style={{ padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
          {["อา","จ","อ","พ","พฤ","ศ","ส"].map((d) => <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#6B7280", padding: 6 }}>{d}</div>)}
          {cells.map((d, i) => (
            <div key={i} style={{ minHeight: 92, border: "1px solid #F0F1F3", borderRadius: 8, padding: 6, background: d ? "#fff" : "#FAFAFB" }}>
              {d && <div style={{ fontSize: 12, fontWeight: 600, color: NAVY, marginBottom: 4 }}>{d}</div>}
              {d && (byDay[d] || []).map((t, k) => <div key={t.kind + t.id + k} style={{ fontSize: 10.5, background: t.kind === "milestone" ? "#FEF3C7" : "#FDE7F0", color: t.kind === "milestone" ? "#92400E" : "#B4185A", borderRadius: 5, padding: "2px 5px", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={t.title}>{t.kind === "milestone" ? "◆ " : ""}{t.title}</div>)}
            </div>
          ))}
        </div>
      </div></div>
    </AppShell>
  );
}

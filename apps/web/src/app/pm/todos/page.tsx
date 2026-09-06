import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { TodosClient } from "@/components/todos-client";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
const NAVY = "#001D58";
export default async function TodosPage() {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  const r = await a.d1.prepare(`SELECT id, title, status, target_date FROM user_todos WHERE user_id=? ORDER BY status, target_date`).bind(a.user.sub).all();
  // งานจริงที่มอบหมายให้ฉัน + ครบกำหนดวันนี้หรือเลยกำหนด (ยังไม่เสร็จ)
  const endToday = Math.floor(Date.now() / 1000) + 86400;
  const mt = await a.d1.prepare(
    `SELECT t.id, t.title, t.due_date, t.project_id, p.name AS project, ws.name AS status FROM tasks t
     LEFT JOIN projects p ON t.project_id=p.id LEFT JOIN workflow_statuses ws ON t.workflow_status_id=ws.id
     WHERE t.assignee_id=? AND t.due_date IS NOT NULL AND t.due_date < ? AND (ws.category IS NULL OR ws.category NOT IN ('done','drop'))
     ORDER BY t.due_date LIMIT 20`
  ).bind(a.user.sub, endToday).all();
  const myTasks = (mt.results ?? []) as any[];
  const now = Math.floor(Date.now() / 1000);
  return (
    <AppShell active="todos" {...shellProps(a)}>
      <PageHeader title="To-Day Planning" subtitle="งานที่ต้องโฟกัสวันนี้ + รายการส่วนตัวของคุณ" />
      <div style={{ padding: 24, maxWidth: 720 }}>
        <h3 style={{ fontSize: 15, color: NAVY, margin: "0 0 12px" }}>🎯 งานที่ได้รับมอบหมาย (ครบกำหนด/เลยกำหนด)</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 26 }}>
          {myTasks.length === 0 && <div className="card" style={{ padding: 16, color: "#6B7280" }}>ไม่มีงานค้างที่ครบกำหนด 🎉</div>}
          {myTasks.map((t) => {
            const overdue = t.due_date < now;
            return (
              <a key={t.id} href={t.project_id ? `/pm/board?id=${t.project_id}` : "#"} className="card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", borderLeft: `3px solid ${overdue ? "#DC2626" : "#D4A017"}` }}>
                <div><div style={{ fontWeight: 600, color: "#1F2937" }}>{t.title}</div><div style={{ fontSize: 12, color: "#9AA0A6" }}>{t.project ?? "-"} · {t.status ?? "-"}</div></div>
                <span className="badge" style={{ background: overdue ? "#FEE2E2" : "#FEF3C7", color: overdue ? "#991B1B" : "#92400E" }}>{overdue ? "เลยกำหนด" : "วันนี้"} {new Date(t.due_date * 1000).toISOString().slice(5, 10)}</span>
              </a>
            );
          })}
        </div>
        <h3 style={{ fontSize: 15, color: NAVY, margin: "0 0 4px" }}>✅ รายการส่วนตัว</h3>
      </div>
      <div style={{ marginTop: -14 }}><TodosClient initial={(r.results ?? []) as any} /></div>
    </AppShell>
  );
}

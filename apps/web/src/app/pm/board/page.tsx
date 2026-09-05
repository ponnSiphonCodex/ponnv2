import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { getBoardData } from "@/lib/board-data";
import { AppShell, PageHeader } from "@/components/app-shell";
export const dynamic = "force-dynamic";
export default async function BoardPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const auth = await requireAuth();
  if (!auth) redirect("/login");
  const params = await searchParams;
  const projectId = Number(params.id ?? "1");
  const board = Number.isInteger(projectId) ? await getBoardData(auth.db, projectId) : null;
  return (
    <AppShell active="board" user={auth.user} isAdmin={auth.admin} roleLabel={auth.roleLabel}>
      <PageHeader title={board ? board.project.name : "กระดานงาน"} subtitle={board ? `ความคืบหน้า ${board.project.progress.done}/${board.project.progress.total} (${board.project.progress.percent}%)` : undefined} />
      <div style={{ padding: 28 }}>
        {!board ? <p style={{ color: "#9AA0A6" }}>ไม่พบ Project (id={String(params.id ?? "1")})</p> : (
          <div style={{ display: "flex", gap: 16, overflowX: "auto" }}>
            {board.columns.map((col) => (
              <section key={col.id} style={{ minWidth: 280, background: "#EFF0F3", borderRadius: 10, padding: 12 }}>
                <h3 style={{ borderBottom: `3px solid ${col.color ?? "#001D58"}`, paddingBottom: 8, marginTop: 0, fontSize: 15 }}>{col.name} ({col.tasks.length})</h3>
                {col.tasks.length === 0 && <p style={{ fontSize: 13, color: "#9AA0A6" }}>ยังไม่มีงาน</p>}
                {col.tasks.map((task) => (<article key={task.id} style={{ background: "#fff", borderRadius: 8, padding: 12, marginTop: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}><strong>{task.title}</strong><div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{task.assignee?.name ?? "ยังไม่มอบหมาย"} · {task.actualHours}/{task.estimatedHours ?? 0} ชม.</div></article>))}
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

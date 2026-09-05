import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/db";
import { getCurrentUser } from "@/lib/current-user";
import { getBoardData } from "@/lib/board-data";
export const dynamic = "force-dynamic";
export default async function BoardPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const user = await getCurrentUser(env.AUTH_SECRET);
  if (!user) redirect("/login");
  const db = createDb(env.DB);
  const params = await searchParams;
  const projectId = Number(params.id ?? "1");
  const board = Number.isInteger(projectId) ? await getBoardData(db, projectId) : null;
  if (!board) {
    return (<main style={{ padding: 24 }}><p>ไม่พบ Project (id={String(params.id ?? "1")})</p><p style={{ fontSize: 13, color: "#6B7280" }}>ถ้ายังไม่มีข้อมูล ให้รัน database/migrations/schema.sql ใน D1 Console</p><p style={{ marginTop: 16 }}><a href="/api/logout" style={{ color: "#EC186E" }}>ออกจากระบบ</a></p></main>);
  }
  return (
    <main style={{ padding: 24 }}>
      <header style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div><h1 style={{ color: "#001D58", margin: 0 }}>{board.project.name}</h1><p style={{ color: "#6B7280" }}>Progress: {board.project.progress.done}/{board.project.progress.total} ({board.project.progress.percent}%)</p></div>
        <a href="/api/logout" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none" }}>ออกจากระบบ</a>
      </header>
      <div style={{ display: "flex", gap: 16, overflowX: "auto" }}>
        {board.columns.map((col) => (
          <section key={col.id} style={{ minWidth: 280, background: "#F4F4F6", borderRadius: 8, padding: 12 }}>
            <h3 style={{ borderBottom: `3px solid ${col.color ?? "#001D58"}`, paddingBottom: 8, marginTop: 0 }}>{col.name} ({col.tasks.length})</h3>
            {col.tasks.length === 0 && <p style={{ fontSize: 13, color: "#9AA0A6" }}>ยังไม่มีงาน</p>}
            {col.tasks.map((task) => (<article key={task.id} style={{ background: "#fff", borderRadius: 6, padding: 10, marginTop: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}><strong>{task.title}</strong><div style={{ fontSize: 12, color: "#6B7280" }}>{task.assignee?.name ?? "ยังไม่มอบหมาย"} · {task.actualHours}/{task.estimatedHours ?? 0} ชม.</div></article>))}
          </section>
        ))}
      </div>
    </main>
  );
}

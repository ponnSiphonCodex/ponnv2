/**
 * apps/web/src/app/pm/board/page.tsx
 * Kanban Board — query D1 ตรง ๆ ใน server component (ไม่เรียก API worker แยก)
 * ใช้ query param (?id=1) แทน dynamic route [projectId]
 */
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import NextAuth from "next-auth";
import { createDb } from "@/db";
import { getAuthConfig } from "@/lib/auth";
import { getBoardData } from "@/lib/board-data";

export const dynamic = "force-dynamic";

export default async function BoardPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const db = createDb(env.DB);

  const { auth } = NextAuth(
    getAuthConfig(db, { AUTH_SECRET: env.AUTH_SECRET, GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET })
  );
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const projectId = Number(params.id ?? "1");
  const board = Number.isInteger(projectId) ? await getBoardData(db, projectId) : null;

  if (!board) {
    return (
      <main style={{ padding: 24 }}>
        <p>ไม่พบ Project (id={String(params.id ?? "1")})</p>
        <p style={{ fontSize: 13, color: "#6B7280" }}>
          ถ้ายังไม่มีข้อมูล ให้รัน SQL seed ใน D1 Console (database/migrations/schema.sql)
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#001D58", margin: 0 }}>{board.project.name}</h1>
        <p style={{ color: "#6B7280" }}>
          Progress: {board.project.progress.done}/{board.project.progress.total} ({board.project.progress.percent}%)
        </p>
      </header>

      <div style={{ display: "flex", gap: 16, overflowX: "auto" }}>
        {board.columns.map((col) => (
          <section key={col.id} style={{ minWidth: 280, background: "#F4F4F6", borderRadius: 8, padding: 12 }}>
            <h3 style={{ borderBottom: `3px solid ${col.color ?? "#001D58"}`, paddingBottom: 8, marginTop: 0 }}>
              {col.name} ({col.tasks.length})
            </h3>
            {col.tasks.length === 0 && <p style={{ fontSize: 13, color: "#9AA0A6" }}>ยังไม่มีงาน</p>}
            {col.tasks.map((task) => (
              <article key={task.id} style={{ background: "#fff", borderRadius: 6, padding: 10, marginTop: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <strong>{task.title}</strong>
                <div style={{ fontSize: 12, color: "#6B7280" }}>
                  {task.assignee?.name ?? "ยังไม่มอบหมาย"} · {task.actualHours}/{task.estimatedHours ?? 0} ชม.
                </div>
              </article>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}

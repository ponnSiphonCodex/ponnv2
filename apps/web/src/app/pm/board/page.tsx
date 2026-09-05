/**
 * ใช้ query param (?id=1) แทน dynamic route segment [projectId] โดยตั้งใจ
 * เพื่อลดจำนวนโฟลเดอร์ชื่อวงเล็บในโปรเจกต์
 */
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type BoardTask = {
  id: number;
  title: string;
  assignee: { id: string; name: string | null; image: string | null } | null;
  estimatedHours: number | null;
  actualHours: number;
  dueDate: number | null;
};

type BoardColumn = {
  id: number;
  name: string;
  color: string | null;
  category: "todo" | "doing" | "done";
  tasks: BoardTask[];
};

type BoardResponse = {
  project: { id: number; name: string; progress: { total: number; done: number; percent: number } };
  columns: BoardColumn[];
};

async function getBoard(projectId: string): Promise<BoardResponse | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${apiUrl}/api/projects/${projectId}/board`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const projectId = params.id ?? "1";
  const board = await getBoard(projectId);

  if (!board) {
    return <main style={{ padding: 24, fontFamily: "'Sarabun', sans-serif" }}>ไม่พบ Project หรือ session หมดอายุ</main>;
  }

  return (
    <main style={{ padding: 24, fontFamily: "'Sarabun', sans-serif" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#001D58" }}>{board.project.name}</h1>
        <p>
          Progress: {board.project.progress.done}/{board.project.progress.total} ({board.project.progress.percent}%)
        </p>
      </header>

      <div style={{ display: "flex", gap: 16, overflowX: "auto" }}>
        {board.columns.map((col) => (
          <section key={col.id} style={{ minWidth: 280, background: "#F4F4F6", borderRadius: 8, padding: 12 }}>
            <h3 style={{ borderBottom: `3px solid ${col.color ?? "#001D58"}`, paddingBottom: 8 }}>
              {col.name} ({col.tasks.length})
            </h3>
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

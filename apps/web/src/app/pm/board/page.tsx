import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { getBoardData, listProjects } from "@/lib/board-data";
import { refOptions } from "@/lib/crud";
import { visibleProjectIds, canEditProject } from "@/lib/access";
import { AppShell, PageHeader } from "@/components/app-shell";
import { BoardClient } from "@/components/board-client";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
export default async function BoardPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  const sp = await searchParams;
  const ids = await visibleProjectIds(a.d1, a.scope);
  let projectId = Number(sp.id ?? "1") || 1;
  const projects = await listProjects(a.d1, ids);
  if (ids && !ids.includes(projectId)) projectId = projects[0]?.id ?? projectId;
  const board = projects.length ? await getBoardData(a.d1, projectId) : null;
  const users = await refOptions(a.d1, "users");
  const priorities = await refOptions(a.d1, "priorities");
  const featRows = await a.d1.prepare(`SELECT id, name AS label FROM features WHERE project_id=? ORDER BY id`).bind(projectId).all();
  const features = (featRows.results ?? []) as any[];
  const tagRows = await a.d1.prepare(`SELECT id, name, color FROM tags ORDER BY id`).all();
  const tags = (tagRows.results ?? []) as any[];
  let canWrite = a.scope.isPmo;
  if (!canWrite && board) { const row = await a.d1.prepare(`SELECT id, product_id FROM projects WHERE id=?`).bind(projectId).first<any>(); canWrite = row ? canEditProject(a.scope, row.id, row.product_id) : false; }
  return (
    <AppShell active="board" {...shellProps(a)}>
      <PageHeader title={board ? board.project.name : "กระดานงาน"} subtitle="ลากการ์ดเปลี่ยนสถานะ · คลิกการ์ดเพื่อดู/แก้รายละเอียด" />
      {!board ? <div style={{ padding: 40, color: "#6B7280" }}>ไม่พบโปรเจกต์ที่เข้าถึงได้</div> : <BoardClient board={board} projects={projects} users={users} priorities={priorities} features={features} tags={tags} canWrite={canWrite} />}
    </AppShell>
  );
}

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { listProjects } from "@/lib/board-data";
import { visibleProjectIds } from "@/lib/access";
import { AppShell, PageHeader } from "@/components/app-shell";
import { GanttClient } from "@/components/gantt-client";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
export default async function GanttPage() {
  const auth = await requireAuth();
  if (!auth) redirect("/login");
  if (auth.guest) redirect("/pm/waiting");
  const ids = await visibleProjectIds(auth.d1, auth.scope);
  const projects = await listProjects(auth.d1, ids);
  return <AppShell active="gantt" {...shellProps(auth)}>
    <PageHeader title="Gantt Chart" subtitle="Timeline ทุกโครงการ พร้อม Project และ Workforce View" />
    <GanttClient projects={projects.map((p) => ({ id: p.id, name: p.name }))} />
  </AppShell>;
}

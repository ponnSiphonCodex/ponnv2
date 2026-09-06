import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { listProjects } from "@/lib/board-data";
import { visibleProjectIds } from "@/lib/access";
import { AppShell, PageHeader } from "@/components/app-shell";
import { GanttClient } from "@/components/gantt-client";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
export default async function GanttPage(){const a=await requireAuth();if(!a)redirect("/login");if(a.guest)redirect("/pm/waiting");const ids=await visibleProjectIds(a.d1,a.scope);const projects=await listProjects(a.d1,ids);return <AppShell active="gantt" {...shellProps(a)}><PageHeader title="Gantt Chart" subtitle="Timeline หลาย Project พร้อม Project และ Workforce View"/><GanttClient projects={projects.map(p=>({id:p.id,name:p.name}))}/></AppShell>}
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { WorkingTeam } from "@/components/working-team";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
export default async function TeamPage() {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  return (
    <AppShell active="team" {...shellProps(a)}>
      <PageHeader title="Working Team" subtitle="ทีมงานที่คุณเกี่ยวข้อง — เพิ่มคน / ซ่อน-แสดงรายคนได้ (เฉพาะมุมมองคุณ)" />
      <WorkingTeam />
    </AppShell>
  );
}

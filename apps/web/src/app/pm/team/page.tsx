import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { TeamManager } from "@/components/team-manager";
export const dynamic = "force-dynamic";
export default async function TeamPage() {
  const auth = await requireAuth();
  if (!auth) redirect("/login");
  if (!auth.admin) redirect("/pm/dashboard");
  return (
    <AppShell active="team" user={auth.user} isAdmin={auth.admin} roleLabel={auth.roleLabel}>
      <PageHeader title="ผู้ใช้งาน & สิทธิ์" subtitle="กดปุ่ม role เพื่อเพิ่ม/ถอนสิทธิ์ให้ผู้ใช้แต่ละคน" />
      <div style={{ padding: 28 }}>
        <TeamManager />
      </div>
    </AppShell>
  );
}

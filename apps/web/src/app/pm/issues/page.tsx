import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { TabbedCrud } from "@/components/tabbed-crud";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
export default async function IssuesPage() {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  return (
    <AppShell active="issues" {...shellProps(a)}>
      <PageHeader title="Issues List" subtitle="ปัญหาและความเสี่ยงที่ต้องติดตาม" />
      <TabbedCrud tabs={[
        { key: "issues", label: "Issues (ปัญหา)" },
        { key: "risks", label: "Risks (ความเสี่ยง)" },
      ]} />
    </AppShell>
  );
}

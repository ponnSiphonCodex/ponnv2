import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { IssueEditor } from "@/components/issue-editor";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
export default async function IssueEditPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  const sp = await searchParams; const id = sp.id ? Number(sp.id) : null;
  return (
    <AppShell active="issues" {...shellProps(a)}>
      <PageHeader title={id ? "แก้ไข Issue" : "เพิ่ม Issue"} subtitle="บันทึกปัญหาและแผนการแก้ไข" />
      <IssueEditor issueId={id} />
    </AppShell>
  );
}

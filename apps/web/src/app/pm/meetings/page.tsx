import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { MeetingsView } from "@/components/meetings-view";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
export default async function MeetingsPage() {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  return (
    <AppShell active="meetings" {...shellProps(a)}>
      <PageHeader title="Meeting Records" subtitle="บันทึกการประชุม — มุมมองปฏิทิน (คลิกวัน) หรือสลับเป็นตาราง" />
      <MeetingsView canWrite={!a.guest} />
    </AppShell>
  );
}

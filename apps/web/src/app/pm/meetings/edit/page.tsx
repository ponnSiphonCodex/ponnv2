import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { MeetingEditor } from "@/components/meeting-editor";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
export default async function MeetingEditPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  const sp = await searchParams;
  const id = sp.id ? Number(sp.id) : null;
  return (
    <AppShell active="meetings" {...shellProps(a)}>
      <PageHeader title={id ? "แก้ไขบันทึกประชุม" : "เพิ่มบันทึกประชุม"} subtitle="กรอกรายละเอียด เขียนบันทึกแบบ Rich Text และแนบไฟล์ได้" />
      <MeetingEditor meetingId={id} />
    </AppShell>
  );
}

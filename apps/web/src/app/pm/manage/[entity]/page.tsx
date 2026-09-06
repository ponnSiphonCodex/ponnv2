import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { CrudManager } from "@/components/crud-manager";
import { entityDef } from "@/lib/entities";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
export default async function ManagePage({ params }: { params: Promise<{ entity: string }> }) {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  const { entity } = await params;
  const def = entityDef(entity); if (!def) notFound();
  if (def.masterOnly && !a.admin && !a.scope.isPmo) redirect("/pm/dashboard");
  // map entity → menu key ที่ถูก highlight
  const activeKey = entity === "projects" ? "project" : entity;
  return (
    <AppShell active={activeKey} {...shellProps(a)}>
      <PageHeader title={def.label} subtitle="สร้าง แก้ไข ลบ ตามสิทธิ์ของคุณ" />
      <CrudManager entity={entity} />
    </AppShell>
  );
}

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { CustomFieldManager } from "@/components/custom-field-manager";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
export default async function CustomFieldsPage() {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  return <AppShell active="custom-fields" {...shellProps(a)}><PageHeader title="Custom Fields" subtitle="สร้างฟิลด์เพิ่มเองแบบ Notion (แก้ค่าได้ในหน้ารายละเอียดงาน)" /><CustomFieldManager canWrite={a.scope.isPmo} /></AppShell>;
}

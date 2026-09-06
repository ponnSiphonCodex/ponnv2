import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { MasterDataManager } from "@/components/tabbed-crud";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
export default async function MasterDataPage() {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  if (!a.scope.isPmo) redirect("/pm/dashboard");
  return (
    <AppShell active="settings" {...shellProps(a)}>
      <PageHeader title="Master Data" subtitle="ข้อมูลตั้งค่าระบบทั้งหมด" />
      <MasterDataManager canMaster={a.scope.isPmo} tabs={[
        { key: "priorities", label: "Priorities (ระดับความสำคัญ)" },
        { key: "categories", label: "Categories (หมวดหมู่)" },
        { key: "tags", label: "Tags (ป้ายกำกับ)" },
        { key: "sprints", label: "Sprints" },
        { key: "custom", label: "Custom Fields", special: "custom-fields" },
      ]} />
    </AppShell>
  );
}

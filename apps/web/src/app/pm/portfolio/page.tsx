import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { TabbedCrud } from "@/components/tabbed-crud";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
export default async function PortfolioPage() {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  return (
    <AppShell active="product-feature" {...shellProps(a)}>
      <PageHeader title="Product & Feature" subtitle="ลำดับชั้นพอร์ตโฟลิโอ: Theme → Initiative → Requirement → Product → Feature" />
      <TabbedCrud canMaster={a.scope.isPmo} tabs={[
        { key: "products", label: "Products" },
        { key: "features", label: "Features" },
        { key: "requirements", label: "Requirements" },
        { key: "initiatives", label: "Initiatives" },
        { key: "themes", label: "Themes" },
      ]} />
    </AppShell>
  );
}

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { IssuesView } from "@/components/issues-view";
import { RisksTab } from "@/components/risks-tab";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
export default async function IssuesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  const sp = await searchParams; const tab = sp.tab === "risks" ? "risks" : "issues";
  return (
    <AppShell active="issues" {...shellProps(a)}>
      <PageHeader title="Issues List" subtitle="ปัญหาและความเสี่ยงที่ต้องติดตาม" />
      <div style={{ display: "flex", gap: 4, padding: "12px 20px 0", borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <a href="/pm/issues" style={tabStyle(tab === "issues")}>Issues (ปัญหา)</a>
        <a href="/pm/issues?tab=risks" style={tabStyle(tab === "risks")}>Risks (ความเสี่ยง)</a>
      </div>
      {tab === "issues" ? <IssuesView /> : <RisksTab />}
    </AppShell>
  );
}
function tabStyle(active: boolean): React.CSSProperties {
  return { padding: "10px 16px", textDecoration: "none", borderBottom: active ? "2.5px solid #EC186E" : "2.5px solid transparent", color: active ? "#001D58" : "#9AA0A6", fontWeight: active ? 700 : 500, fontSize: 13.5 };
}

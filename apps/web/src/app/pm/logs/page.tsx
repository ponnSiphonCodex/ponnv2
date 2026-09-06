import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { LogViewer } from "@/components/log-viewer";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
export default async function LogsPage() {
  const a = await requireAuth(); if (!a) redirect("/login"); if (!a.admin) redirect("/pm/dashboard");
  return <AppShell active="logs" {...shellProps(a)}><PageHeader title="System Log" subtitle="บันทึกต่อเนื่องอัตโนมัติจากทุกหน้า: API, วัตถุประสงค์, Status และ Response Time" /><LogViewer /></AppShell>;
}

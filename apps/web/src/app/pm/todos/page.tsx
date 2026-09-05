import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { TodosClient } from "@/components/todos-client";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
export default async function TodosPage() {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  const r = await a.d1.prepare(`SELECT id, title, status, target_date FROM user_todos WHERE user_id=? ORDER BY status, target_date`).bind(a.user.sub).all();
  return <AppShell active="todos" {...shellProps(a)}><PageHeader title="งานของฉันวันนี้" subtitle="รายการส่วนตัว เก็บใน To-do ของคุณ" /><TodosClient initial={(r.results ?? []) as any} /></AppShell>;
}

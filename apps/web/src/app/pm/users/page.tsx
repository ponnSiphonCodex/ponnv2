import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { UserManager } from "@/components/user-manager";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
export default async function UsersPage() {
  const a = await requireAuth(); if (!a) redirect("/login"); if (!a.admin) redirect("/pm/dashboard");
  return <AppShell active="users" {...shellProps(a)}><PageHeader title="จัดการผู้ใช้งาน" subtitle="ดูผู้ใช้ · กำหนดสิทธิ์ · เปิด/ปิด · เพิ่มผู้ใช้จาก log" /><UserManager /></AppShell>;
}

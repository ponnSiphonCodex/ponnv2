import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
export const dynamic = "force-dynamic";
export default async function HomePage() {
  const auth = await requireAuth();
  if (!auth) redirect("/login");
  redirect("/pm/dashboard");
}

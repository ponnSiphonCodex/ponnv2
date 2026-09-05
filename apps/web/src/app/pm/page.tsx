import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default function PmHomePage() { redirect("/pm/board?id=1"); }

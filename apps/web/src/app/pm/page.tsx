import { redirect } from "next/navigation";

export default function PmHomePage() {
  redirect("/pm/board?id=1");
}

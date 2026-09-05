import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { listProjects } from "@/lib/board-data";
import { AppShell, PageHeader } from "@/components/app-shell";
export const dynamic = "force-dynamic";
export default async function ProjectsPage() {
  const auth = await requireAuth();
  if (!auth) redirect("/login");
  const projects = await listProjects(auth.db);
  return (
    <AppShell active="projects" user={auth.user} isAdmin={auth.admin} roleLabel={auth.roleLabel}>
      <PageHeader title="โครงการ" subtitle={`ทั้งหมด ${projects.length} โครงการ`} />
      <div style={{ padding: 28 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <thead>
            <tr style={{ background: "#F4F4F6", textAlign: "left" }}>
              <th style={{ padding: 14, fontSize: 13, color: "#6B7280" }}>ID</th>
              <th style={{ padding: 14, fontSize: 13, color: "#6B7280" }}>ชื่อโครงการ</th>
              <th style={{ padding: 14, fontSize: 13, color: "#6B7280" }}>สถานะ</th>
              <th style={{ padding: 14 }}></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} style={{ borderTop: "1px solid #E5E7EB" }}>
                <td style={{ padding: 14, color: "#9AA0A6" }}>{p.id}</td>
                <td style={{ padding: 14, fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: 14 }}><span style={{ fontSize: 12, background: "#F4F4F6", padding: "4px 10px", borderRadius: 20 }}>{p.status ?? "-"}</span></td>
                <td style={{ padding: 14, textAlign: "right" }}><a href={`/pm/board?id=${p.id}`} style={{ color: "#EC186E", textDecoration: "none", fontSize: 13 }}>เปิดกระดาน →</a></td>
              </tr>
            ))}
            {projects.length === 0 && <tr><td colSpan={4} style={{ padding: 20, color: "#9AA0A6", textAlign: "center" }}>ยังไม่มีโครงการ</td></tr>}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

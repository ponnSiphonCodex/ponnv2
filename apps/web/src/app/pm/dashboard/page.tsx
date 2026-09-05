import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { listProjects } from "@/lib/board-data";
import { AppShell, PageHeader } from "@/components/app-shell";
export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const auth = await requireAuth();
  if (!auth) redirect("/login");
  const projects = await listProjects(auth.db);
  return (
    <AppShell active="dashboard" user={auth.user} isAdmin={auth.admin} roleLabel={auth.roleLabel}>
      <PageHeader title="แดชบอร์ด" subtitle={`ยินดีต้อนรับ ${auth.user.name || auth.user.email}`} />
      <div style={{ padding: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
          <StatCard label="โครงการทั้งหมด" value={String(projects.length)} color="#001D58" />
          <StatCard label="กำลังดำเนินการ" value={String(projects.filter((p) => p.status === "in_progress").length)} color="#EC186E" />
          <StatCard label="สิทธิ์ของคุณ" value={auth.admin ? "Admin" : auth.roleLabel} color="#D4A017" />
        </div>
        <h3 style={{ color: "#001D58" }}>โครงการล่าสุด</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {projects.length === 0 && <p style={{ color: "#9AA0A6" }}>ยังไม่มีโครงการ</p>}
          {projects.map((p) => (
            <a key={p.id} href={`/pm/board?id=${p.id}`} style={{ display: "flex", justifyContent: "space-between", background: "#fff", padding: 16, borderRadius: 10, textDecoration: "none", color: "#111827", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <strong>{p.name}</strong>
              <span style={{ fontSize: 13, color: "#6B7280" }}>{p.status ?? "-"}</span>
            </a>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

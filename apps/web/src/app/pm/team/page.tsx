import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { AppShell, PageHeader } from "@/components/app-shell";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
const NAVY = "#001D58", PINK = "#EC186E";
const ROLE_COLOR: Record<string, string> = { PMO: "#001D58", "Product Owner": "#EC186E", "Project Manager": "#D4A017", "Project Co-Ordinator": "#2E7D32", "Working Team": "#6B7280" };
export default async function TeamPage() {
  const a = await requireAuth(); if (!a) redirect("/login"); if (a.guest) redirect("/pm/waiting");
  // roster: users ที่มี pm_role (คนทำงานจริง)
  const ur = await a.d1.prepare(`SELECT id, name, email, pm_role, image, avatar_url FROM users WHERE active=1 AND pm_role IS NOT NULL ORDER BY CASE pm_role WHEN 'PMO' THEN 1 WHEN 'Product Owner' THEN 2 WHEN 'Project Manager' THEN 3 WHEN 'Project Co-Ordinator' THEN 4 ELSE 5 END, name`).all();
  const users = (ur.results ?? []) as any[];
  // workload: งานที่ยังไม่เสร็จต่อคน
  const wl = await a.d1.prepare(`SELECT t.assignee_id AS uid, COUNT(*) AS c FROM tasks t LEFT JOIN workflow_statuses ws ON t.workflow_status_id=ws.id WHERE t.assignee_id IS NOT NULL AND (ws.category IS NULL OR ws.category NOT IN ('done','drop')) GROUP BY t.assignee_id`).all();
  const wlMap = new Map<string, number>(); for (const r of (wl.results ?? []) as any[]) wlMap.set(r.uid, r.c);
  // done count
  const dn = await a.d1.prepare(`SELECT t.assignee_id AS uid, COUNT(*) AS c FROM tasks t LEFT JOIN workflow_statuses ws ON t.workflow_status_id=ws.id WHERE ws.category='done' GROUP BY t.assignee_id`).all();
  const dnMap = new Map<string, number>(); for (const r of (dn.results ?? []) as any[]) dnMap.set(r.uid, r.c);
  // project assignments (PM)
  const pm = await a.d1.prepare(`SELECT pm.user_id AS uid, p.name FROM project_managers pm JOIN projects p ON pm.project_id=p.id`).all();
  const pmMap = new Map<string, string[]>(); for (const r of (pm.results ?? []) as any[]) { const l = pmMap.get(r.uid) ?? []; l.push(r.name); pmMap.set(r.uid, l); }
  // product ownership
  const po = await a.d1.prepare(`SELECT po.user_id AS uid, pr.name FROM product_owners po JOIN products pr ON po.product_id=pr.id`).all();
  const poMap = new Map<string, string[]>(); for (const r of (po.results ?? []) as any[]) { const l = poMap.get(r.uid) ?? []; l.push(r.name); poMap.set(r.uid, l); }

  return (
    <AppShell active="team" {...shellProps(a)}>
      <PageHeader title="Working Team" subtitle="ทีมงานและภาระงานปัจจุบัน (จัดสิทธิ์/เพิ่มคนได้ที่เมนู จัดการผู้ใช้งาน)" />
      <div style={{ padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
          {users.length === 0 && <div className="card" style={{ padding: 20, color: "#6B7280" }}>ยังไม่มีสมาชิกทีมที่กำหนดบทบาท</div>}
          {users.map((u) => {
            const active = wlMap.get(u.id) ?? 0; const done = dnMap.get(u.id) ?? 0;
            const projects = pmMap.get(u.id) ?? []; const products = poMap.get(u.id) ?? [];
            const rc = ROLE_COLOR[u.pm_role] ?? "#6B7280";
            const avatar = u.avatar_url || u.image;
            return (
              <div key={u.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  {avatar ? <img src={avatar} alt="" style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: 46, height: 46, borderRadius: "50%", background: rc, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>{(u.name || u.email).charAt(0).toUpperCase()}</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: NAVY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name || u.email}</div>
                    <span className="badge" style={{ background: rc, color: "#fff" }}>{u.pm_role}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                  <div><div style={{ fontSize: 22, fontWeight: 700, color: PINK }}>{active}</div><div style={{ fontSize: 11.5, color: "#6B7280" }}>งานค้าง</div></div>
                  <div><div style={{ fontSize: 22, fontWeight: 700, color: "#2E7D32" }}>{done}</div><div style={{ fontSize: 11.5, color: "#6B7280" }}>เสร็จแล้ว</div></div>
                </div>
                {products.length > 0 && <div style={{ fontSize: 12, color: "#374151", marginBottom: 4 }}>📦 ดูแล: {products.join(", ")}</div>}
                {projects.length > 0 && <div style={{ fontSize: 12, color: "#374151" }}>📁 โครงการ: {projects.join(", ")}</div>}
                {products.length === 0 && projects.length === 0 && <div style={{ fontSize: 12, color: "#9AA0A6" }}>ยังไม่ได้รับมอบหมายโครงการ</div>}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

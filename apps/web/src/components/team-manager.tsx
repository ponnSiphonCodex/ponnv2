"use client";
import { useEffect, useState } from "react";
import { LoadingOverlay } from "./loading-overlay";
type Role = { roleId: number; roleName: string; module: string };
type User = { id: string; name: string | null; email: string; roles: Role[] };
type AllRole = { id: number; roleName: string; module: string };
export function TeamManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [allRoles, setAllRoles] = useState<AllRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function load() {
    setLoading(true); setError(null);
    try { const res = await fetch("/api/users"); if (!res.ok) { setError("โหลดข้อมูลไม่สำเร็จ (ต้องเป็น admin)"); setLoading(false); return; } const d = (await res.json()) as { users: User[]; allRoles: AllRole[] }; setUsers(d.users); setAllRoles(d.allRoles); } catch { setError("เชื่อมต่อไม่สำเร็จ"); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  async function toggle(userId: string, roleId: number, has: boolean) {
    setBusy(`${userId}:${roleId}`);
    await fetch("/api/user-roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, roleId, action: has ? "remove" : "add" }) });
    await load(); setBusy(null);
  }
  if (loading) return <p style={{ color: "#6B7280" }}>กำลังโหลด...</p>;
  if (error) return <p style={{ color: "#B91C1C" }}>{error}</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <LoadingOverlay show={busy !== null} label="กำลังอัปเดตสิทธิ์..." />
      {users.map((u) => (
        <div key={u.id} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div><strong style={{ color: "#001D58" }}>{u.name || u.email}</strong><div style={{ fontSize: 12, color: "#9AA0A6" }}>{u.email}</div></div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>{u.roles.length ? u.roles.map((r) => r.roleName).join(", ") : "ยังไม่กำหนดสิทธิ์"}</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {allRoles.map((r) => {
              const has = u.roles.some((ur) => ur.roleId === r.id);
              const b = busy === `${u.id}:${r.id}`;
              return (<button key={r.id} onClick={() => toggle(u.id, r.id, has)} disabled={b} style={{ padding: "6px 14px", borderRadius: 20, border: has ? "none" : "1px solid #E5E7EB", background: has ? "#001D58" : "#fff", color: has ? "#fff" : "#6B7280", fontSize: 13, cursor: "pointer", fontWeight: has ? 600 : 500, opacity: b ? 0.5 : 1 }}>{has ? "✓ " : "+ "}{r.roleName} <span style={{ opacity: 0.6, fontSize: 11 }}>({r.module})</span></button>);
            })}
          </div>
        </div>
      ))}
      {users.length === 0 && <p style={{ color: "#9AA0A6" }}>ยังไม่มีผู้ใช้งาน</p>}
    </div>
  );
}

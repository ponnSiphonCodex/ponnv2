"use client";
import { useEffect, useState, useCallback } from "react";
import { Icon } from "./icons";

const NAVY = "#001D58", PINK = "#EC186E";
const PAGE_SIZE = 10;
type Login = { auth_provider: string; device_info: string | null; ip_address: string | null; success: number; login_time: number };
type UserRow = { id: string; name: string | null; email: string; company_email: string | null; phone: string | null; active: number; pm_role: string | null; last_login_at: number | null; image: string | null; avatar_url: string | null; roles: { id: number; name: string }[]; logins: Login[] };
type Orphan = { email: string; lastLogin: number; device: string | null; count: number };
type Meta = { sysRoles: { id: number; name: string }[]; pmRoles: string[] };

function fmtDT(u: number | null): string { if (!u) return "-"; return new Date(u * 1000).toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).slice(0, 16) + " น."; }
const isGuest = (u: UserRow) => u.roles.length === 0 || u.roles.every((r) => r.name === "Guest");

export function UserManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [orphans, setOrphans] = useState<Orphan[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [meta, setMeta] = useState<Meta>({ sysRoles: [], pmRoles: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"users" | "requests" | "logins">("users");
  const [expand, setExpand] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState<{ email?: string } | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) { const d = await res.json(); setUsers(d.users); setOrphans(d.orphanLogins); setMeta({ sysRoles: d.sysRoles, pmRoles: d.pmRoles }); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  // แยก guest → คำขอ, ที่เหลือ → ผู้ใช้จริง
  const realUsers = users.filter((u) => !isGuest(u));
  const guestUsers = users.filter(isGuest);
  const reqTotal = guestUsers.length + orphans.filter((o) => !rejected.includes(o.email)).length;

  async function patch(userId: string, body: any) {
    setUsers((us) => us.map((u) => u.id === userId ? { ...u, ...localApply(u, body) } : u));
    fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, ...body }) });
  }
  function localApply(u: UserRow, b: any): Partial<UserRow> {
    const o: any = {};
    if ("pmRole" in b) o.pm_role = b.pmRole || null;
    if ("sysRoleId" in b) o.roles = [{ id: b.sysRoleId, name: meta.sysRoles.find((r) => r.id === b.sysRoleId)?.name ?? "" }];
    return o;
  }
  async function closeUser(u: UserRow) {
    if (!confirm(`ปิดผู้ใช้ "${u.name || u.email}" ? (จะหายจากระบบ)`)) return;
    setUsers((us) => us.filter((x) => x.id !== u.id));
    fetch(`/api/admin/users?id=${u.id}`, { method: "DELETE" });
  }
  // Approve guest → ให้สิทธิ์ User
  async function approveGuest(u: UserRow) {
    setUsers((us) => us.map((x) => x.id === u.id ? { ...x, roles: [{ id: 2, name: "User" }] } : x));
    await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id, sysRoleId: 2 }) });
    setTab("users");
  }
  // Reject guest → ลบ (จะกลับมา request ใหม่ได้เมื่อ login อีก)
  async function rejectGuest(u: UserRow) {
    setUsers((us) => us.filter((x) => x.id !== u.id));
    fetch(`/api/admin/users?id=${u.id}`, { method: "DELETE" });
  }

  const term = q.trim().toLowerCase();
  const filtered = term ? realUsers.filter((u) => (u.name || "").toLowerCase().includes(term) || u.email.toLowerCase().includes(term)) : realUsers;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, pages);
  const shown = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);
  const admins = realUsers.filter((u) => u.roles.some((r) => r.name === "System Admin")).length;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 18 }}>
        <Stat label="ผู้ใช้งาน" value={realUsers.length} color={NAVY} />
        <Stat label="ผู้ดูแลระบบ" value={admins} color={PINK} />
        <Stat label="คำขอใช้งาน" value={reqTotal} color="#D4A017" />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(["users", "requests", "logins"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ position: "relative", padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13.5, background: tab === t ? NAVY : "#fff", color: tab === t ? "#fff" : "#6B7280", boxShadow: tab === t ? "none" : "0 0 0 1px #E5E7EB inset" }}>
              {t === "users" ? "ผู้ใช้งาน" : t === "requests" ? "ผู้ใช้ใหม่ (คำขอ)" : "ประวัติเข้าระบบ"}
              {t === "requests" && reqTotal > 0 && <span style={{ position: "absolute", top: -6, right: -6, background: "#DC2626", color: "#fff", fontSize: 10.5, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{reqTotal > 9 ? "9+" : reqTotal}</span>}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {tab === "users" && <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="ค้นหาชื่อ / อีเมล..." className="input" style={{ width: 220 }} />}
          <button className="btn-primary" onClick={() => setAddOpen({})}>+ เพิ่มผู้ใช้</button>
        </div>
      </div>

      {loading && <div style={{ color: "#6B7280" }}>กำลังโหลด...</div>}

      {!loading && tab === "users" && (
        <>
          <div className="card" style={{ overflowX: "auto" }}>
            <table>
              <thead><tr style={{ background: "#F9FAFB", textAlign: "left" }}><th style={th}>ผู้ใช้</th><th style={th}>System Role</th><th style={th}>บทบาท PM</th><th style={th}>เข้าล่าสุด</th><th style={th}></th></tr></thead>
              <tbody>
                {shown.length === 0 && <tr><td colSpan={5} style={{ ...td, color: "#9AA0A6" }}>ไม่พบผู้ใช้</td></tr>}
                {shown.map((u) => (
                  <>
                    <tr key={u.id} style={{ borderTop: "1px solid #F0F1F3" }}>
                      <td style={td}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Av u={u} /><div><div style={{ fontWeight: 600 }}>{u.name || "—"}</div><div style={{ fontSize: 12, color: PINK }}>{u.email}</div></div></div></td>
                      <td style={td}><select className="input" style={{ height: 34, width: 150 }} value={u.roles[0]?.id ?? 2} onChange={(e) => patch(u.id, { sysRoleId: Number(e.target.value) })}>{meta.sysRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></td>
                      <td style={td}><select className="input" style={{ height: 34, width: 160 }} value={u.pm_role ?? ""} onChange={(e) => patch(u.id, { pmRole: e.target.value })}><option value="">— ไม่มี —</option>{meta.pmRoles.map((r) => <option key={r}>{r}</option>)}</select></td>
                      <td style={{ ...td, whiteSpace: "nowrap", fontSize: 12.5, color: "#6B7280" }}>{fmtDT(u.last_login_at)}</td>
                      <td style={{ ...td, whiteSpace: "nowrap" }}>
                        <button className="icon-btn" title="ประวัติเข้าระบบ" onClick={() => setExpand(expand === u.id ? null : u.id)} style={iconBtn}><Icon name="log" size={17} /></button>
                        <button className="icon-btn" title="ปิดผู้ใช้ (ลบ)" onClick={() => closeUser(u)} style={{ ...iconBtn, color: "#DC2626" }}><Icon name="close" size={17} /></button>
                      </td>
                    </tr>
                    {expand === u.id && <LoginHistory u={u} />}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 14 }}>
              <button className="btn-ghost" disabled={curPage <= 1} onClick={() => setPage(curPage - 1)} style={{ opacity: curPage <= 1 ? .4 : 1 }}>‹</button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => <button key={p} onClick={() => setPage(p)} style={{ width: 34, height: 34, borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, background: p === curPage ? NAVY : "#fff", color: p === curPage ? "#fff" : "#6B7280", boxShadow: p === curPage ? "none" : "0 0 0 1px #E5E7EB inset" }}>{p}</button>)}
              <button className="btn-ghost" disabled={curPage >= pages} onClick={() => setPage(curPage + 1)} style={{ opacity: curPage >= pages ? .4 : 1 }}>›</button>
            </div>
          )}
        </>
      )}

      {!loading && tab === "requests" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12.5, color: "#6B7280" }}>ผู้ที่ล็อกอินเข้ามาแต่ยังไม่มีสิทธิ์ — กด ✓ อนุมัติ (ให้สิทธิ์ User) หรือ ✗ ปฏิเสธ (เขายังขอเข้าใหม่ได้)</div>
          {reqTotal === 0 && <div className="card" style={{ padding: 16, color: "#9AA0A6" }}>ไม่มีคำขอ</div>}
          {guestUsers.map((u) => (
            <div key={u.id} className="card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Av u={u} /><div><div style={{ fontWeight: 600 }}>{u.name || u.email}</div><div style={{ fontSize: 12, color: "#9AA0A6" }}>{u.email} · เข้าล่าสุด {fmtDT(u.last_login_at)}</div></div></div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="icon-btn" title="อนุมัติ" onClick={() => approveGuest(u)} style={{ ...iconBtn, color: "#fff", background: "#16A34A", border: "none", width: 36, height: 36 }}><Icon name="check" size={18} /></button>
                <button className="icon-btn" title="ปฏิเสธ" onClick={() => rejectGuest(u)} style={{ ...iconBtn, color: "#fff", background: "#DC2626", border: "none", width: 36, height: 36 }}><Icon name="close" size={18} /></button>
              </div>
            </div>
          ))}
          {orphans.filter((o) => !rejected.includes(o.email)).map((o) => (
            <div key={o.email} className="card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div><div style={{ fontWeight: 600 }}>{o.email}</div><div style={{ fontSize: 12, color: "#9AA0A6" }}>ยังไม่มีบัญชี · ล่าสุด {fmtDT(o.lastLogin)} · {o.count} ครั้ง</div></div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="icon-btn" title="อนุมัติ (สร้างผู้ใช้)" onClick={() => setAddOpen({ email: o.email })} style={{ ...iconBtn, color: "#fff", background: "#16A34A", border: "none", width: 36, height: 36 }}><Icon name="check" size={18} /></button>
                <button className="icon-btn" title="ปฏิเสธ" onClick={() => setRejected((r) => [...r, o.email])} style={{ ...iconBtn, color: "#fff", background: "#DC2626", border: "none", width: 36, height: 36 }}><Icon name="close" size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === "logins" && (
        <div className="card" style={{ overflowX: "auto" }}>
          <table><thead><tr style={{ background: "#F9FAFB", textAlign: "left" }}><th style={th}>ผู้ใช้</th><th style={th}>เวลา</th><th style={th}>ช่องทาง</th><th style={th}>อุปกรณ์</th><th style={th}>ผล</th></tr></thead>
            <tbody>{users.flatMap((u) => u.logins.slice(0, 3).map((l, i) => <tr key={u.id + i} style={{ borderTop: "1px solid #F0F1F3" }}><td style={td}>{u.name || u.email}</td><td style={td}>{fmtDT(l.login_time)}</td><td style={td}>{l.auth_provider}</td><td style={td}>{l.device_info ?? "-"}</td><td style={td}>{l.success ? "สำเร็จ" : "ล้มเหลว"}</td></tr>))}</tbody>
          </table>
        </div>
      )}

      {addOpen && <AddUserModal meta={meta} prefill={addOpen.email} onClose={() => setAddOpen(null)} onSaved={() => { setAddOpen(null); load(); }} />}
    </div>
  );
}

function Av({ u }: { u: UserRow }) { const a = u.image || u.avatar_url; return a ? <img src={a} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: 30, height: 30, borderRadius: "50%", background: PINK, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{(u.name || u.email).charAt(0).toUpperCase()}</div>; }
function LoginHistory({ u }: { u: UserRow }) {
  return (<tr><td colSpan={5} style={{ padding: "0 14px 12px", background: "#FafBfc" }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, padding: "8px 0" }}>10 ครั้งล่าสุด</div>
    {u.logins.length === 0 ? <div style={{ color: "#9AA0A6", fontSize: 12.5 }}>ไม่มีประวัติ</div> : (
      <table><thead><tr style={{ textAlign: "left" }}><th style={thS}>เวลา</th><th style={thS}>ช่องทาง</th><th style={thS}>อุปกรณ์</th><th style={thS}>IP</th><th style={thS}>ผล</th></tr></thead>
        <tbody>{u.logins.map((l, i) => <tr key={i}><td style={tdS}>{fmtDT(l.login_time)}</td><td style={tdS}>{l.auth_provider}</td><td style={tdS}>{l.device_info ?? "-"}</td><td style={tdS}>{l.ip_address ?? "-"}</td><td style={tdS}>{l.success ? "สำเร็จ" : "ล้มเหลว"}</td></tr>)}</tbody>
      </table>
    )}
  </td></tr>);
}
function AddUserModal({ meta, prefill, onClose, onSaved }: { meta: Meta; prefill?: string; onClose: () => void; onSaved: () => void }) {
  const [email, setEmail] = useState(prefill ?? ""); const [name, setName] = useState(""); const [sysRoleId, setSysRoleId] = useState(2); const [pmRole, setPmRole] = useState(""); const [saving, setSaving] = useState(false); const [err, setErr] = useState<string | null>(null);
  async function submit() {
    if (!email.trim()) { setErr("กรอกอีเมล"); return; }
    setSaving(true); setErr(null);
    const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, name, sysRoleId, pmRole: pmRole || null }) });
    setSaving(false);
    if (!res.ok) { const j = await res.json().catch(() => ({})); setErr(j.error || "เพิ่มไม่สำเร็จ"); return; }
    onSaved();
  }
  return (
    <div style={overlay}><div className="card" style={{ width: "min(440px,94vw)", padding: 22 }} onClick={(e) => e.stopPropagation()}>
      <h3 style={{ marginTop: 0, color: NAVY }}>เพิ่มผู้ใช้</h3>
      {err && <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: 10, borderRadius: 8, marginBottom: 10 }}>{err}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <L label="อีเมล *"><input className="input" placeholder="Xxxxx" value={email} onChange={(e) => setEmail(e.target.value)} /></L>
        <L label="ชื่อ"><input className="input" placeholder="Xxxxx" value={name} onChange={(e) => setName(e.target.value)} /></L>
        <L label="System Role"><select className="input" value={sysRoleId} onChange={(e) => setSysRoleId(Number(e.target.value))}>{meta.sysRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></L>
        <L label="บทบาท PM"><select className="input" value={pmRole} onChange={(e) => setPmRole(e.target.value)}><option value="">— ไม่มี —</option>{meta.pmRoles.map((r) => <option key={r}>{r}</option>)}</select></L>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}><button className="btn-ghost" onClick={onClose}>ยกเลิก</button><button className="btn-primary" onClick={submit} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button></div>
    </div></div>
  );
}
function Stat({ label, value, color }: { label: string; value: number; color: string }) { return <div className="card" style={{ padding: "16px 20px", borderTop: `3px solid ${color}` }}><div style={{ fontSize: 13, color: "#6B7280" }}>{label}</div><div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div></div>; }
function L({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</span>{children}</label>; }
const th: React.CSSProperties = { padding: "11px 14px", fontSize: 12.5, fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "11px 14px", fontSize: 13.5 };
const thS: React.CSSProperties = { padding: "6px 10px", fontSize: 11.5, color: "#6B7280", fontWeight: 600 };
const tdS: React.CSSProperties = { padding: "6px 10px", fontSize: 12 };
const iconBtn: React.CSSProperties = { background: "transparent", border: "1px solid #E5E7EB", borderRadius: 8, width: 32, height: 32, cursor: "pointer", marginLeft: 6, color: "#6B7280", display: "inline-flex", alignItems: "center", justifyContent: "center", verticalAlign: "middle" };
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 };

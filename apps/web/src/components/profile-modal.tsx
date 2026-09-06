"use client";
import { useEffect, useState } from "react";
import { cachedFetch, TTL, writeCache } from "@/lib/cache";

const NAVY = "#001D58", PINK = "#EC186E";
type Profile = { id: string; name: string | null; email: string; company_email: string | null; phone: string | null; telegram_user_id: string | null; telegram_notify: number; image: string | null; avatar_url: string | null; pm_role: string | null; has_password: boolean };
type ImpUser = { id: string; name: string | null; email: string };
type TabKey = "profile" | "notify" | "password" | "admin";

export function ProfileModal({ isAdmin, impersonating, onClose }: { isAdmin: boolean; impersonating: boolean; onClose: () => void }) {
  const [p, setP] = useState<Profile | null>(null);
  const [tab, setTab] = useState<TabKey>("profile");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pw1, setPw1] = useState(""); const [pw2, setPw2] = useState("");
  const [users, setUsers] = useState<ImpUser[]>([]);
  const [impSel, setImpSel] = useState("");

  useEffect(() => {
    // โปรไฟล์เปลี่ยนไม่บ่อย → โชว์จาก cache ทันที (เมนู logout ไม่ต้องรอโหลด) แล้วแอบ sync
    cachedFetch<{ profile: Profile }>("profile", "/api/profile", TTL.profile, (d) => setP(d.profile));
    if (isAdmin) cachedFetch<{ users: any[] }>("admin_users_min", "/api/admin/users", TTL.medium, (d) => { if (d.users) setUsers(d.users.map((u: any) => ({ id: u.id, name: u.name, email: u.email }))); });
  }, [isAdmin]);

  function set<K extends keyof Profile>(k: K, v: Profile[K]) { setP((s) => (s ? { ...s, [k]: v } : s)); }
  function flash(type: "ok" | "err", text: string) { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500); }

  async function saveProfile() {
    if (!p) return; setSaving(true);
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: p.name, companyEmail: p.company_email, phone: p.phone }) });
    setSaving(false); if (res.ok && p) writeCache("profile", { profile: p }); flash(res.ok ? "ok" : "err", res.ok ? "บันทึกโปรไฟล์แล้ว" : "บันทึกไม่สำเร็จ");
  }
  async function saveNotify() {
    if (!p) return; setSaving(true);
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telegramUserId: p.telegram_user_id, telegramNotify: p.telegram_notify }) });
    setSaving(false); flash(res.ok ? "ok" : "err", res.ok ? "บันทึกการตั้งค่าแจ้งเตือนแล้ว" : "บันทึกไม่สำเร็จ");
  }
  async function savePassword() {
    if (pw1.length < 6) { flash("err", "รหัสผ่านอย่างน้อย 6 ตัว"); return; }
    if (pw1 !== pw2) { flash("err", "รหัสผ่านไม่ตรงกัน"); return; }
    const res = await fetch("/api/profile/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw1 }) });
    flash(res.ok ? "ok" : "err", res.ok ? "ตั้งรหัสผ่านแล้ว" : "ตั้งรหัสผ่านไม่สำเร็จ");
    if (res.ok) { setPw1(""); setPw2(""); set("has_password", true); }
  }
  async function testTelegram() {
    // ต้องบันทึก ID ก่อน แล้วค่อยเทส เพื่อกัน "chat not found" จาก ID ที่ยังไม่ save
    if (p) await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telegramUserId: p.telegram_user_id, telegramNotify: p.telegram_notify }) });
    const res = await fetch("/api/notify/test", { method: "POST" });
    const j = await res.json().catch(() => ({}));
    flash(j.ok ? "ok" : "err", j.ok ? "ส่งข้อความทดสอบไป Telegram แล้ว ✓" : (j.error || "ส่งไม่สำเร็จ"));
  }
  async function impersonate() {
    if (!impSel) return;
    await fetch("/api/admin/impersonate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: impSel }) });
    location.href = "/pm/dashboard";
  }

  const avatar = p?.image || p?.avatar_url;
  const tabs: { key: TabKey; label: string }[] = [
    { key: "profile", label: "โปรไฟล์" },
    { key: "notify", label: "แจ้งเตือน" },
    { key: "password", label: "รหัสผ่าน" },
    ...(isAdmin ? [{ key: "admin" as TabKey, label: "Admin" }] : []),
  ];

  return (
    <div style={overlay}>
      <div className="card" style={{ width: "min(480px,96vw)", height: 600, maxHeight: "94vh", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        {/* header (fixed) */}
        <div style={{ background: NAVY, color: "#fff", padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            {avatar ? <img src={avatar} alt="" style={{ width: 58, height: 58, borderRadius: "50%", objectFit: "cover", border: "2px solid #fff" }} /> : <div style={{ width: 58, height: 58, borderRadius: "50%", background: PINK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700 }}>{(p?.name || p?.email || "?").charAt(0).toUpperCase()}</div>}

          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p?.name || "—"}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p?.email}</div>
            <div style={{ marginTop: 4, display: "inline-block", background: "rgba(255,255,255,.15)", padding: "2px 10px", borderRadius: 20, fontSize: 11 }}>{isAdmin ? "System Admin" : p?.pm_role ? "User" : "Guest"}{p?.pm_role ? ` · ${p.pm_role}` : ""}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", alignSelf: "flex-start" }}>×</button>
        </div>

        {/* tabs (fixed) */}
        <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", flexShrink: 0 }}>
          {tabs.map((t) => {
            const a = t.key === tab;
            return <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: "11px 0", border: "none", background: "transparent", borderBottom: a ? `2.5px solid ${PINK}` : "2.5px solid transparent", color: a ? NAVY : "#9AA0A6", fontWeight: a ? 700 : 500, fontSize: 13, cursor: "pointer" }}>{t.label}</button>;
          })}
        </div>

        {/* body (scroll) */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {msg && <div style={{ background: msg.type === "ok" ? "#ECFDF5" : "#FEF2F2", color: msg.type === "ok" ? "#047857" : "#B91C1C", padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{msg.text}</div>}
        
          {p && tab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <Row label="ชื่อที่แสดง (Display Name)"><input className="input" value={p.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="ตั้งชื่อที่ต้องการแสดง" /></Row>
              <Row label="เบอร์โทรติดต่อ"><input className="input" value={p.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="เช่น 081-234-5678" /></Row>
              <Row label="อีเมลบริษัท"><input className="input" value={p.company_email ?? ""} onChange={(e) => set("company_email", e.target.value)} placeholder="name@viriyah.co.th" /></Row>
            </div>
          )}

          {p && tab === "notify" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <Row label="Telegram User ID"><input className="input" value={p.telegram_user_id ?? ""} onChange={(e) => set("telegram_user_id", e.target.value)} placeholder="เช่น 5848280169" /></Row>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 13.5 }}>เปิดรับการแจ้งเตือนจากบอท</span>
                <Toggle on={!!p.telegram_notify} onChange={(v) => set("telegram_notify", v ? 1 : 0)} />
              </div>
              <button className="btn-ghost" onClick={testTelegram} style={{ alignSelf: "flex-start" }}>บันทึก & ทดสอบส่งข้อความ</button>
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: 12, fontSize: 12, color: "#92400E", lineHeight: 1.8 }}>
                <b>⚠️ ถ้าเจอ "chat not found"</b> ให้ทำ 3 ขั้นนี้ก่อน:<br />
                1. เปิด Telegram ค้นหาบอทของระบบ แล้วกด <b>Start</b> (บอทส่งหาคนที่ยังไม่เคยเริ่มแชทไม่ได้)<br />
                2. หา User ID ของตัวเองจาก <b>@userinfobot</b> (เป็นตัวเลข ไม่ใช่ @username)<br />
                3. ใส่เลขนั้นในช่องด้านบน → กดปุ่มทดสอบ
              </div>
            </div>
          )}

          {p && tab === "password" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div style={{ fontSize: 12.5, color: "#6B7280" }}>{p.has_password ? "ตั้งรหัสผ่านไว้แล้ว — กรอกใหม่เพื่อเปลี่ยน" : "ยังไม่มีรหัสผ่าน — ตั้งเพื่อใช้ login แบบอีเมล"}</div>
              <Row label="รหัสผ่านใหม่"><input className="input" type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร" /></Row>
              <Row label="ยืนยันรหัสผ่าน"><input className="input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="พิมพ์ซ้ำอีกครั้ง" /></Row>
              <button className="btn-primary" onClick={savePassword} style={{ alignSelf: "flex-start" }}>{p.has_password ? "อัปเดตรหัสผ่าน" : "ตั้งรหัสผ่าน"}</button>
            </div>
          )}

          {tab === "admin" && isAdmin && (
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>🔁 สลับมุมมองเป็นผู้ใช้อื่น</div>
              {impersonating ? (
                <div style={{ fontSize: 13, color: "#92400E", background: "#FEF3C7", padding: 12, borderRadius: 8 }}>กำลังสวมบทบาทอยู่ — กด "ออกจากมุมมองนี้" ที่แถบเหลืองด้านบนเพื่อกลับ</div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>ดูระบบเหมือนที่ผู้ใช้คนนั้นเห็น และทำรายการแทนได้ กลับมาเมื่อไหร่ก็ได้</div>
                  <select className="input" value={impSel} onChange={(e) => setImpSel(e.target.value)}>
                    <option value="">— เลือกผู้ใช้ —</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{(u.name || u.email)} ({u.email})</option>)}
                  </select>
                  <button className="btn-primary" onClick={impersonate} disabled={!impSel} style={{ alignSelf: "flex-start" }}>สวมบทบาท</button>
                </>
              )}
            </div>
          )}
        </div>

        {/* footer (fixed) */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, borderTop: "1px solid #F0F1F3", padding: "14px 20px", flexShrink: 0 }}>
          <a href="/api/logout" onClick={() => { try { Object.keys(localStorage).forEach((k) => { if (k.startsWith("pmcache:") || k.startsWith("meetings:") || k.startsWith("pending_req")) localStorage.removeItem(k); }); } catch {} }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "1px solid #FCA5A5", color: "#DC2626", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>↩︎ ออกจากระบบ</a>
          {tab === "profile" && <button className="btn-primary" onClick={saveProfile} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}</button>}
          {tab === "notify" && <button className="btn-primary" onClick={saveNotify} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึกการแจ้งเตือน"}</button>}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 12.5, color: "#6B7280" }}>{label}</span>{children}</label>;
}
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return <button onClick={() => onChange(!on)} style={{ width: 46, height: 26, borderRadius: 20, border: "none", cursor: "pointer", background: on ? PINK : "#D1D5DB", position: "relative", transition: "background .15s", flexShrink: 0 }}><span style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .15s" }} /></button>;
}
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 };

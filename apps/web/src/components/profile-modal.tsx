"use client";
import { useEffect, useState } from "react";
import { uploadToGoogleDrive } from "@/lib/upload";

const NAVY = "#001D58", PINK = "#EC186E";
type Profile = { id: string; name: string | null; email: string; company_email: string | null; phone: string | null; telegram_user_id: string | null; telegram_notify: number; image: string | null; avatar_url: string | null; pm_role: string | null; has_password: boolean };
type ImpUser = { id: string; name: string | null; email: string };

export function ProfileModal({ isAdmin, impersonating, onClose }: { isAdmin: boolean; impersonating: boolean; onClose: () => void }) {
  const [p, setP] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pw1, setPw1] = useState(""); const [pw2, setPw2] = useState("");
  const [uploading, setUploading] = useState(false);
  const [users, setUsers] = useState<ImpUser[]>([]);
  const [impSel, setImpSel] = useState("");
  const [systemRole, setSystemRole] = useState("");

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((d) => { setP(d.profile); });
    if (isAdmin) fetch("/api/admin/users").then((r) => r.json()).then((d) => { if (d.users) setUsers(d.users.map((u: any) => ({ id: u.id, name: u.name, email: u.email }))); });
  }, [isAdmin]);

  function set<K extends keyof Profile>(k: K, v: Profile[K]) { setP((s) => (s ? { ...s, [k]: v } : s)); }

  async function save() {
    if (!p) return; setSaving(true); setMsg(null);
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: p.name, companyEmail: p.company_email, phone: p.phone, telegramUserId: p.telegram_user_id, telegramNotify: p.telegram_notify, avatarUrl: p.avatar_url }) });
    setSaving(false);
    setMsg(res.ok ? { type: "ok", text: "บันทึกโปรไฟล์แล้ว" } : { type: "err", text: "บันทึกไม่สำเร็จ" });
  }
  async function savePassword() {
    if (pw1.length < 6) { setMsg({ type: "err", text: "รหัสผ่านอย่างน้อย 6 ตัว" }); return; }
    if (pw1 !== pw2) { setMsg({ type: "err", text: "รหัสผ่านไม่ตรงกัน" }); return; }
    const res = await fetch("/api/profile/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw1 }) });
    setMsg(res.ok ? { type: "ok", text: "ตั้งรหัสผ่านแล้ว" } : { type: "err", text: "ตั้งรหัสผ่านไม่สำเร็จ" });
    if (res.ok) { setPw1(""); setPw2(""); set("has_password", true); }
  }
  async function testTelegram() {
    setMsg(null);
    const res = await fetch("/api/notify/test", { method: "POST" });
    const j = await res.json().catch(() => ({}));
    setMsg(j.ok ? { type: "ok", text: "ส่งข้อความทดสอบไป Telegram แล้ว" } : { type: "err", text: j.error || "ส่งไม่สำเร็จ" });
  }
  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setMsg(null);
    const r = await uploadToGoogleDrive(file);
    setUploading(false);
    if (r.ok && r.url) { set("avatar_url", r.url); setMsg({ type: "ok", text: "อัปโหลดรูปแล้ว กด บันทึกโปรไฟล์ เพื่อยืนยัน" }); }
    else setMsg({ type: "err", text: r.error || "อัปโหลดไม่สำเร็จ" });
  }
  async function impersonate() {
    if (!impSel) return;
    await fetch("/api/admin/impersonate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: impSel }) });
    location.href = "/pm/dashboard";
  }

  const avatar = p?.avatar_url || p?.image;
  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={{ width: "min(560px,96vw)", maxHeight: "92vh", overflowY: "auto", padding: 0 }} onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div style={{ background: NAVY, color: "#fff", padding: "20px 22px", display: "flex", alignItems: "center", gap: 16, borderRadius: "12px 12px 0 0" }}>
          <div style={{ position: "relative" }}>
            {avatar ? <img src={avatar} alt="" style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover", border: "2px solid #fff" }} /> : <div style={{ width: 68, height: 68, borderRadius: "50%", background: PINK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700 }}>{(p?.name || p?.email || "?").charAt(0).toUpperCase()}</div>}
            <label style={{ position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderRadius: "50%", background: PINK, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12, border: "2px solid #fff" }} title="เปลี่ยนรูป">📷<input type="file" accept="image/*" hidden onChange={onAvatar} /></label>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{p?.name || "—"}</div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.75)" }}>{p?.email}</div>
            <div style={{ marginTop: 4, display: "inline-block", background: "rgba(255,255,255,.15)", padding: "2px 10px", borderRadius: 20, fontSize: 11.5 }}>{isAdmin ? "System Admin" : p?.pm_role ? "User" : "Guest"}{p?.pm_role ? ` · ${p.pm_role}` : ""}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          {msg && <div style={{ background: msg.type === "ok" ? "#ECFDF5" : "#FEF2F2", color: msg.type === "ok" ? "#047857" : "#B91C1C", padding: 10, borderRadius: 8, fontSize: 13 }}>{msg.text}</div>}
          {uploading && <div style={{ fontSize: 13, color: "#6B7280" }}>กำลังอัปโหลดรูป...</div>}

          {p && <>
            <Section title="ข้อมูลติดต่อ">
              <Row label="ชื่อที่แสดง (Display Name)"><input className="input" value={p.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="ตั้งชื่อที่ต้องการแสดง" /></Row>
              <Row label="เบอร์โทรติดต่อ"><input className="input" value={p.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="เช่น 081-234-5678" /></Row>
              <Row label="อีเมลบริษัท"><input className="input" value={p.company_email ?? ""} onChange={(e) => set("company_email", e.target.value)} placeholder="name@viriyah.co.th" /></Row>
              <Row label="อีเมลเข้าระบบ (แก้ไม่ได้)"><input className="input" value={p.email} disabled style={{ background: "#F9FAFB", color: "#9AA0A6" }} /></Row>
            </Section>

            <Section title="การแจ้งเตือน Telegram">
              <Row label="Telegram User ID"><input className="input" value={p.telegram_user_id ?? ""} onChange={(e) => set("telegram_user_id", e.target.value)} placeholder="เช่น 5848280169" /></Row>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 13.5 }}>เปิดรับการแจ้งเตือนจากบอท</span>
                <Toggle on={!!p.telegram_notify} onChange={(v) => set("telegram_notify", v ? 1 : 0)} />
              </div>
              <button className="btn-ghost" onClick={testTelegram} style={{ alignSelf: "flex-start" }}>ทดสอบส่งข้อความ</button>
              <div style={{ fontSize: 11.5, color: "#9AA0A6" }}>เปิด Telegram หา bot ของระบบ แล้วกด Start เพื่อให้บอทส่งหาได้ · หา User ID ได้จาก @userinfobot</div>
            </Section>

            <Section title="ความปลอดภัย">
              <Row label={p.has_password ? "เปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่าน (สำหรับ login แบบ Local)"}><input className="input" type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)" /></Row>
              <Row label="ยืนยันรหัสผ่าน"><input className="input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="พิมพ์ซ้ำอีกครั้ง" /></Row>
              <button className="btn-ghost" onClick={savePassword} style={{ alignSelf: "flex-start" }}>{p.has_password ? "อัปเดตรหัสผ่าน" : "ตั้งรหัสผ่าน"}</button>
            </Section>

            {isAdmin && !impersonating && (
              <Section title="🔁 สลับมุมมองเป็นผู้ใช้อื่น (Admin)">
                <div style={{ fontSize: 12, color: "#6B7280" }}>ดูระบบเหมือนที่ผู้ใช้คนนั้นเห็น และทำรายการแทนได้ กลับมาเมื่อไหร่ก็ได้</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <select className="input" value={impSel} onChange={(e) => setImpSel(e.target.value)}>
                    <option value="">— เลือกผู้ใช้ —</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{(u.name || u.email)} ({u.email})</option>)}
                  </select>
                  <button className="btn-primary" onClick={impersonate} disabled={!impSel} style={{ whiteSpace: "nowrap" }}>สวมบทบาท</button>
                </div>
              </Section>
            )}
          </>}

          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, borderTop: "1px solid #F0F1F3", paddingTop: 16 }}>
            <a href="/api/logout" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "1px solid #FCA5A5", color: "#DC2626", textDecoration: "none", fontWeight: 600 }}>↩︎ ออกจากระบบ</a>
            <button className="btn-primary" onClick={save} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}><div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{title}</div>{children}</div>;
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 12.5, color: "#6B7280" }}>{label}</span>{children}</label>;
}
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return <button onClick={() => onChange(!on)} style={{ width: 46, height: 26, borderRadius: 20, border: "none", cursor: "pointer", background: on ? PINK : "#D1D5DB", position: "relative", transition: "background .15s" }}><span style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .15s" }} /></button>;
}
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 };

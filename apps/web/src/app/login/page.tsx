"use client";
import { Suspense, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
const NAVY = "#001D58", PINK = "#EC186E";
function LoginContent() {
  const sp = useSearchParams();
  const urlError = sp.get("error"); const detail = sp.get("detail");
  const [tab, setTab] = useState<"google" | "local">("google");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  async function handleLocal(e: FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error ?? "เข้าสู่ระบบไม่สำเร็จ"); setLoading(false); return; }
      window.location.href = "/pm/dashboard";
    } catch { setError("เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่"); setLoading(false); }
  }
  const banner = error ?? (urlError === "NoClientId" ? "ยังไม่ได้ตั้งค่า Google (GOOGLE_CLIENT_ID) — แจ้งผู้ดูแล" : urlError === "OAuthSignin" || urlError === "OAuthCallback" ? "เชื่อมต่อ Google ไม่สำเร็จ" : urlError ? "เข้าสู่ระบบไม่สำเร็จ" : null);
  const tabBtn = (active: boolean): CSSProperties => ({ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: active ? "#fff" : "transparent", color: active ? NAVY : "#9AA0A6", boxShadow: active ? "0 1px 3px rgba(0,0,0,.1)" : "none" });
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#001D58,#0A2E7A)", padding: 20 }}>
      <div className="card" style={{ width: "min(420px,94vw)", padding: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 22 }}>
          <img src="/rocket-logo.png" alt="Portfolio" style={{ width: 72, height: 72, objectFit: "contain", marginBottom: 12 }} />
          <h1 style={{ margin: 0, fontSize: 20, color: NAVY }}>Portfolio Workspace</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>เข้าสู่ระบบเพื่อเริ่มใช้งาน</p>
        </div>
        <div style={{ display: "flex", gap: 4, background: "#F4F4F6", padding: 4, borderRadius: 10, marginBottom: 18 }}>
          <button onClick={() => { setTab("google"); setError(null); }} style={tabBtn(tab === "google")}>บัญชี Google</button>
          <button onClick={() => { setTab("local"); setError(null); }} style={tabBtn(tab === "local")}>อีเมล + รหัสผ่าน</button>
        </div>
        {banner && <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{banner}{detail && <div style={{ fontSize: 11, color: "#9AA0A6", marginTop: 4 }}>รายละเอียด: {detail}</div>}</div>}
        {tab === "google" ? (
          <a href="/api/auth/google" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, height: 48, borderRadius: 10, border: "1px solid #E5E7EB", textDecoration: "none", color: "#374151", fontWeight: 600, fontSize: 14, background: "#fff" }}>
            <svg width="19" height="19" viewBox="0 0 48 48" style={{ flexShrink: 0 }}><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.5 29.3 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.5 29.3 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39 16.2 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.2-.1-2.3-.4-3.5z"/></svg>
            เข้าสู่ระบบด้วย Google</a>
        ) : (
          <form onSubmit={handleLocal} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input className="input" style={{ height: 44 }} type="email" placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input" style={{ height: 44 }} type="password" placeholder="รหัสผ่าน" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" className="btn-primary" style={{ height: 48 }} disabled={loading}>{loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</button>
          </form>
        )}
        <p style={{ textAlign: "center", fontSize: 12, color: "#9AA0A6", marginTop: 18 }}>ติดต่อ ponnsth@gmail.com เพื่อเริ่มใช้งานครั้งแรก</p>
      </div>
    </div>
  );
}
export default function LoginPage() { return <Suspense><LoginContent /></Suspense>; }

"use client";
import { Suspense, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { RocketLogo } from "@/components/icons";
const NAVY = "#001D58", PINK = "#EC186E";
function LoginContent() {
  const sp = useSearchParams();
  const urlError = sp.get("error"); const detail = sp.get("detail");
  const [tab, setTab] = useState<"google" | "local">("local");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  async function handleLocal(e: FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error ?? "เข้าสู่ระบบไม่สำเร็จ"); setLoading(false); return; }
      window.location.href = "/";
    } catch { setError("เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่"); setLoading(false); }
  }
  const banner = error ?? (urlError === "NoClientId" ? "ยังไม่ได้ตั้งค่า Google (GOOGLE_CLIENT_ID) — แจ้งผู้ดูแล" : urlError === "OAuthSignin" || urlError === "OAuthCallback" ? "เชื่อมต่อ Google ไม่สำเร็จ" : urlError ? "เข้าสู่ระบบไม่สำเร็จ" : null);
  const tabBtn = (active: boolean): CSSProperties => ({ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: active ? "#fff" : "transparent", color: active ? NAVY : "#9AA0A6", boxShadow: active ? "0 1px 3px rgba(0,0,0,.1)" : "none" });
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#001D58,#0A2E7A)", padding: 20 }}>
      <div className="card" style={{ width: "min(420px,94vw)", padding: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 22 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, color: "#fff" }}><RocketLogo size={36} /></div>
          <h1 style={{ margin: 0, fontSize: 20, color: NAVY }}>Portfolio Workspace</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>เข้าสู่ระบบเพื่อเริ่มใช้งาน</p>
        </div>
        <div style={{ display: "flex", gap: 4, background: "#F4F4F6", padding: 4, borderRadius: 10, marginBottom: 18 }}>
          <button onClick={() => { setTab("google"); setError(null); }} style={tabBtn(tab === "google")}>บัญชี Google</button>
          <button onClick={() => { setTab("local"); setError(null); }} style={tabBtn(tab === "local")}>อีเมล + รหัสผ่าน</button>
        </div>
        {banner && <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{banner}{detail && <div style={{ fontSize: 11, color: "#9AA0A6", marginTop: 4 }}>รายละเอียด: {detail}</div>}</div>}
        {tab === "google" ? (
          <a href="/api/auth/google" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, height: 48, borderRadius: 10, border: "1px solid #E5E7EB", textDecoration: "none", color: "#374151", fontWeight: 600, fontSize: 14 }}>เข้าสู่ระบบด้วย Google</a>
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

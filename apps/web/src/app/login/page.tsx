"use client";
import Image from "next/image";
import { Suspense, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const CONTENT_MIN_HEIGHT = 168;

const PRIMARY_BUTTON_STYLE: CSSProperties = {
  width: "100%",
  height: 48,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  boxSizing: "border-box",
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [tab, setTab] = useState<"google" | "local">("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLocalLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
        setLoading(false);
        return;
      }
      // login สำเร็จ → cookie ถูก set แล้ว ไปหน้าแรก
      window.location.href = "/";
    } catch {
      setError("เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่");
      setLoading(false);
    }
  }

  const bannerText =
    error ??
    (urlError === "OAuthSignin" || urlError === "OAuthCallback"
      ? "เชื่อมต่อ Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
      : urlError
      ? "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
      : null);

  return (
    <main
      style={{
        height: "100dvh",
        width: "100vw",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #001D58 0%, #00133d 60%, #000a24 100%)",
        boxSizing: "border-box",
        padding: 16,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380, background: "#fff", borderRadius: 20, padding: "28px 28px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", textAlign: "center", boxSizing: "border-box" }}>
        <div style={{ width: 64, height: 64, margin: "0 auto 16px", borderRadius: 16, background: "#F4F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Image src="/rocket-logo.png" alt="Portfolio Workspace" width={40} height={40} priority />
        </div>

        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#001D58" }}>Portfolio Workspace</h1>
        <p style={{ margin: "4px 0 20px", fontSize: 13, color: "#6B7280" }}>ระบบบริหารพอร์ตโครงการองค์กร</p>

        <div style={{ display: "flex", background: "#F4F4F6", borderRadius: 10, padding: 4, marginBottom: 16 }}>
          <button onClick={() => { setTab("google"); setError(null); }} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: tab === "google" ? "#fff" : "transparent", color: tab === "google" ? "#001D58" : "#9AA0A6", boxShadow: tab === "google" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
            บัญชี Google
          </button>
          <button onClick={() => { setTab("local"); setError(null); }} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: tab === "local" ? "#fff" : "transparent", color: tab === "local" ? "#001D58" : "#9AA0A6", boxShadow: tab === "local" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
            อีเมล + รหัสผ่าน
          </button>
        </div>

        {bannerText && (
          <div style={{ background: "#FEF2F2", color: "#B91C1C", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 16, textAlign: "left" }}>{bannerText}</div>
        )}

        <div style={{ minHeight: CONTENT_MIN_HEIGHT }}>
          {tab === "google" ? (
            <a href="/api/auth/google" style={{ ...PRIMARY_BUTTON_STYLE, background: "#fff", color: "#1F2937", border: "1px solid #E5E7EB", textDecoration: "none" }}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3l5.7-5.7C34.5 6 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.6 18.9 13 24 13c3.1 0 5.9 1.1 8 3l5.7-5.7C34.5 6 29.5 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" />
                <path fill="#4CAF50" d="M24 44c5.3 0 10.2-2 13.9-5.3l-6.4-5.4C29.4 34.9 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.4 5.4C41.6 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-3.5z" />
              </svg>
              เลือกบัญชี Google
            </a>
          ) : (
            <form onSubmit={handleLocalLogin} style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="email" required placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", height: 44, padding: "0 14px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 14, boxSizing: "border-box" }} />
              <input type="password" required placeholder="รหัสผ่าน" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", height: 44, padding: "0 14px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 14, boxSizing: "border-box" }} />
              <button type="submit" disabled={loading} style={{ ...PRIMARY_BUTTON_STYLE, background: "#001D58", color: "#fff", border: "none", opacity: loading ? 0.7 : 1 }}>
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>
          )}
        </div>

        <p style={{ marginTop: 16, fontSize: 11, color: "#9AA0A6" }}>Login ก่อนใช้งาน หรือ ติดต่อ ponnsth@gmail.com</p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

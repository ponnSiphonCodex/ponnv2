"use client";
/**
 * apps/web/src/app/login/page.tsx
 *
 * ดีไซน์ตามภาพอ้างอิง: gradient navy BG, card ขาวตรงกลาง, ไอคอนบ้าน, toggle
 * Google/Email (default = Google), version footer มุมล่างซ้าย
 *
 * Google: ใช้ Google Identity Services (GIS) ยิง ID token ตรงไปที่
 * /api/auth/google — ไม่ผ่าน NextAuth OAuth redirect flow (จุดที่เคยพังบ่อย)
 * Email: ยิงไปที่ /api/auth/login (ต้องตั้งรหัสผ่านผ่าน /setup ก่อน)
 */
import { useEffect, useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { VERSION_LABEL } from "@/version";

const GOOGLE_CLIENT_ID = "71834421978-cuhvt0kbulcki1e8q4e1d7pmt1kq8sk6.apps.googleusercontent.com";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

type Tab = "google" | "email";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("google"); // default = Google ตามที่ขอ
  const [gisReady, setGisReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function finishLogin(res: Response) {
    let data: { ok: boolean; error?: string };
    try {
      data = (await res.json()) as { ok: boolean; error?: string };
    } catch {
      // res ไม่ใช่ JSON (เช่น Cloudflare ส่ง HTML error page มา) — บอกสถานะ HTTP ตรง ๆ
      setErrorMsg(`เชื่อมต่อไม่สำเร็จ (HTTP ${res.status}) — ลองใหม่อีกครั้ง หรือแจ้งผู้ดูแลระบบ`);
      return;
    }

    if (data.ok) {
      router.push("/");
      router.refresh();
    } else {
      setErrorMsg(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
    }
  }

  async function handleCredentialResponse(response: { credential: string }) {
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      await finishLogin(res);
    } catch (err) {
      setErrorMsg("เชื่อมต่อเครือข่ายไม่สำเร็จ: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      setGisReady(true);
    };
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!gisReady || tab !== "google" || !window.google) return;
    const container = document.getElementById("google-signin-button");
    if (container) {
      container.innerHTML = "";
      window.google.accounts.id.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: 280,
        locale: "th",
      });
    }
  }, [gisReady, tab]);

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setEmailLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      await finishLogin(res);
    } catch (err) {
      setErrorMsg("เชื่อมต่อเครือข่ายไม่สำเร็จ: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setEmailLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "'Sarabun', sans-serif",
        background: "linear-gradient(160deg, #001D58 0%, #0B2C63 55%, #001640 100%)",
        position: "relative",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "32px 28px",
          width: "100%",
          maxWidth: 360,
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        {/* ไอคอนบ้าน */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "#F4F4F6",
            border: "1.5px solid #E5E7EB",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#001D58" strokeWidth="2">
            <path d="M3 10.5L12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 10v11h14V10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 style={{ textAlign: "center", fontSize: 19, fontWeight: 700, color: "#111827", margin: 0 }}>
          PM Platform
        </h1>
        <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 4, marginBottom: 20 }}>
          Project Management &amp; Portfolio
        </p>

        {/* Toggle Google / Email — default = Google */}
        <div
          style={{
            display: "flex",
            background: "#F4F4F6",
            borderRadius: 10,
            padding: 4,
            gap: 4,
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            onClick={() => setTab("google")}
            style={{
              flex: 1,
              border: "none",
              borderRadius: 7,
              padding: "9px 6px",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              background: tab === "google" ? "#fff" : "transparent",
              color: tab === "google" ? "#001D58" : "#6B7280",
              boxShadow: tab === "google" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              fontFamily: "inherit",
            }}
          >
            บัญชี Google
          </button>
          <button
            type="button"
            onClick={() => setTab("email")}
            style={{
              flex: 1,
              border: "none",
              borderRadius: 7,
              padding: "9px 6px",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              background: tab === "email" ? "#fff" : "transparent",
              color: tab === "email" ? "#001D58" : "#6B7280",
              boxShadow: tab === "email" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              fontFamily: "inherit",
            }}
          >
            อีเมล + รหัสผ่าน
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              background: "#FCEDEB",
              color: "#C0392B",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 12.5,
              marginBottom: 16,
              lineHeight: 1.6,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* แท็บ Google — เก็บ container ไว้เสมอ ซ่อนด้วย display แทนการ unmount
            เพื่อไม่ให้ GIS ต้อง re-init ทุกครั้งที่สลับแท็บ */}
        <div style={{ display: tab === "google" ? "block" : "none" }}>
          <div id="google-signin-button" style={{ display: "flex", justifyContent: "center", minHeight: 44 }} />
          {!gisReady && (
            <p style={{ textAlign: "center", fontSize: 12.5, color: "#9AA0A6", marginTop: 10 }}>
              กำลังเตรียมปุ่ม Google...
            </p>
          )}
          <p style={{ textAlign: "center", fontSize: 12, color: "#9AA0A6", marginTop: 14, lineHeight: 1.7 }}>
            กดปุ่มด้านบนเพื่อเลือกบัญชี Google ของคุณ
          </p>
        </div>

        {/* แท็บ Email + Password */}
        {tab === "email" && (
          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              required
              placeholder="อีเมล"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              required
              placeholder="รหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inputStyle, marginTop: 10 }}
            />
            <button
              type="submit"
              disabled={emailLoading}
              style={{
                width: "100%",
                marginTop: 14,
                background: "#001D58",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "12px 0",
                fontSize: 14.5,
                fontWeight: 600,
                cursor: emailLoading ? "not-allowed" : "pointer",
                opacity: emailLoading ? 0.6 : 1,
                fontFamily: "inherit",
              }}
            >
              {emailLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        )}
      </div>

      {/* Version footer มุมล่างซ้าย */}
      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: 20,
          fontSize: 11.5,
          color: "rgba(255,255,255,0.55)",
          fontFamily: "'Sarabun', sans-serif",
        }}
      >
        {VERSION_LABEL}
      </div>
    </main>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "11px 13px",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  fontSize: 14,
  fontFamily: "inherit",
  boxSizing: "border-box",
};

"use client";
/**
 * apps/web/src/app/login/page.tsx
 *
 * Google: ใช้ OAuth2 token client (initTokenClient + prompt:'select_account')
 * แทนปุ่ม GIS ID-token เดิม เพราะปุ่มแบบเดิมจะโชว์ "ลงชื่อเข้าใช้เป็น [ชื่อ]"
 * ของบัญชีที่ browser จำไว้ทันที — วิธีนี้เปิด popup ให้ผู้ใช้กดเลือกบัญชีเองเสมอ
 *
 * Email: ยิงไปที่ /api/auth/login (ต้องตั้งรหัสผ่านไว้ก่อน)
 */
import { useEffect, useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { RocketLogo } from "@/components/RocketLogo";
import { toFriendlyMessage } from "@/lib/error-messages";

const GOOGLE_CLIENT_ID = "71834421978-cuhvt0kbulcki1e8q4e1d7pmt1kq8sk6.apps.googleusercontent.com";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            prompt: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

type Tab = "google" | "email";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("google"); // default = Google ตามที่กำหนด
  const [gisReady, setGisReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function finishLogin(res: Response) {
    let data: { ok: boolean; error?: string };
    try {
      data = (await res.json()) as { ok: boolean; error?: string };
    } catch {
      setErrorMsg(toFriendlyMessage("", res.status));
      return;
    }

    if (data.ok) {
      router.push("/");
      router.refresh();
    } else {
      setErrorMsg(toFriendlyMessage(data.error ?? "", res.status));
    }
  }

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGisReady(true);
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  function handleGoogleClick() {
    if (!gisReady || !window.google) return;
    setErrorMsg(null);
    setGoogleLoading(true);

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      prompt: "select_account", // บังคับเปิดหน้าเลือกบัญชีทุกครั้ง ไม่ auto-select
      callback: async (response) => {
        if (!response.access_token) {
          setGoogleLoading(false);
          if (response.error !== "popup_closed" && response.error !== "access_denied") {
            setErrorMsg("เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
          }
          return;
        }
        try {
          const res = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: response.access_token }),
          });
          await finishLogin(res);
        } catch {
          setErrorMsg("เชื่อมต่อเครือข่ายไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
        } finally {
          setGoogleLoading(false);
        }
      },
    });

    client.requestAccessToken();
  }

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
    } catch {
      setErrorMsg("เชื่อมต่อเครือข่ายไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
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
          <RocketLogo size={30} />
        </div>

        <h1 style={{ textAlign: "center", fontSize: 19, fontWeight: 700, color: "#111827", margin: 0 }}>
          Portfolio Workspace
        </h1>
        <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 4, marginBottom: 20 }}>
          ระบบบริหารพอร์ตโครงการองค์กร
        </p>

        <div style={{ display: "flex", background: "#F4F4F6", borderRadius: 10, padding: 4, gap: 4, marginBottom: 20 }}>
          <button type="button" onClick={() => setTab("google")} style={tabButtonStyle(tab === "google")}>
            บัญชี Google
          </button>
          <button type="button" onClick={() => setTab("email")} style={tabButtonStyle(tab === "email")}>
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
              fontSize: 13,
              marginBottom: 16,
              lineHeight: 1.6,
            }}
          >
            {errorMsg}
          </div>
        )}

        {tab === "google" && (
          <div>
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={!gisReady || googleLoading}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "12px 16px",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                background: "#fff",
                fontSize: 14.5,
                fontWeight: 500,
                color: "#111827",
                cursor: !gisReady || googleLoading ? "not-allowed" : "pointer",
                opacity: !gisReady || googleLoading ? 0.6 : 1,
                fontFamily: "inherit",
              }}
            >
              <GoogleGIcon />
              {googleLoading ? "กำลังเข้าสู่ระบบ..." : "เลือกบัญชี Google"}
            </button>
            <p style={{ textAlign: "center", fontSize: 12, color: "#9AA0A6", marginTop: 14, lineHeight: 1.7 }}>
              ระบบจะพาไปหน้าเลือกบัญชี Google ของคุณ
            </p>
          </div>
        )}

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
    </main>
  );
}

function tabButtonStyle(active: boolean): CSSProperties {
  return {
    flex: 1,
    border: "none",
    borderRadius: 7,
    padding: "9px 6px",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    background: active ? "#fff" : "transparent",
    color: active ? "#001D58" : "#6B7280",
    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
    fontFamily: "inherit",
  };
}

function GoogleGIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
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

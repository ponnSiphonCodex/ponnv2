"use client";
/**
 * apps/web/src/app/login/page.tsx
 *
 * ใช้ Google Identity Services (GIS) แบบยิง ID token ตรง — วิธีเดียวกับที่ทำ
 * สำเร็จในโปรเจกต์ Rentals (ดู ponn-domain-main/js/auth.js ฟังก์ชัน mountGsi/onCred)
 * แทนที่ NextAuth signIn("google") ที่ต้องผ่าน OAuth redirect flow เต็มรูปแบบ
 *
 * ข้อดี: ไม่ต้องพึ่ง Authorized redirect URIs ให้ตรงเป๊ะ ๆ — ต้องมีแค่
 * "Authorized JavaScript origins" ใน Google Console เท่านั้น (โดเมนที่รันเว็บนี้)
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";

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

export default function LoginPage() {
  const router = useRouter();

  async function handleCredentialResponse(response: { credential: string }) {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };

      if (data.ok) {
        router.push("/");
        router.refresh();
      } else {
        alert("เข้าสู่ระบบไม่สำเร็จ: " + (data.error ?? "ไม่ทราบสาเหตุ"));
      }
    } catch (err) {
      alert("เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง");
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
      const container = document.getElementById("google-signin-button");
      if (container) {
        window.google.accounts.id.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          width: 300,
          locale: "th",
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      style={{
        display: "grid",
        placeItems: "center",
        height: "100vh",
        background: "#F4F4F6",
        fontFamily: "'Sarabun', sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ marginBottom: 24, color: "#111827" }}>ponnsth.com</h1>
        <div id="google-signin-button" />
      </div>
    </main>
  );
}

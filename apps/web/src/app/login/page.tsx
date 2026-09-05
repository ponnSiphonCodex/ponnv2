"use client";
import { signIn } from "next-auth/react";
import Image from "next/image";

/**
 * หน้า login — ล็อกความสูงไว้ที่ 100dvh เป๊ะ (ไม่ใช้ minHeight) + overflow: hidden
 * เพื่อกันไม่ให้เกิด scrollbar แม้เนื้อหาข้างในจะเปลี่ยนขนาดฟอนต์/responsive
 * ใช้ dvh (dynamic viewport height) แทน vh ธรรมดา เพื่อความแม่นยำบนมือถือที่มี browser bar
 * โลโก้ใช้รูปจรวด src/app/icon.png ตัวเดียวกับ favicon (ผ่าน Next.js Image เพื่อ optimize)
 */
export default function LoginPage() {
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
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#fff",
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            margin: "0 auto 16px",
            borderRadius: 16,
            background: "#F4F4F6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image src="/rocket-logo.png" alt="Portfolio Workspace" width={40} height={40} priority />
        </div>

        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#001D58" }}>Portfolio Workspace</h1>
        <p style={{ margin: "4px 0 20px", fontSize: 13, color: "#6B7280" }}>ระบบบริหารพอร์ตโครงการองค์กร</p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: "#fff",
            color: "#1F2937",
            border: "1px solid #E5E7EB",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3l5.7-5.7C34.5 6 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.6 18.9 13 24 13c3.1 0 5.9 1.1 8 3l5.7-5.7C34.5 6 29.5 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" />
            <path fill="#4CAF50" d="M24 44c5.3 0 10.2-2 13.9-5.3l-6.4-5.4C29.4 34.9 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.4 5.4C41.6 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-3.5z" />
          </svg>
          เข้าสู่ระบบด้วย Google
        </button>

        <p style={{ marginTop: 16, fontSize: 11, color: "#9AA0A6" }}>ระบบจะพาไปหน้าเลือกบัญชี Google ของคุณ</p>
      </div>
    </main>
  );
}

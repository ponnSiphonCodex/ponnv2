"use client";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main style={{ display: "grid", placeItems: "center", height: "100vh", background: "#F4F4F6" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ marginBottom: 24, color: "#111827" }}>ponnsth.com</h1>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          style={{ background: "#001D58", color: "#fff", padding: "12px 24px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 16 }}
        >
          เข้าสู่ระบบด้วย Google
        </button>
      </div>
    </main>
  );
}

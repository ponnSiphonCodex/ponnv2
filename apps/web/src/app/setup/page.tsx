"use client";
/**
 * apps/web/src/app/setup/page.tsx
 * หน้าตั้งรหัสผ่านครั้งแรก — ไม่ผูกกับเมนูไหน เข้าตรง URL /setup เท่านั้น
 * ต้องรู้ค่า AUTH_SECRET (ตั้งไว้ใน Cloudflare Dashboard) ถึงจะตั้งรหัสผ่านได้
 */
import { useState } from "react";
import type { FormEvent, CSSProperties } from "react";

export default function SetupPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [setupSecret, setSetupSecret] = useState("");
  const [status, setStatus] = useState<{ type: "ok" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, setupSecret }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setStatus({ type: "ok", message: "ตั้งรหัสผ่านสำเร็จแล้ว ลองไปหน้า /login ได้เลย" });
      } else {
        setStatus({ type: "error", message: data.error ?? "ไม่ทราบสาเหตุ" });
      }
    } catch (err) {
      setStatus({ type: "error", message: "เชื่อมต่อไม่สำเร็จ: " + String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        background: "#F4F4F6",
        fontFamily: "'Sarabun', sans-serif",
        padding: 24,
      }}
    >
      <form
        onSubmit={submit}
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          width: 380,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ color: "#001D58", marginBottom: 8 }}>ตั้งรหัสผ่านครั้งแรก</h2>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
          ต้องใส่ AUTH_SECRET (ค่าที่ตั้งไว้ใน Cloudflare Dashboard ของ Worker นี้) ถึงจะตั้งได้
        </p>

        <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>อีเมล</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <label style={{ display: "block", fontSize: 14, marginBottom: 4, marginTop: 12 }}>ชื่อที่แสดง</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />

        <label style={{ display: "block", fontSize: 14, marginBottom: 4, marginTop: 12 }}>รหัสผ่าน (อย่างน้อย 6 ตัว)</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <label style={{ display: "block", fontSize: 14, marginBottom: 4, marginTop: 12 }}>AUTH_SECRET (รหัสลับ)</label>
        <input
          type="password"
          required
          value={setupSecret}
          onChange={(e) => setSetupSecret(e.target.value)}
          style={inputStyle}
        />

        {status && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              fontSize: 13,
              background: status.type === "ok" ? "#E7F4EE" : "#FCEDEB",
              color: status.type === "ok" ? "#0E7C4A" : "#C0392B",
            }}
          >
            {status.message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 20,
            width: "100%",
            background: "#001D58",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 0",
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่าน"}
        </button>
      </form>
    </main>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  fontSize: 14,
  fontFamily: "inherit",
  boxSizing: "border-box",
};

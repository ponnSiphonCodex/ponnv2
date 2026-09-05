"use client";
/**
 * apps/web/src/components/loading-overlay.tsx
 * Global loading overlay — เบลอพื้นหลัง + block การกด + ไอคอน animated (heartbeat line)
 *
 * มี 2 ส่วน:
 * 1. <LoadingOverlay show={bool} /> — ควบคุมเองด้วย state (ใช้ตอน submit form, fetch)
 * 2. <RouteLoadingOverlay /> — โผล่อัตโนมัติตอนเปลี่ยนหน้า (ผูกกับ next/navigation)
 */
import { useEffect, useState } from "react";

const NAVY = "#001D58";

function LoaderIcon({ size = 72 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 48" width={size} height={size * 0.75} style={{ color: NAVY, display: "block" }}>
      <style>{`
        :is(#pw_back, #pw_front) { fill: none; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
        #pw_back { stroke: currentColor; opacity: 0.1; }
        #pw_front { stroke: currentColor; stroke-dasharray: 48, 144; stroke-dashoffset: 192; animation: pw_dash 1.4s linear infinite; }
        @keyframes pw_dash { 72.5% { opacity: 0; } to { stroke-dashoffset: 0; } }
      `}</style>
      <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="pw_back" />
      <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="pw_front" />
    </svg>
  );
}

/** Overlay ควบคุมด้วย prop show */
export function LoadingOverlay({ show, label }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        cursor: "wait",
      }}
      // block ทุกการกด/คีย์ระหว่างโหลด
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div style={{ background: "#fff", borderRadius: 20, padding: "28px 36px", boxShadow: "0 12px 40px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <LoaderIcon />
        <span style={{ fontSize: 14, color: NAVY, fontWeight: 600 }}>{label ?? "กำลังโหลด..."}</span>
      </div>
    </div>
  );
}

/**
 * RouteLoadingOverlay — โผล่อัตโนมัติเมื่อคลิกลิงก์ภายในเว็บ (เปลี่ยนหน้า)
 * ทำงานโดยดักการคลิก <a> ภายในโดเมนเดียวกัน แล้วโชว์ overlay จน pathname เปลี่ยน
 * (Next.js App Router ยังไม่มี global navigation event ที่เสถียร จึงดัก click แทน)
 */
export function RouteLoadingOverlay() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || a.target === "_blank" || a.hasAttribute("download")) return;
      // ลิงก์ภายในโดเมนเดียวกัน + ไม่ใช่หน้าปัจจุบัน
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return; // external → ไม่โชว์
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
        setLoading(true);
      } catch { /* ignore */ }
    }
    // ปิด overlay เมื่อหน้าโหลดเสร็จ / กด back
    function onDone() { setLoading(false); }
    document.addEventListener("click", onClick, true);
    window.addEventListener("pageshow", onDone);
    window.addEventListener("popstate", onDone);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pageshow", onDone);
      window.removeEventListener("popstate", onDone);
    };
  }, []);

  return <LoadingOverlay show={loading} />;
}

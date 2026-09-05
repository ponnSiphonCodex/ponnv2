"use client";
import { useEffect, useRef, useState } from "react";
const NAVY = "#001D58";
type LogEntry = { id: number; time: string; method: string; endpoint: string; status: number; ms: number; error?: string };

// intercept fetch ทั่วทั้งแอป → เก็บ log ใน memory (ไม่แตะ database)
let BUFFER: LogEntry[] = [];
let SEQ = 0;
let installed = false;
const listeners = new Set<() => void>();
function notify() { listeners.forEach((l) => l()); }
function install() {
  if (installed || typeof window === "undefined") return; installed = true;
  const orig = window.fetch;
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const [input, init] = args;
    const url = typeof input === "string" ? input : (input as Request).url;
    const method = (init?.method || (typeof input !== "string" ? (input as Request).method : "GET") || "GET").toUpperCase();
    const start = performance.now();
    const isApi = url.includes("/api/");
    try {
      const res = await orig(...args);
      if (isApi) { BUFFER.unshift({ id: ++SEQ, time: new Date().toLocaleTimeString("th-TH"), method, endpoint: shorten(url), status: res.status, ms: Math.round(performance.now() - start) }); trim(); notify(); }
      return res;
    } catch (e) {
      if (isApi) { BUFFER.unshift({ id: ++SEQ, time: new Date().toLocaleTimeString("th-TH"), method, endpoint: shorten(url), status: 0, ms: Math.round(performance.now() - start), error: e instanceof Error ? e.message : "network error" }); trim(); notify(); }
      throw e;
    }
  };
}
function shorten(url: string) { try { const u = new URL(url, location.origin); return u.pathname.replace(/^\/api\//, "") + (u.search || ""); } catch { return url; } }
function trim() { if (BUFFER.length > 200) BUFFER = BUFFER.slice(0, 200); }

export function LogViewer() {
  const [, force] = useState(0);
  const [filter, setFilter] = useState<"all" | "error" | "slow">("all");
  const timer = useRef<any>(null);
  useEffect(() => {
    install();
    const l = () => force((x) => x + 1); listeners.add(l);
    // ยิง sample เพื่อให้เห็น log ทันที
    fetch("/api/debug").catch(() => {});
    timer.current = setInterval(() => { fetch("/api/debug").catch(() => {}); }, 15000);
    return () => { listeners.delete(l); clearInterval(timer.current); };
  }, []);

  const rows = BUFFER.filter((r) => filter === "all" ? true : filter === "error" ? (r.status === 0 || r.status >= 400) : r.ms >= 500);
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "error", "slow"] as const).map((f) => <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: filter === f ? NAVY : "#fff", color: filter === f ? "#fff" : "#6B7280", boxShadow: filter === f ? "none" : "0 0 0 1px #E5E7EB inset" }}>{f === "all" ? "ทั้งหมด" : f === "error" ? "ข้อผิดพลาด" : "ช้า (>500ms)"}</button>)}
        </div>
        <button className="btn-ghost" onClick={() => { BUFFER = []; force((x) => x + 1); }}>ล้าง</button>
      </div>
      <div style={{ fontSize: 12.5, color: "#6B7280", marginBottom: 10 }}>บันทึกการเรียก API แบบ real-time (เก็บในหน่วยความจำ ไม่เขียนลง Database) — ใช้ดูว่ามี error หรือช้าตรงไหน</div>
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr style={{ background: NAVY, color: "#fff", textAlign: "left" }}><th style={th}>เวลา</th><th style={th}>Method</th><th style={th}>Endpoint</th><th style={{ ...th, textAlign: "center" }}>สถานะ</th><th style={{ ...th, textAlign: "right" }}>ms</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} style={{ ...td, color: "#9AA0A6", textAlign: "center" }}>ยังไม่มี log — ลองใช้งานหน้าอื่นแล้วกลับมาดู</td></tr>}
            {rows.map((r) => {
              const bad = r.status === 0 || r.status >= 400; const slow = r.ms >= 500;
              return (
                <tr key={r.id} style={{ borderTop: "1px solid #F0F1F3", background: bad ? "#FEF2F2" : slow ? "#FFFBEB" : "#fff" }}>
                  <td style={{ ...td, fontSize: 12.5, color: "#6B7280", whiteSpace: "nowrap" }}>{r.time}</td>
                  <td style={td}><span className="badge" style={{ background: "#EEF2FF", color: "#4338CA" }}>{r.method}</span></td>
                  <td style={{ ...td, fontFamily: "monospace", fontSize: 12.5 }}>{r.endpoint}{r.error && <span style={{ color: "#DC2626" }}> — {r.error}</span>}</td>
                  <td style={{ ...td, textAlign: "center" }}><span className="badge" style={{ background: bad ? "#FEE2E2" : "#DCFCE7", color: bad ? "#991B1B" : "#166534" }}>{r.status || "ERR"}</span></td>
                  <td style={{ ...td, textAlign: "right", fontWeight: slow ? 700 : 400, color: slow ? "#B45309" : "#1F2937" }}>{r.ms}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
const th: React.CSSProperties = { padding: "11px 14px", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 14px", fontSize: 13.5 };

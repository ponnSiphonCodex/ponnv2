"use client";
import { useEffect, useRef, useState } from "react";
const NAVY = "#001D58";
const LS_KEY = "syslog:v2";

type LogEntry = { id: number; time: number; method: string; endpoint: string; status: number; ms: number; desc: string; reqBody?: string; resBody?: string; error?: string };

// อธิบาย endpoint เป็นภาษาคน (เพื่อการเรียนรู้)
function describe(method: string, path: string): string {
  const p = path.replace(/\?.*$/, "");
  const M: [RegExp, string][] = [
    [/^tasks\/move/, "ย้ายสถานะงาน (drag Kanban)"],
    [/^tasks\/create/, "สร้างงานใหม่"],
    [/^tasks\/\d+$/, method === "DELETE" ? "ลบงาน" : "แก้ไขงาน"],
    [/^tasks\/detail/, "โหลดรายละเอียดงาน"],
    [/^crud\/\w+\/\d+/, method === "DELETE" ? "ลบรายการ" : "แก้ไขรายการ"],
    [/^crud\/\w+/, method === "POST" ? "สร้างรายการ" : "โหลดรายการ"],
    [/^ref\//, "โหลดตัวเลือก dropdown"],
    [/^meetings\/save/, method === "DELETE" ? "ลบประชุม" : "บันทึกประชุม"],
    [/^meetings\/list/, "โหลดรายการประชุม"],
    [/^meetings\/detail/, "โหลดรายละเอียดประชุม"],
    [/^admin\/users/, method === "DELETE" ? "ลบผู้ใช้" : method === "PATCH" ? "แก้สิทธิ์ผู้ใช้" : method === "POST" ? "เพิ่มผู้ใช้" : "โหลดผู้ใช้"],
    [/^admin\/pending-count/, "นับคำขอใช้งาน"],
    [/^profile\/password/, "เปลี่ยนรหัสผ่าน"],
    [/^profile/, method === "PATCH" ? "แก้โปรไฟล์" : "โหลดโปรไฟล์"],
    [/^attachments/, method === "DELETE" ? "ลบไฟล์แนบ" : "แนบไฟล์"],
    [/^comments/, "เพิ่มคอมเมนต์"],
    [/^worklogs/, "ลงเวลาทำงาน"],
    [/^tags\/toggle/, "สลับ tag"],
    [/^notify\/test/, "ทดสอบ Telegram"],
    [/^debug/, "ตรวจสถานะระบบ"],
  ];
  for (const [re, d] of M) if (re.test(p)) return d;
  return "-";
}

let BUFFER: LogEntry[] = [];
let SEQ = 0;
let installed = false;
const listeners = new Set<() => void>();
function notify() { listeners.forEach((l) => l()); }
function persist() { try { localStorage.setItem(LS_KEY, JSON.stringify(BUFFER.slice(0, 400))); } catch {} }
function shorten(url: string) { try { const u = new URL(url, location.origin); return u.pathname.replace(/^\/api\//, "") + (u.search || ""); } catch { return url; } }
function clip(v: any): string | undefined { if (v == null) return undefined; try { const s = typeof v === "string" ? v : JSON.stringify(v); return s.length > 2000 ? s.slice(0, 2000) + "…" : s; } catch { return undefined; } }

function install() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  try { const saved = JSON.parse(localStorage.getItem(LS_KEY) || "[]"); if (Array.isArray(saved)) { BUFFER = saved; SEQ = saved.reduce((m: number, x: any) => Math.max(m, x.id || 0), 0); } } catch {}
  const orig = window.fetch;
  window.fetch = async (...args: any[]) => {
    const [input, init] = args;
    const url = typeof input === "string" ? input : input.url;
    const method = (init?.method || (typeof input !== "string" ? input.method : "GET") || "GET").toUpperCase();
    const isApi = url.includes("/api/");
    const start = performance.now();
    const reqBody = isApi && init?.body ? clip(init.body) : undefined;
    try {
      const res = await (orig as any)(...args);
      if (isApi) {
        let resBody: string | undefined;
        try { resBody = clip(await res.clone().text()); } catch {}
        BUFFER.unshift({ id: ++SEQ, time: Date.now(), method, endpoint: shorten(url), status: res.status, ms: Math.round(performance.now() - start), desc: describe(method, shorten(url)), reqBody, resBody });
        if (BUFFER.length > 400) BUFFER.length = 400;
        persist(); notify();
      }
      return res;
    } catch (e: any) {
      if (isApi) { BUFFER.unshift({ id: ++SEQ, time: Date.now(), method, endpoint: shorten(url), status: 0, ms: Math.round(performance.now() - start), desc: describe(method, shorten(url)), reqBody, error: e?.message || "network error" }); persist(); notify(); }
      throw e;
    }
  };
}

const fmtT = (t: number) => new Date(t).toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).slice(0, 19);

export function LogViewer() {
  const [, force] = useState(0);
  const [filter, setFilter] = useState<"all" | "error" | "slow">("all");
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => { install(); const l = () => force((x) => x + 1); listeners.add(l); force((x) => x + 1); return () => { listeners.delete(l); }; }, []);
  const rows = BUFFER.filter((r) => filter === "all" ? true : filter === "error" ? (r.status === 0 || r.status >= 400) : r.ms >= 500);
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {(["all", "error", "slow"] as const).map((f) => <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: filter === f ? NAVY : "#fff", color: filter === f ? "#fff" : "#6B7280", boxShadow: filter === f ? "none" : "0 0 0 1px #E5E7EB inset" }}>{f === "all" ? "ทั้งหมด" : f === "error" ? "ข้อผิดพลาด" : "ช้า (>500ms)"}</button>)}
        </div>
        <button className="btn-ghost" onClick={() => { BUFFER = []; persist(); force((x) => x + 1); }}>ล้าง</button>
      </div>
      <div style={{ fontSize: 12.5, color: "#6B7280", marginBottom: 12 }}>เก็บถาวรใน localStorage · บันทึกทุก API call ที่เกิดจากการใช้งานจริง (ไม่ยิงเองอีกต่อไป) · คลิกแถวเพื่อดู request/response body</div>
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr style={{ background: NAVY, color: "#fff", textAlign: "left" }}><th style={th}>เวลา</th><th style={th}>Method</th><th style={th}>Endpoint</th><th style={th}>คำอธิบาย</th><th style={th}>สถานะ</th><th style={{ ...th, textAlign: "right" }}>ms</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} style={{ ...td, color: "#9AA0A6" }}>ยังไม่มี log — ใช้งานหน้าอื่นแล้วกลับมาดู</td></tr>}
            {rows.map((r) => {
              const bad = r.status === 0 || r.status >= 400; const slow = r.ms >= 500; const exp = open === r.id;
              return (
                <>
                  <tr key={r.id} onClick={() => setOpen(exp ? null : r.id)} style={{ borderTop: "1px solid #F0F1F3", cursor: "pointer", background: bad ? "#FEF2F2" : slow ? "#FFFBEB" : "#fff" }}>
                    <td style={{ ...td, whiteSpace: "nowrap", fontSize: 12 }}>{fmtT(r.time)}</td>
                    <td style={td}><span className="badge" style={{ background: "#EEF2FF", color: "#4338CA" }}>{r.method}</span></td>
                    <td style={{ ...td, fontFamily: "monospace", fontSize: 12.5 }}>{r.endpoint}{r.error && <span style={{ color: "#DC2626" }}> — {r.error}</span>}</td>
                    <td style={{ ...td, color: "#6B7280", fontSize: 12.5 }}>{r.desc}</td>
                    <td style={td}><span className="badge" style={{ background: bad ? "#FEE2E2" : "#ECFDF5", color: bad ? "#991B1B" : "#047857" }}>{r.status || "ERR"}</span></td>
                    <td style={{ ...td, textAlign: "right", fontWeight: slow ? 700 : 400, color: slow ? "#B45309" : "#374151" }}>{r.ms}</td>
                  </tr>
                  {exp && (
                    <tr><td colSpan={6} style={{ padding: "0 14px 12px", background: "#FafBfc" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingTop: 8 }}>
                        <div><div style={jh}>Request Body</div><pre style={jp}>{r.reqBody || "— ไม่มี —"}</pre></div>
                        <div><div style={jh}>Response Body</div><pre style={jp}>{r.resBody || r.error || "— ไม่มี —"}</pre></div>
                      </div>
                    </td></tr>
                  )}
                </>
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
const jh: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#6B7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: .5 };
const jp: React.CSSProperties = { background: "#0F172A", color: "#E2E8F0", padding: 10, borderRadius: 8, fontSize: 11.5, lineHeight: 1.5, overflowX: "auto", margin: 0, maxHeight: 200, whiteSpace: "pre-wrap", wordBreak: "break-all" };

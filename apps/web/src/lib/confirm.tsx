"use client";
import { useEffect, useState } from "react";

const NAVY = "#001D58", PINK = "#EC186E";
type Opts = { title?: string; message: string; confirmText?: string; cancelText?: string; danger?: boolean; info?: boolean };
type Req = Opts & { resolve: (v: boolean) => void };

let push: ((r: Req) => void) | null = null;

// เรียกใช้แบบ: if (await confirmDialog({ message: "ลบ?", danger: true })) {...}
export function confirmDialog(opts: Opts): Promise<boolean> {
  return new Promise((resolve) => { if (push) push({ ...opts, resolve }); else resolve(false); });
}
// แจ้งเตือน (info) — มีปุ่มเดียว
export function alertDialog(message: string, title?: string): Promise<boolean> {
  return confirmDialog({ message, title, info: true, confirmText: "รับทราบ" });
}

export function ConfirmRoot() {
  const [queue, setQueue] = useState<Req[]>([]);
  useEffect(() => { push = (r) => setQueue((q) => [...q, r]); return () => { push = null; }; }, []);
  const cur = queue[0];
  if (!cur) return null;
  function done(v: boolean) { cur.resolve(v); setQueue((q) => q.slice(1)); }
  const danger = cur.danger;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,29,88,.38)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div className="card" style={{ width: "min(400px,94vw)", padding: 0, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,.25)", animation: "confPop .16s ease" }}>
        <div style={{ height: 4, background: danger ? "#DC2626" : cur.info ? "#0284C7" : PINK }} />
        <div style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{cur.title ?? (danger ? "ยืนยันการลบ" : cur.info ? "แจ้งเตือน" : "ยืนยัน")}</div>
          <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-line" }}>{cur.message}</div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            {!cur.info && <button className="btn-ghost" onClick={() => done(false)}>{cur.cancelText ?? "ยกเลิก"}</button>}
            <button onClick={() => done(true)} style={{ padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, color: "#fff", background: danger ? "#DC2626" : cur.info ? "#0284C7" : NAVY }}>{cur.confirmText ?? (danger ? "ลบ" : "ยืนยัน")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

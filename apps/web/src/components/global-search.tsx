"use client";
import { useState, useRef, useEffect } from "react";
const NAVY = "#001D58";
const ICON: Record<string, string> = { project: "📁", task: "🗂️", user: "🧑", issue: "⚠️", risk: "🛡️" };
export function GlobalSearch() {
  const [q, setQ] = useState(""); const [results, setResults] = useState<any[]>([]); const [open, setOpen] = useState(false);
  const timer = useRef<any>(null);
  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => { try { const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`); if (r.ok) { const d = await r.json(); setResults(d.results); setOpen(true); } } catch {} }, 250);
  }, [q]);
  return (
    <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => results.length && setOpen(true)} placeholder="🔍 ค้นหาโครงการ งาน คน..." style={{ width: "100%", height: 36, padding: "0 14px", borderRadius: 20, border: "1px solid #E5E7EB", background: "#F9FAFB", fontSize: 13.5 }} />
      {open && results.length > 0 && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div className="card" style={{ position: "absolute", left: 0, right: 0, top: 42, maxHeight: 380, overflowY: "auto", zIndex: 41, boxShadow: "0 8px 24px rgba(0,0,0,.15)" }}>
            {results.map((r, i) => (
              <a key={i} href={r.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", textDecoration: "none", borderBottom: "1px solid #F6F7F8" }}>
                <span style={{ fontSize: 16 }}>{ICON[r.type] || "•"}</span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, color: "#1F2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</div>{r.sub && <div style={{ fontSize: 11, color: "#9AA0A6" }}>{r.sub}</div>}</div>
                <span style={{ fontSize: 11, color: "#C7CCD4", textTransform: "uppercase" }}>{r.type}</span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

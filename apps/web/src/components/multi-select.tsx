"use client";
import { useState } from "react";
const NAVY = "#001D58", PINK = "#EC186E";
type Opt = { id: number | string; name: string };
// Multi-select dropdown (checkbox) — theme วิริยะ
export function MultiSelect({ options, value, onChange, placeholder = "— เลือก —" }: { options: Opt[]; value: (number | string)[]; onChange: (v: (number | string)[]) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((o) => value.map(String).includes(String(o.id)));
  function toggle(id: number | string) { const has = value.map(String).includes(String(id)); onChange(has ? value.filter((v) => String(v) !== String(id)) : [...value, id]); }
  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="input" style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", textAlign: "left", flexWrap: "wrap", minHeight: 40, height: "auto", padding: "6px 10px" }}>
        {selected.length === 0 ? <span style={{ color: "#c7ccd4" }}>{placeholder}</span> : selected.map((o) => (
          <span key={o.id} style={{ background: "#FDE7F0", color: "#B4185A", fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>{o.name}<span onClick={(e) => { e.stopPropagation(); toggle(o.id); }} style={{ cursor: "pointer", fontWeight: 700 }}>×</span></span>
        ))}
      </button>
      {open && (<>
        <div style={{ position: "fixed", inset: 0, zIndex: 60 }} onClick={() => setOpen(false)} />
        <div className="card" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 61, maxHeight: 240, overflowY: "auto", padding: 6, boxShadow: "0 8px 24px rgba(0,0,0,.15)" }}>
          {options.length === 0 && <div style={{ padding: 10, fontSize: 13, color: "#9AA0A6" }}>ไม่มีตัวเลือก</div>}
          {options.map((o) => {
            const on = value.map(String).includes(String(o.id));
            return <div key={o.id} onClick={() => toggle(o.id)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 7, cursor: "pointer", background: on ? "#FDECF3" : "transparent", fontSize: 13.5 }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, border: on ? "none" : "1.5px solid #CBD2DC", background: on ? PINK : "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11 }}>{on ? "✓" : ""}</span>{o.name}
            </div>;
          })}
        </div>
      </>)}
    </div>
  );
}

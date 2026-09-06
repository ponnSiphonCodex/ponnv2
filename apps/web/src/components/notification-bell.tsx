"use client";
import { useEffect, useRef, useState } from "react";
const NAVY = "#001D58", PINK = "#EC186E";
type Noti = { id: number; action_type: string; reference_type: string | null; reference_id: number | null; message: string; is_read: number; created_at: number; actor: string | null };

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Noti[]>([]);
  const [unread, setUnread] = useState(0);
  const timer = useRef<any>(null);

  async function load() {
    try { const r = await fetch("/api/notifications"); if (r.ok) { const d = await r.json(); setItems(d.notifications); setUnread(d.unread); } } catch {}
  }
  useEffect(() => { load(); timer.current = setInterval(load, 30000); return () => clearInterval(timer.current); }, []);
  async function markRead() { await fetch("/api/notifications", { method: "POST" }); setUnread(0); load(); }

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => { setOpen((o) => !o); if (!open && unread) markRead(); }} style={{ position: "relative", background: "transparent", border: "none", cursor: "pointer", fontSize: 20, padding: 6 }}>
        🔔{unread > 0 && <span style={{ position: "absolute", top: 0, right: 0, background: PINK, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div className="card" style={{ position: "absolute", right: 0, top: 44, width: 340, maxHeight: 420, overflowY: "auto", zIndex: 41, boxShadow: "0 8px 24px rgba(0,0,0,.15)" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #F0F1F3", fontWeight: 700, color: NAVY, fontSize: 14 }}>การแจ้งเตือน</div>
            {items.length === 0 && <div style={{ padding: 20, color: "#9AA0A6", fontSize: 13, textAlign: "center" }}>ไม่มีการแจ้งเตือน</div>}
            {items.map((n) => (
              <div key={n.id} style={{ padding: "11px 16px", borderBottom: "1px solid #F6F7F8", background: n.is_read ? "#fff" : "#FFF5F9" }}>
                <div style={{ fontSize: 13, color: "#1F2937" }}>{n.message}</div>
                <div style={{ fontSize: 11, color: "#9AA0A6", marginTop: 3 }}>{new Date(n.created_at*1000).toLocaleString("sv-SE",{timeZone:"Asia/Bangkok"}).slice(0,16)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

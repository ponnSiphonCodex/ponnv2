"use client";
import { useState } from "react";
import { apiWrite } from "@/lib/offline";
import { useRouter } from "next/navigation";
const NAVY = "#001D58", PINK = "#EC186E";
type Todo = { id: number; title: string; status: string; target_date: number | null };
export function TodosClient({ initial }: { initial: Todo[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(""); const [date, setDate] = useState("");
  async function add() { if (!title.trim()) return; await apiWrite("/api/todos/create", "POST", { title, targetDate: date || null }); setTitle(""); setDate(""); router.refresh(); }
  async function toggle(t: Todo) { await apiWrite(`/api/todos/${t.id}`, "PATCH", { status: t.status === "done" ? "todo" : "done" }); router.refresh(); }
  async function del(id: number) { await apiWrite(`/api/todos/${id}`, "DELETE", {}); router.refresh(); }
  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <div className="card" style={{ padding: 16, marginBottom: 18, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input className="input" style={{ flex: 1, minWidth: 180 }} placeholder="เพิ่มงานของฉันวันนี้..." value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <input className="input" style={{ width: 150 }} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn-pink" onClick={add}>เพิ่ม</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {initial.length === 0 && <div className="card" style={{ padding: 16, color: "#6B7280" }}>ยังไม่มีรายการ</div>}
        {initial.map((t) => (
          <div key={t.id} className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <input type="checkbox" checked={t.status === "done"} onChange={() => toggle(t)} style={{ width: 18, height: 18 }} />
            <span style={{ flex: 1, textDecoration: t.status === "done" ? "line-through" : "none", color: t.status === "done" ? "#9AA0A6" : "#1F2937" }}>{t.title}</span>
            {t.target_date && <span style={{ fontSize: 12, color: "#6B7280" }}>{new Date(t.target_date * 1000).toISOString().slice(0, 10)}</span>}
            <button onClick={() => del(t.id)} style={{ border: "none", background: "transparent", color: "#DC2626", cursor: "pointer" }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

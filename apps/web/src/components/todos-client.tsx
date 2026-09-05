"use client";
import { useState, useRef } from "react";
import { apiWrite } from "@/lib/offline";
const PINK = "#EC186E";
type Todo = { id: number; title: string; status: string; target_date: number | null };
export function TodosClient({ initial }: { initial: Todo[] }) {
  const [todos, setTodos] = useState<Todo[]>(initial);
  const [title, setTitle] = useState(""); const [date, setDate] = useState("");
  const seq = useRef(-1);
  async function add() {
    if (!title.trim()) return;
    const tempId = seq.current--;
    const td = date ? Math.floor(Date.parse(date + "T00:00:00Z") / 1000) : null;
    setTodos((s) => [...s, { id: tempId, title, status: "todo", target_date: td }]); // โผล่ทันที
    const t = title; const d = date; setTitle(""); setDate("");
    await apiWrite("/api/todos/create", "POST", { title: t, targetDate: d || null });
  }
  async function toggle(t: Todo) {
    const ns = t.status === "done" ? "todo" : "done";
    setTodos((s) => s.map((x) => x.id === t.id ? { ...x, status: ns } : x)); // ทันที
    if (t.id > 0) await apiWrite(`/api/todos/${t.id}`, "PATCH", { status: ns });
  }
  async function del(id: number) {
    setTodos((s) => s.filter((x) => x.id !== id)); // ทันที
    if (id > 0) await apiWrite(`/api/todos/${id}`, "DELETE", {});
  }
  const sorted = [...todos].sort((a, b) => (a.status === b.status ? 0 : a.status === "done" ? 1 : -1));
  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <div className="card" style={{ padding: 16, marginBottom: 18, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input className="input" style={{ flex: 1, minWidth: 180 }} placeholder="เพิ่มงานของฉันวันนี้..." value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <input className="input" style={{ width: 150 }} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn-pink" onClick={add}>เพิ่ม</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.length === 0 && <div className="card" style={{ padding: 16, color: "#6B7280" }}>ยังไม่มีรายการ</div>}
        {sorted.map((t) => (
          <div key={t.id} className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, opacity: t.id < 0 ? 0.7 : 1 }}>
            <input type="checkbox" checked={t.status === "done"} onChange={() => toggle(t)} style={{ width: 18, height: 18, accentColor: PINK }} />
            <span style={{ flex: 1, textDecoration: t.status === "done" ? "line-through" : "none", color: t.status === "done" ? "#9AA0A6" : "#1F2937" }}>{t.title}</span>
            {t.target_date && <span style={{ fontSize: 12, color: "#6B7280" }}>{new Date(t.target_date * 1000).toISOString().slice(0, 10)}</span>}
            <button onClick={() => del(t.id)} style={{ border: "none", background: "transparent", color: "#DC2626", cursor: "pointer" }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

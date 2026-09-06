"use client";
import { useState, useRef } from "react";
import { apiWrite } from "@/lib/offline";
import { uploadToGoogleDrive } from "@/lib/upload";
import { confirmDialog } from "@/lib/confirm";
import { Icon } from "./icons";
const PINK = "#EC186E", NAVY = "#001D58";
type FileRow = { id: number; file_name: string; gdrive_web_link: string };
type Todo = { id: number; title: string; status: string; target_date: number | null };
const dstr = (u: number) => new Date(u * 1000).toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" }); // YYYY-MM-DD เสมอ

export function TodosClient({ initial }: { initial: Todo[] }) {
  const [todos, setTodos] = useState<Todo[]>(initial);
  const [title, setTitle] = useState(""); const [date, setDate] = useState("");
  const [files, setFiles] = useState<Record<number, FileRow[]>>({});
  const [open, setOpen] = useState<number | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const seq = useRef(-1);
  const fileInput = useRef<any>(null);

  async function add() {
    if (!title.trim()) return;
    const tempId = seq.current--;
    const td = date ? Math.floor(Date.parse(date + "T00:00:00Z") / 1000) : null;
    setTodos((s) => [...s, { id: tempId, title, status: "todo", target_date: td }]);
    const t = title, d = date; setTitle(""); setDate("");
    const r = await apiWrite("/api/todos/create", "POST", { title: t, targetDate: d || null });
    if (r.data?.id) setTodos((s) => s.map((x) => x.id === tempId ? { ...x, id: r.data.id } : x));
  }
  async function toggle(t: Todo) { const ns = t.status === "done" ? "todo" : "done"; setTodos((s) => s.map((x) => x.id === t.id ? { ...x, status: ns } : x)); if (t.id > 0) await apiWrite(`/api/todos/${t.id}`, "PATCH", { status: ns }); }
  async function del(id: number) { if (!(await confirmDialog({ message: "ลบรายการนี้?", danger: true }))) return; setTodos((s) => s.filter((x) => x.id !== id)); if (id > 0) await apiWrite(`/api/todos/${id}`, "DELETE", {}); }

  // v28 (item 9): แนบไฟล์กับรายการส่วนตัวได้
  async function loadFiles(id: number) { const d = await (await fetch(`/api/attachments?ref=todo&refId=${id}`)).json(); setFiles((m) => ({ ...m, [id]: d.files ?? [] })); }
  function openAttach(id: number) { if (id < 0) return; (fileInput.current as any)._tid = id; fileInput.current.click(); }
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; const tid = (e.target as any)._tid; e.target.value = ""; if (!f || !tid) return;
    setUploading(tid);
    const up = await uploadToGoogleDrive(f); setUploading(null);
    if (up.ok && up.url) { await apiWrite("/api/attachments", "POST", { referenceType: "todo", referenceId: tid, fileName: f.name, gdriveWebLink: up.url, gdriveFileId: up.fileId, fileType: "Other" }); await loadFiles(tid); setOpen(tid); }
  }
  async function delFile(tid: number, fid: number) { setFiles((m) => ({ ...m, [tid]: (m[tid] || []).filter((x) => x.id !== fid) })); await apiWrite(`/api/attachments?id=${fid}`, "DELETE", {}); }
  function expand(id: number) { if (open === id) { setOpen(null); return; } setOpen(id); if (!files[id] && id > 0) loadFiles(id); }

  const sorted = [...todos].sort((a, b) => (a.status === b.status ? 0 : a.status === "done" ? 1 : -1));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input ref={fileInput} type="file" hidden onChange={onFile} />
      <div className="card" style={{ padding: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input className="input" style={{ flex: 1, minWidth: 160 }} placeholder="เพิ่มงานของฉันวันนี้..." value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <input className="input" type="date" style={{ width: 150 }} value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn-pink" onClick={add}>เพิ่ม</button>
      </div>
      <div className="card" style={{ padding: 8 }}>
        {sorted.length === 0 && <div style={{ color: "#9AA0A6", padding: 14, fontSize: 13.5 }}>ยังไม่มีรายการ</div>}
        {sorted.map((t) => {
          const fs = files[t.id] || []; const exp = open === t.id;
          return (
            <div key={t.id} style={{ borderBottom: "1px solid #F4F4F6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", opacity: t.id < 0 ? 0.7 : 1 }}>
                <input type="checkbox" checked={t.status === "done"} onChange={() => toggle(t)} style={{ width: 18, height: 18, accentColor: PINK }} />
                <span style={{ flex: 1, textDecoration: t.status === "done" ? "line-through" : "none", color: t.status === "done" ? "#9AA0A6" : "#1F2937", fontSize: 14 }}>{t.title}</span>
                {t.target_date && <span className="badge" style={{ background: "#EEF1F6", color: NAVY }}>{dstr(t.target_date)}</span>}
                <button title="แนบไฟล์" onClick={() => openAttach(t.id)} className="icon-btn" style={ic}>{uploading === t.id ? "…" : <Icon name="attach" size={15} />}</button>
                <button title="ไฟล์แนบ" onClick={() => expand(t.id)} className="icon-btn" style={{ ...ic, position: "relative" }}><Icon name="requirement" size={15} />{fs.length > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: PINK, color: "#fff", fontSize: 9, fontWeight: 700, minWidth: 15, height: 15, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>{fs.length}</span>}</button>
                <button onClick={() => del(t.id)} className="icon-btn" style={{ ...ic, color: "#DC2626" }}><Icon name="close" size={14} /></button>
              </div>
              {exp && (
                <div style={{ padding: "0 8px 10px 38px" }}>
                  {fs.length === 0 ? <div style={{ fontSize: 12, color: "#9AA0A6" }}>ยังไม่มีไฟล์แนบ — กดไอคอนคลิปเพื่อแนบ</div> : fs.map((f) => (
                    <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                      <a href={f.gdrive_web_link} target="_blank" style={{ color: "#1D4ED8", fontSize: 12.5 }}>📄 {f.file_name}</a>
                      <button onClick={() => delFile(t.id, f.id)} style={{ border: "none", background: "transparent", color: "#DC2626", cursor: "pointer", fontSize: 12 }}>ลบ</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
const ic: React.CSSProperties = { background: "transparent", border: "1px solid #E5E7EB", borderRadius: 7, width: 28, height: 28, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#6B7280", flexShrink: 0 };

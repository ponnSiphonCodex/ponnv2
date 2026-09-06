"use client";
import { useEffect, useState } from "react";
import { RichEditor } from "./rich-editor";
import { uploadToGoogleDrive } from "@/lib/upload";
import { apiWrite, saveDraft, loadDraft, clearDraft } from "@/lib/offline";
import { Icon } from "./icons";

const NAVY = "#001D58", PINK = "#EC186E";
type FileRow = { id: number; file_name: string; file_type: string; gdrive_web_link: string };
const FILE_TYPES = [["Minute", "Meeting Minute"], ["Transcript", "Transcript"], ["Other", "ไฟล์อื่นๆ"]];

export function MeetingEditor({ meetingId }: { meetingId: number | null }) {
  const draftKey = `meeting:${meetingId ?? "new"}`;
  const [id, setId] = useState<number | null>(meetingId);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [organizer, setOrganizer] = useState("");
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<FileRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [upType, setUpType] = useState("Minute");
  const [uploading, setUploading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const draft = loadDraft<any>(draftKey);
      if (meetingId) {
        const r = await fetch(`/api/meetings/detail?id=${meetingId}`);
        if (r.ok) { const d = await r.json(); const m = d.meeting; if (m) {
          setTitle(m.title ?? ""); setDate(m.meeting_date ? new Date(m.meeting_date * 1000).toISOString().slice(0, 10) : date);
          setTime(m.start_time ?? "09:00"); setOrganizer(m.organizer ?? ""); setContent(m.minutes_longtext ?? ""); setNotes(m.internal_notes ?? "");
          setFiles(d.files ?? []);
        } }
      }
      if (draft) { if (draft.title) setTitle(draft.title); if (draft.content) setContent(draft.content); if (draft.notes) setNotes(draft.notes); if (draft.organizer) setOrganizer(draft.organizer); }
      setReady(true);
    }
    init();
  }, []);

  // draft autosave ลง localStorage เบื้องหลัง (item 9)
  useEffect(() => { if (ready) saveDraft(draftKey, { title, content, notes, organizer, date, time }); }, [title, content, notes, organizer, date, time, ready]);

  function flash(ok: boolean, text: string) { setMsg({ ok, text }); setTimeout(() => setMsg(null), 3500); }

  async function save(goBack = false) {
    if (!title.trim()) { flash(false, "กรุณากรอกหัวข้อประชุม"); return; }
    setSaving(true);
    const r = await apiWrite("/api/meetings/save", "POST", { id, title, meetingDate: date, startTime: time, organizer, content, internalNotes: notes });
    setSaving(false);
    if (r.ok || r.queued) {
      clearDraft(draftKey);
      if (r.data?.id && !id) setId(r.data.id);
      flash(true, "บันทึกแล้ว");
      if (goBack) location.href = "/pm/meetings";
    } else flash(false, r.error || "บันทึกไม่สำเร็จ");
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    let mid = id;
    if (!mid) { // ต้อง save meeting ก่อนแนบไฟล์
      const r = await apiWrite("/api/meetings/save", "POST", { title: title || "(ไม่มีหัวข้อ)", meetingDate: date, startTime: time, organizer, content, internalNotes: notes });
      if (r.data?.id) { mid = r.data.id; setId(mid); }
    }
    if (!mid) { flash(false, "บันทึกประชุมก่อนแนบไฟล์"); return; }
    setUploading(true);
    const up = await uploadToGoogleDrive(f);
    setUploading(false);
    if (up.ok && up.url) {
      await apiWrite("/api/attachments", "POST", { referenceType: "meeting", referenceId: mid, fileName: f.name, gdriveFileId: up.fileId, gdriveWebLink: up.url, fileType: upType });
      const d = await (await fetch(`/api/meetings/detail?id=${mid}`)).json();
      setFiles(d.files ?? []); flash(true, "แนบไฟล์แล้ว");
    } else flash(false, up.error || "อัปโหลดไม่สำเร็จ");
  }
  async function delFile(fid: number) {
    setFiles((fs) => fs.filter((f) => f.id !== fid));
    await apiWrite(`/api/attachments?id=${fid}`, "DELETE", {});
  }

  return (
    <div style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      {msg && <div style={{ background: msg.ok ? "#ECFDF5" : "#FEF2F2", color: msg.ok ? "#047857" : "#B91C1C", padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{msg.text}</div>}

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          <F label="หัวข้อประชุม *"><input className="input" placeholder="Xxxxx" value={title} onChange={(e) => setTitle(e.target.value)} /></F>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <F label="วันที่"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></F>
            <F label="เวลา"><input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></F>
            <F label="ผู้จัด / Organizer"><input className="input" placeholder="Xxxxx" value={organizer} onChange={(e) => setOrganizer(e.target.value)} /></F>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 700, color: NAVY }}>บันทึกการประชุม (Rich Text)</div>
      <RichEditor value={content} onChange={setContent} minHeight={340} />

      <div style={{ marginTop: 16, marginBottom: 6, fontSize: 13, fontWeight: 700, color: NAVY }}>โน้ตภายใน (ไม่แสดงสาธารณะ)</div>
      <textarea className="input" style={{ height: 90, padding: 12 }} placeholder="Xxxxx" value={notes} onChange={(e) => setNotes(e.target.value)} />

      {/* Attachments 11.1 */}
      <div className="card" style={{ padding: 18, marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 10 }}>ไฟล์แนบ (Transcript / Meeting Minute / อื่นๆ)</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <select className="input" style={{ width: 180 }} value={upType} onChange={(e) => setUpType(e.target.value)}>{FILE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <label className="btn-ghost" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="attach" size={16} />{uploading ? "กำลังอัปโหลด..." : "เลือกไฟล์แนบ"}<input type="file" hidden onChange={onFile} /></label>
        </div>
        {files.length === 0 ? <div style={{ color: "#9AA0A6", fontSize: 13 }}>ยังไม่มีไฟล์แนบ</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {files.map((f) => (
              <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F0F1F3", padding: "8px 0" }}>
                <a href={f.gdrive_web_link} target="_blank" style={{ color: "#1D4ED8", fontSize: 13.5 }}><span className="badge" style={{ background: f.file_type === "Minute" ? "#FDE7F0" : f.file_type === "Transcript" ? "#EEF2FF" : "#F3F4F6", color: "#374151", marginRight: 8 }}>{f.file_type}</span>📄 {f.file_name}</a>
                <button onClick={() => delFile(f.id)} className="icon-btn" style={{ background: "transparent", border: "none", color: "#DC2626", cursor: "pointer" }}><Icon name="close" size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 20, position: "sticky", bottom: 0, background: "#F4F4F6", padding: "12px 0" }}>
        <a href="/pm/meetings" className="btn-ghost">← กลับ</a>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" onClick={() => save(false)} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
          <button className="btn-primary" onClick={() => save(true)} disabled={saving}>บันทึก & ปิด</button>
        </div>
      </div>
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={{ fontSize: 12.5, fontWeight: 600, color: "#6B7280" }}>{label}</span>{children}</label>; }

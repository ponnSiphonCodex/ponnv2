"use client";
import { useEffect, useState } from "react";
import { RichEditor } from "./rich-editor";
import { MultiSelect } from "./multi-select";
import { uploadToGoogleDrive } from "@/lib/upload";
import { apiWrite, saveDraft, loadDraft, clearDraft } from "@/lib/offline";
import { confirmDialog } from "@/lib/confirm";
import { Icon } from "./icons";

const NAVY = "#001D58";
type FileRow = { id: number; file_name: string; file_type: string; gdrive_web_link: string };
type Opt = { id: number | string; name: string };

export function MeetingEditor({ meetingId }: { meetingId: number | null }) {
  const draftKey = `meeting:${meetingId ?? "new"}`;
  const [id, setId] = useState<number | null>(meetingId);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [organizer, setOrganizer] = useState("");
  const [attendees, setAttendees] = useState("");
  const [productIds, setProductIds] = useState<(number | string)[]>([]);
  const [projectIds, setProjectIds] = useState<(number | string)[]>([]);
  const [products, setProducts] = useState<Opt[]>([]);
  const [projects, setProjects] = useState<Opt[]>([]);
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<FileRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const [pd, pj] = await Promise.all([
        fetch("/api/ref/products").then((r) => r.json()).then((j) => (j.options ?? []).map((o: any) => ({ id: o.id, name: o.label }))).catch(() => []),
        fetch("/api/ref/projects").then((r) => r.json()).then((j) => (j.options ?? []).map((o: any) => ({ id: o.id, name: o.label }))).catch(() => []),
      ]);
      setProducts(pd); setProjects(pj);
      const draft = loadDraft<any>(draftKey);
      if (meetingId) {
        const r = await fetch(`/api/meetings/detail?id=${meetingId}`);
        if (r.ok) { const d = await r.json(); const m = d.meeting; if (m) {
          setTitle(m.title ?? ""); setDate(m.meeting_date ? new Date(m.meeting_date * 1000).toISOString().slice(0, 10) : date);
          setTime(m.start_time ?? "09:00"); setOrganizer(m.organizer ?? ""); setAttendees(m.attendees ?? "");
          setContent(m.minutes_longtext ?? ""); setNotes(m.internal_notes ?? ""); setFiles(d.files ?? []);
          try { setProjectIds(JSON.parse(m.project_ids ?? "[]")); } catch {}
          try { setProductIds(JSON.parse(m.product_ids ?? "[]")); } catch {}
        } }
      }
      if (draft) { if (draft.title) setTitle(draft.title); if (draft.content) setContent(draft.content); if (draft.notes) setNotes(draft.notes); if (draft.organizer) setOrganizer(draft.organizer); if (draft.attendees) setAttendees(draft.attendees); if (draft.projectIds) setProjectIds(draft.projectIds); if (draft.productIds) setProductIds(draft.productIds); }
      setReady(true);
    }
    init();
  }, []);
  useEffect(() => { if (ready) saveDraft(draftKey, { title, content, notes, organizer, attendees, projectIds, productIds, date, time }); }, [title, content, notes, organizer, attendees, projectIds, productIds, date, time, ready]);

  function flash(ok: boolean, text: string) { setMsg({ ok, text }); if (ok) setTimeout(() => setMsg(null), 3500); }
  function payload() {
    const projectName = [...products.filter((o) => productIds.map(String).includes(String(o.id))), ...projects.filter((o) => projectIds.map(String).includes(String(o.id)))].map((o) => o.name).join(", ");
    return { title, meetingDate: date, startTime: time, organizer, attendees, projectIds, productIds, projectName, content, internalNotes: notes };
  }
  // คืนค่า id ถ้าสำเร็จ, null ถ้าไม่สำเร็จ (และ flash error จริงจาก server ให้เห็น ไม่ silent)
  async function doSave(withId: boolean): Promise<number | null> {
    const r = await apiWrite("/api/meetings/save", "POST", { id: withId ? id : undefined, ...payload() });
    if (r.data?.id) { setId(r.data.id); return r.data.id; }
    if (r.error) flash(false, r.error);
    return null;
  }
  async function save(goBack = false) {
    if (!title.trim()) { flash(false, "กรุณากรอกหัวข้อประชุม"); return; }
    setSaving(true); const mid = await doSave(true); setSaving(false);
    if (mid) { clearDraft(draftKey); flash(true, "บันทึกแล้ว"); if (goBack) location.href = "/pm/meetings"; }
  }

  // v28 (10.1): แนบไฟล์ = save-as-step — ถ้ายังไม่เคยบันทึก จะยืนยัน (popup theme ไม่ใช่ browser) แล้วบันทึกให้อัตโนมัติก่อนเปิดเลือกไฟล์
  async function pickAndUpload(fileType: string) {
    if (!title.trim()) { flash(false, "กรอกหัวข้อประชุมก่อน"); return; }
    if (!id) {
      const ok = await confirmDialog({ title: "บันทึกประชุมก่อนแนบไฟล์", message: "ต้องบันทึกบันทึกประชุมนี้ก่อน จึงจะแนบไฟล์ได้\nระบบจะบันทึกให้อัตโนมัติแล้วเปิดให้เลือกไฟล์ต่อทันที", confirmText: "บันทึก & เลือกไฟล์" });
      if (!ok) return;
      setSaving(true); const mid = await doSave(false); setSaving(false);
      if (!mid) return; // error ถูก flash โดย doSave แล้ว (เห็นสาเหตุจริงจาก server)
      flash(true, "บันทึกประชุมแล้ว — เลือกไฟล์เพื่อแนบได้เลย");
    }
    const inp = document.getElementById("mfile") as any; inp._ftype = fileType; inp.click();
  }
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; const fileType = (e.target as any)._ftype || "Other"; e.target.value = ""; if (!f || !id) return;
    setUploading(fileType);
    const up = await uploadToGoogleDrive(f); setUploading(null);
    if (up.ok && up.url) {
      const r = await apiWrite("/api/attachments", "POST", { referenceType: "meeting", referenceId: id, fileName: f.name, gdriveFileId: up.fileId, gdriveWebLink: up.url, fileType });
      if (!r.ok && !r.queued) { flash(false, r.error || "แนบไฟล์ไม่สำเร็จ"); return; }
      const d = await (await fetch(`/api/meetings/detail?id=${id}`)).json();
      setFiles(d.files ?? []); flash(true, "แนบไฟล์แล้ว");
    } else flash(false, up.error || "อัปโหลดไม่สำเร็จ");
  }
  async function delFile(fid: number) { setFiles((fs) => fs.filter((f) => f.id !== fid)); await apiWrite(`/api/attachments?id=${fid}`, "DELETE", {}); }

  const AttachBtn = ({ type, label, color }: { type: string; label: string; color: string }) => (
    <button type="button" onClick={() => pickAndUpload(type)} className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 6, borderColor: color, color }}>
      <Icon name="attach" size={16} />{uploading === type ? "กำลังอัปโหลด..." : label}
    </button>
  );

  return (
    <div style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      {msg && <div style={{ background: msg.ok ? "#ECFDF5" : "#FEF2F2", color: msg.ok ? "#047857" : "#B91C1C", padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13, whiteSpace: "pre-line" }}>{msg.text}</div>}
      <div className="card" style={{ padding: 20, marginBottom: 16, display: "grid", gap: 14 }}>
        <F label="หัวข้อประชุม *"><input className="input" placeholder="Xxxxx" value={title} onChange={(e) => setTitle(e.target.value)} /></F>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
          <F label="วันที่"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></F>
          <F label="เวลา"><input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></F>
          <F label="ผู้จัด / Organizer"><input className="input" placeholder="Xxxxx" value={organizer} onChange={(e) => setOrganizer(e.target.value)} /></F>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          <F label="Product (เลือกได้หลายรายการ)"><MultiSelect options={products} value={productIds} onChange={setProductIds} placeholder="— เลือก Product —" /></F>
          <F label="Project (เลือกได้หลายรายการ)"><MultiSelect options={projects} value={projectIds} onChange={setProjectIds} placeholder="— เลือก Project —" /></F>
        </div>
        <F label="ผู้เข้าร่วม (คั่นด้วย ,)"><input className="input" placeholder="Xxxxx, Xxxxx" value={attendees} onChange={(e) => setAttendees(e.target.value)} /></F>
      </div>

      <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 700, color: NAVY }}>บันทึกการประชุม (Rich Text)</div>
      <RichEditor value={content} onChange={setContent} minHeight={340} />

      <div style={{ marginTop: 16, marginBottom: 6, fontSize: 13, fontWeight: 700, color: NAVY }}>โน้ตภายใน (ไม่แสดงสาธารณะ)</div>
      <textarea className="input" style={{ height: 90, padding: 12 }} placeholder="Xxxxx" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <div className="card" style={{ padding: 18, marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4 }}>ไฟล์แนบ</div>
        <div style={{ fontSize: 12, color: "#9AA0A6", marginBottom: 10 }}>{id ? "แนบได้เลย" : "ยังไม่ได้บันทึก — กดปุ่มด้านล่างเพื่อบันทึก+แนบพร้อมกัน"}</div>
        <input id="mfile" type="file" hidden onChange={onFile} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <AttachBtn type="Minute" label="Meeting Minute" color="#B4185A" />
          <AttachBtn type="Transcript" label="Transcript" color="#4338CA" />
          <AttachBtn type="Other" label="ไฟล์อื่นๆ" color="#6B7280" />
        </div>
        {files.length === 0 ? <div style={{ color: "#9AA0A6", fontSize: 13 }}>ยังไม่มีไฟล์แนบ</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {files.map((f) => (
              <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F0F1F3", padding: "8px 0" }}>
                <a href={f.gdrive_web_link} target="_blank" style={{ color: "#1D4ED8", fontSize: 13.5 }}><span className="badge" style={{ background: f.file_type === "Minute" ? "#FDE7F0" : f.file_type === "Transcript" ? "#EEF2FF" : "#F3F4F6", color: "#374151", marginRight: 8 }}>{f.file_type}</span>📄 {f.file_name}</a>
                <button onClick={() => delFile(f.id)} style={{ background: "transparent", border: "none", color: "#DC2626", cursor: "pointer" }}><Icon name="close" size={16} /></button>
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

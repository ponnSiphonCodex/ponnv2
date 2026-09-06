"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./icons";

const NAVY = "#001D58", PINK = "#EC186E";
const MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const DOW = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const LS = "meetings:cache";
type Meeting = { id: number; title: string; meeting_date: number | null; start_time: string | null; organizer: string | null; attendees?: string | null; project_name?: string | null; min_cnt: number; tr_cnt: number; file_cnt: number; has_note: number };
const pad = (n: number) => String(n).padStart(2, "0");
const dsOf = (u: number | null) => u ? new Date(u * 1000).toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" }) : "";
const fmtDT = (u: number | null, t: string | null) => u ? `${dsOf(u)} ${t || ""} น.` : "-";

// ลิงก์ Sync ปฏิทิน — ชื่อขึ้นต้น [mom]
function gcalUrl(m: Meeting) {
  const start = calStamp(m); const end = calStampEnd(m);
  const p = new URLSearchParams({ action: "TEMPLATE", text: `[mom] ${m.title}`, dates: `${start}/${end}`, details: `Organizer: ${m.organizer || "-"}\nไฟล์บันทึก/Transcript ดูในระบบ PM` });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
function msUrl(m: Meeting) {
  const s = isoStamp(m), e = isoStampEnd(m);
  const p = new URLSearchParams({ path: "/calendar/action/compose", rru: "addevent", subject: `[mom] ${m.title}`, startdt: s, enddt: e, body: `Organizer: ${m.organizer || "-"}` });
  return `https://outlook.office.com/calendar/0/deeplink/compose?${p.toString()}`;
}
function baseDate(m: Meeting) { const d = m.meeting_date ? new Date(m.meeting_date * 1000) : new Date(); const [h, mi] = (m.start_time || "09:00").split(":").map(Number); d.setUTCHours(h - 7, mi, 0, 0); return d; }
function calStamp(m: Meeting) { const d = baseDate(m); return d.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z"; }
function calStampEnd(m: Meeting) { const d = baseDate(m); d.setUTCHours(d.getUTCHours() + 1); return d.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z"; }
function isoStamp(m: Meeting) { return baseDate(m).toISOString(); }
function isoStampEnd(m: Meeting) { const d = baseDate(m); d.setUTCHours(d.getUTCHours() + 1); return d.toISOString(); }

export function MeetingsView({ canWrite }: { canWrite: boolean }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [view, setView] = useState<"calendar" | "table">("calendar");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [sel, setSel] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [matchIds, setMatchIds] = useState<number[] | null>(null); // null = ไม่ค้น
  const timer = useRef<any>(null);

  // cache-first: โชว์จาก localStorage ทันที แล้ว refresh เบื้องหลัง (item 7.4)
  useEffect(() => {
    try { const c = JSON.parse(localStorage.getItem(LS) || "null"); if (c?.length) setMeetings(c); } catch {}
    fetch("/api/meetings/list").then((r) => r.json()).then((d) => { if (d.meetings) { setMeetings(d.meetings); localStorage.setItem(LS, JSON.stringify(d.meetings)); } });
  }, []);

  // search (item 7.1)
  useEffect(() => {
    clearTimeout(timer.current);
    if (!q.trim()) { setMatchIds(null); return; }
    timer.current = setTimeout(async () => {
      const r = await fetch(`/api/meetings/search?q=${encodeURIComponent(q)}`);
      if (r.ok) { const d = await r.json(); setMatchIds(d.ids); }
    }, 300);
  }, [q]);

  const visible = matchIds === null ? meetings : meetings.filter((m) => matchIds.includes(m.id));
  const byDate = useMemo(() => {
    const mp: Record<string, Meeting[]> = {};
    for (const e of visible) { const ds = dsOf(e.meeting_date); if (!ds) continue; (mp[ds] ||= []).push(e); }
    for (const k in mp) mp[k].sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
    return mp;
  }, [visible]);

  const todayDs = dsOf(Math.floor(Date.now() / 1000));
  const first = new Date(Date.UTC(year, month, 1));
  const startDow = first.getUTCDay();
  const dim = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  function nav(delta: number) { let m = month + delta, y = year; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } setMonth(m); setYear(y); }
  const selList = sel ? (byDate[sel] || []) : [];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => setView("calendar")} style={vbtn(view === "calendar")}><Icon name="calendar-view" size={16} /> ปฏิทิน</button>
          <button onClick={() => setView("table")} style={vbtn(view === "table")}><Icon name="table" size={16} /> ตาราง</button>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา: หัวข้อ / project / ผู้เข้าร่วม / คำในบันทึก..." className="input" style={{ width: 320, maxWidth: "70vw" }} />
        </div>
        {canWrite && <a href="/pm/meetings/edit" className="btn-pink" style={{ textDecoration: "none" }}>+ เพิ่มบันทึกประชุม</a>}
      </div>

      {view === "calendar" ? (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div className="card" style={{ flex: "3 1 560px", padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <button className="btn-ghost" onClick={() => nav(-1)}>‹</button>
              <div style={{ fontWeight: 700, color: NAVY, fontSize: 16, flex: 1, textAlign: "center" }}>{MONTHS[month]} {year}</div>
              <button className="btn-ghost" onClick={() => nav(1)}>›</button>
              <button className="btn-ghost" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}>วันนี้</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
              {DOW.map((d) => <div key={d} style={{ textAlign: "center", fontWeight: 700, color: NAVY, fontSize: 12.5, padding: "4px 0" }}>{d}</div>)}
              {cells.map((d, i) => {
                if (!d) return <div key={i} />;
                const ds = `${year}-${pad(month + 1)}-${pad(d)}`;
                const list = byDate[ds]; const isToday = ds === todayDs; const isSel = ds === sel;
                return (
                  <div key={i} onClick={() => list && setSel(ds)} style={{ minHeight: 92, border: isSel ? `1.5px solid ${PINK}` : "1px solid #EAECEF", borderRadius: 8, padding: 5, cursor: list ? "pointer" : "default", background: isSel ? "#FDECF3" : list ? "#EEF1F4" : "#fff", overflow: "hidden" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isToday ? "#fff" : (list ? NAVY : "#AEB2C0"), background: isToday ? PINK : "transparent", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{d}</div>
                    {(list || []).slice(0, 3).map((e) => <div key={e.id} title={e.title} style={{ fontSize: 10.5, marginTop: 3, borderRadius: 4, padding: "2px 5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", background: e.min_cnt ? PINK : "#F6F7F9", color: e.min_cnt ? "#fff" : "#8A91A0", border: e.min_cnt ? "none" : "1px solid #C2C8D4", fontWeight: e.min_cnt ? 600 : 400 }}>{e.start_time || ""} {e.title}</div>)}
                    {list && list.length > 3 && <div style={{ fontSize: 10, color: "#9AA0A6", marginTop: 2 }}>+{list.length - 3} เพิ่มเติม</div>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card" style={{ flex: "1 1 320px", padding: 16, maxHeight: "calc(100dvh - 220px)", overflowY: "auto" }}>
            {sel ? <>
              <h3 style={{ margin: "0 0 2px", color: NAVY, fontSize: 16 }}>{new Date(sel).getUTCDate()} {MONTHS[new Date(sel).getUTCMonth()]} {new Date(sel).getUTCFullYear()}</h3>
              <div style={{ fontSize: 12.5, color: "#9AA0A6", marginBottom: 12 }}>{selList.length} ประชุม</div>
              {selList.map((e) => <MeetingCard key={e.id} e={e} canWrite={canWrite} />)}
            </> : <div style={{ color: "#9AA0A6", textAlign: "center", padding: "30px 0", fontSize: 13.5 }}>เลือกวันที่มีประชุม (ช่องสีเทา)</div>}
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table>
            <thead><tr style={{ background: "#F9FAFB", textAlign: "left" }}><th style={th}>วันเวลา</th><th style={th}>หัวข้อประชุม</th><th style={th}>ผู้จัด</th><th style={th}>ไฟล์</th><th style={th}></th></tr></thead>
            <tbody>
              {visible.length === 0 && <tr><td colSpan={5} style={{ ...td, color: "#9AA0A6" }}>ไม่พบบันทึกประชุม</td></tr>}
              {visible.map((e) => (
                <tr key={e.id} style={{ borderTop: "1px solid #F0F1F3" }}>
                  <td style={{ ...td, whiteSpace: "nowrap", fontSize: 12.5, color: "#6B7280" }}>{fmtDT(e.meeting_date, e.start_time)}</td>
                  <td style={td}><a href={`/pm/meetings/edit?id=${e.id}`} style={{ color: NAVY, fontWeight: 600, textDecoration: "none" }}>{e.title}</a></td>
                  <td style={td}>{e.organizer || "-"}</td>
                  <td style={td}>{e.min_cnt ? <span className="badge" style={{ background: "#FDE7F0", color: "#B4185A", marginRight: 4 }}>Minute {e.min_cnt}</span> : null}{e.tr_cnt ? <span className="badge" style={{ background: "#EEF2FF", color: "#4338CA" }}>Tr {e.tr_cnt}</span> : null}{!e.file_cnt && "-"}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <a href={gcalUrl(e)} target="_blank" title="Sync Google Calendar" className="icon-btn" style={ic}><Icon name="gcal" size={16} /></a>
                    <a href={msUrl(e)} target="_blank" title="Sync MS Calendar" className="icon-btn" style={ic}><Icon name="calendar-view" size={16} /></a>
                    {canWrite && <a href={`/pm/meetings/edit?id=${e.id}`} className="btn-ghost" style={{ padding: "5px 10px", textDecoration: "none", marginLeft: 6 }}>แก้ไข</a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MeetingCard({ e, canWrite }: { e: Meeting; canWrite: boolean }) {
  return (
    <div style={{ borderLeft: `4px solid ${e.min_cnt ? PINK : "#94A3B8"}`, border: "1px solid #F0E3E9", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.4 }}><span className="badge" style={{ background: e.min_cnt ? PINK : "#ECEEF4", color: e.min_cnt ? "#fff" : "#9aa0ac", marginRight: 6 }}>{e.start_time || "-"}</span>{e.title}</div>
        {canWrite && <a href={`/pm/meetings/edit?id=${e.id}`} title="แก้ไข" style={{ flexShrink: 0, opacity: .5 }}><Icon name="requirement" size={16} /></a>}
      </div>
      {e.organizer && <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{e.organizer}</div>}
      <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
        {e.has_note ? <span className="badge" style={{ background: "#ECFDF5", color: "#047857" }}>มีบันทึก</span> : null}
        {e.min_cnt ? <span className="badge" style={{ background: "#FDE7F0", color: "#B4185A" }}>Minute {e.min_cnt}</span> : null}
        {e.tr_cnt ? <span className="badge" style={{ background: "#EEF2FF", color: "#4338CA" }}>Transcript {e.tr_cnt}</span> : null}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <a href={gcalUrl(e)} target="_blank" className="btn-ghost" style={{ padding: "5px 10px", fontSize: 12, textDecoration: "none", display: "inline-flex", gap: 5, alignItems: "center" }}><Icon name="gcal" size={14} /> Google</a>
        <a href={msUrl(e)} target="_blank" className="btn-ghost" style={{ padding: "5px 10px", fontSize: 12, textDecoration: "none", display: "inline-flex", gap: 5, alignItems: "center" }}><Icon name="calendar-view" size={14} /> MS</a>
      </div>
    </div>
  );
}
function vbtn(a: boolean): React.CSSProperties { return { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13.5, background: a ? NAVY : "#fff", color: a ? "#fff" : "#6B7280", boxShadow: a ? "none" : "0 0 0 1px #E5E7EB inset" }; }
const ic: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 7, border: "1px solid #E5E7EB", color: "#6B7280", marginLeft: 4, textDecoration: "none" };
const th: React.CSSProperties = { padding: "11px 14px", fontSize: 12.5, fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "11px 14px", fontSize: 13.5 };

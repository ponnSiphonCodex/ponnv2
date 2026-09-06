"use client";
import { useRef, useEffect } from "react";
const NAVY = "#001D58";

/** Rich Text editor: Bold/Italic/Underline, Bullet, Numbering, Indent(Tab), Highlight, Heading, Link */
export function RichEditor({ value, onChange, minHeight = 360 }: { value: string; onChange: (html: string) => void; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || ""; }, []);
  function cmd(command: string, arg?: string) { document.execCommand(command, false, arg); ref.current?.focus(); sync(); }
  function sync() { if (ref.current) onChange(ref.current.innerHTML); }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Tab") { e.preventDefault(); document.execCommand(e.shiftKey ? "outdent" : "indent"); sync(); }
  }
  const Btn = ({ icon, on, title }: { icon: string; on: () => void; title: string }) => (
    <button type="button" title={title} onMouseDown={(e) => { e.preventDefault(); on(); }} style={{ minWidth: 32, height: 32, border: "1px solid #E5E7EB", background: "#fff", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#374151" }}>{icon}</button>
  );
  return (
    <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: 8, borderBottom: "1px solid #F0F1F3", background: "#F9FAFB" }}>
        <Btn icon="B" title="ตัวหนา" on={() => cmd("bold")} />
        <Btn icon="I" title="ตัวเอียง" on={() => cmd("italic")} />
        <Btn icon="U" title="ขีดเส้นใต้" on={() => cmd("underline")} />
        <span style={sep} />
        <Btn icon="H1" title="หัวข้อใหญ่" on={() => cmd("formatBlock", "H2")} />
        <Btn icon="H2" title="หัวข้อรอง" on={() => cmd("formatBlock", "H3")} />
        <Btn icon="¶" title="ย่อหน้าปกติ" on={() => cmd("formatBlock", "P")} />
        <span style={sep} />
        <Btn icon="•" title="Bullet Point" on={() => cmd("insertUnorderedList")} />
        <Btn icon="1." title="Numbering" on={() => cmd("insertOrderedList")} />
        <Btn icon="⇥" title="เพิ่มระยะ (Tab)" on={() => cmd("indent")} />
        <Btn icon="⇤" title="ลดระยะ" on={() => cmd("outdent")} />
        <span style={sep} />
        <button type="button" title="ไฮไลต์" onMouseDown={(e) => { e.preventDefault(); cmd("hiliteColor", "#FEF08A"); }} style={{ minWidth: 32, height: 32, border: "1px solid #E5E7EB", background: "#FEF08A", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>H</button>
        <Btn icon="🔗" title="ลิงก์" on={() => { const u = prompt("URL:"); if (u) cmd("createLink", u); }} />
        <Btn icon="⨯" title="ล้างรูปแบบ" on={() => cmd("removeFormat")} />
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning onInput={sync} onBlur={sync} onKeyDown={onKey}
        style={{ minHeight, padding: "14px 16px", outline: "none", fontSize: 14.5, lineHeight: 1.7, color: "#1F2937" }} />
    </div>
  );
}
const sep: React.CSSProperties = { width: 1, background: "#E5E7EB", margin: "2px 4px", alignSelf: "stretch" };

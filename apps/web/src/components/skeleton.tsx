"use client";
export function Skel({ w = "100%", h = 14, r = 6, style }: { w?: number | string; h?: number; r?: number; style?: React.CSSProperties }) {
  return <span className="skel" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}
export function SkelRows({ cols, rows = 6 }: { cols: number; rows?: number }) {
  return (<>{Array.from({ length: rows }).map((_, i) => (
    <tr key={i} style={{ borderTop: "1px solid #F0F1F3" }}>
      {Array.from({ length: cols }).map((__, j) => <td key={j} style={{ padding: "12px 14px" }}><Skel w={j === 0 ? "70%" : "50%"} /></td>)}
    </tr>
  ))}</>);
}
export function SkelCards({ n = 6 }: { n?: number }) {
  return (<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}><Skel w={46} h={46} r={23} /><div style={{ flex: 1 }}><Skel w="60%" h={15} style={{ marginBottom: 8 }} /><Skel w="40%" h={12} /></div></div>
        <Skel w="80%" h={12} style={{ marginBottom: 7 }} /><Skel w="65%" h={12} />
      </div>
    ))}
  </div>);
}

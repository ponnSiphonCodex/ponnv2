"use client";
import { useState } from "react";
import { CrudManager } from "./crud-manager";
import { CustomFieldManager } from "./custom-field-manager";

const NAVY = "#001D58", PINK = "#EC186E";
export type Tab = { key: string; label: string; special?: "custom-fields" };

export function TabbedCrud({ tabs, canMaster = false }: { tabs: Tab[]; canMaster?: boolean }) {
  const [active, setActive] = useState(tabs[0].key);
  const cur = tabs.find((t) => t.key === active)!;
  return (
    <div>
      <div style={{ display: "flex", gap: 4, padding: "12px 24px 0", borderBottom: "1px solid #E5E7EB", background: "#fff", overflowX: "auto" }}>
        {tabs.map((t) => {
          const a = t.key === active;
          return (
            <button key={t.key} onClick={() => setActive(t.key)} style={{ padding: "10px 16px", border: "none", background: "transparent", borderBottom: a ? `2.5px solid ${PINK}` : "2.5px solid transparent", color: a ? NAVY : "#9AA0A6", fontWeight: a ? 700 : 500, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap" }}>{t.label}</button>
          );
        })}
      </div>
      {cur.special === "custom-fields" ? <CustomFieldManager canWrite={canMaster} /> : <CrudManager key={cur.key} entity={cur.key} />}
    </div>
  );
}

/** Master Data — แท็บด้านบน + cache ตารางที่โหลดแล้ว (mount ครั้งเดียวต่อแท็บ) */
export function MasterDataManager({ tabs, canMaster }: { tabs: Tab[]; canMaster: boolean }) {
  const [active, setActive] = useState(tabs[0].key);
  const [loaded, setLoaded] = useState<string[]>([tabs[0].key]);
  function pick(k: string) { setActive(k); setLoaded((l) => (l.includes(k) ? l : [...l, k])); }
  return (
    <div>
      <div style={{ display: "flex", gap: 4, padding: "12px 24px 0", borderBottom: "1px solid #E5E7EB", background: "#fff", overflowX: "auto" }}>
        {tabs.map((t) => {
          const a = t.key === active;
          return <button key={t.key} onClick={() => pick(t.key)} style={{ padding: "10px 16px", border: "none", background: "transparent", borderBottom: a ? `2.5px solid ${PINK}` : "2.5px solid transparent", color: a ? NAVY : "#9AA0A6", fontWeight: a ? 700 : 500, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap" }}>{t.label}</button>;
        })}
      </div>
      {tabs.filter((t) => loaded.includes(t.key)).map((t) => (
        <div key={t.key} style={{ display: t.key === active ? "block" : "none" }}>
          {t.special === "custom-fields" ? <CustomFieldManager canWrite={canMaster} /> : <CrudManager entity={t.key} />}
        </div>
      ))}
    </div>
  );
}

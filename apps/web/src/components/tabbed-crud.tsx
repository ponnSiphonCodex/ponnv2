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

/** Master Data — dropdown เลือกตารางแทนแท็บ (สำหรับข้อมูลตั้งค่าที่มีเยอะ) */
export function MasterDataManager({ tabs, canMaster }: { tabs: Tab[]; canMaster: boolean }) {
  const [active, setActive] = useState(tabs[0].key);
  const cur = tabs.find((t) => t.key === active)!;
  return (
    <div>
      <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#6B7280" }}>เลือกชุดข้อมูล:</span>
        <select className="input" style={{ width: "auto", minWidth: 220 }} value={active} onChange={(e) => setActive(e.target.value)}>
          {tabs.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>
      {cur.special === "custom-fields" ? <CustomFieldManager canWrite={canMaster} /> : <CrudManager key={cur.key} entity={cur.key} />}
    </div>
  );
}

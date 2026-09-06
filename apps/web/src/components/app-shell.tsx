"use client";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ProfileModal } from "./profile-modal";
import { NotificationBell } from "./notification-bell";
import { GlobalSearch } from "./global-search";
import { Icon } from "./icons";

const NAVY = "#001D58";
const PINK = "#EC186E";

type Child = { key: string; label: string; href: string; icon: string };
type Item = { key: string; label: string; href: string; icon: string; adminOnly?: boolean; masterOnly?: boolean; children?: Child[] };
type Group = { title: string; items: Item[] };

const PROJECT_VIEWS = ["board", "calendar", "gantt", "todos"]; // sub-view keys ของ Project

const GROUPS: Group[] = [
  { title: "", items: [
    { key: "dashboard", label: "Dashboard", href: "/pm/dashboard", icon: "dashboard" },
  ]},
  { title: "PROJECT", items: [
    { key: "product-feature", label: "Product & Feature", href: "/pm/portfolio", icon: "product" },
    { key: "project", label: "Project", href: "/pm/manage/projects", icon: "project", children: [
      { key: "board", label: "Tasks List", href: "/pm/board?id=1", icon: "board" },
      { key: "calendar", label: "Calendar View", href: "/pm/calendar", icon: "calendar" },
      { key: "gantt", label: "Gantt Chart", href: "/pm/gantt?id=1", icon: "gantt" },
      { key: "todos", label: "To-Day Planning", href: "/pm/todos", icon: "todo" },
    ]},
    { key: "milestones", label: "Project Milestone", href: "/pm/manage/milestones", icon: "milestone" },
    { key: "team", label: "Working Team", href: "/pm/team", icon: "team" },
    { key: "issues", label: "Issues List", href: "/pm/issues", icon: "issue" },
  ]},
  { title: "", items: [
    { key: "meetings", label: "Meeting Records", href: "/pm/manage/meetings", icon: "meeting" },
  ]},
  { title: "SETTING", items: [
    { key: "settings", label: "Master Data", href: "/pm/settings", icon: "settings", masterOnly: true },
    { key: "users", label: "จัดการผู้ใช้งาน", href: "/pm/users", icon: "usercog", adminOnly: true },
    { key: "logs", label: "System Log", href: "/pm/logs", icon: "log", adminOnly: true },
  ]},
];

export type ShellUser = { id: string; name: string | null; email: string; image: string | null; avatarUrl: string | null };

export function AppShell({ children, active, user, isAdmin, canMaster, guest, systemRole, roleLabel, impersonating, realName }: {
  children: ReactNode; active: string; user: ShellUser; isAdmin: boolean; canMaster: boolean; guest: boolean; systemRole: string; roleLabel: string; impersonating?: boolean; realName?: string | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [projOpen, setProjOpen] = useState(PROJECT_VIEWS.includes(active));
  useEffect(() => { if (localStorage.getItem("sidebar_collapsed") === "1") setCollapsed(true); setReady(true); }, []);
  useEffect(() => { if (PROJECT_VIEWS.includes(active)) setProjOpen(true); }, [active]);
  function toggle() { setCollapsed((c) => { const n = !c; localStorage.setItem("sidebar_collapsed", n ? "1" : "0"); return n; }); }

  const width = collapsed ? 66 : 250;
  const avatar = user.avatarUrl || user.image;
  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();
  const canSee = (it: Item) => (!it.adminOnly || isAdmin) && (!it.masterOnly || canMaster);
  const rowStyle = (a: boolean): React.CSSProperties => ({ display: "flex", alignItems: "center", gap: 11, padding: collapsed ? "10px 0" : "9px 11px", justifyContent: collapsed ? "center" : "flex-start", borderRadius: 9, textDecoration: "none", color: a ? "#fff" : "rgba(255,255,255,.72)", background: a ? PINK : "transparent", fontSize: 13.5, fontWeight: a ? 600 : 500, whiteSpace: "nowrap", marginBottom: 2, cursor: "pointer" });

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "#F4F4F6" }}>
      <aside style={{ width, minWidth: width, background: NAVY, color: "#fff", display: "flex", flexDirection: "column", transition: ready ? "width .18s ease, min-width .18s ease" : "none", position: "sticky", top: 0, height: "100dvh" }}>
        <button onClick={toggle} aria-label="menu" style={{ display: "flex", alignItems: "center", gap: 11, padding: "15px 14px", borderBottom: "1px solid rgba(255,255,255,.1)", background: "transparent", border: "none", cursor: "pointer", width: "100%" }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: collapsed ? 36 : 34, height: collapsed ? 36 : 34, background: "#fff", borderRadius: 9, overflow: "hidden", flexShrink: 0 }}><img src="/rocket-logo.png" alt="logo" style={{ width: "84%", height: "84%", objectFit: "contain" }} /></span>
          {!collapsed && <span style={{ fontWeight: 700, fontSize: 16, color: "#fff", whiteSpace: "nowrap" }}>Portfolio</span>}
        </button>

        <nav style={{ flex: 1, padding: "8px 8px", overflowY: "auto" }}>
          {guest ? (
            !collapsed && <div style={{ padding: 14, fontSize: 12.5, color: "rgba(255,255,255,.65)", lineHeight: 1.7 }}>บัญชีนี้ยังไม่ได้รับสิทธิ์ใช้งาน — กรุณารอผู้ดูแลเพิ่มสิทธิ์</div>
          ) : GROUPS.map((g, gi) => {
            const items = g.items.filter(canSee); if (!items.length) return null;
            return (
              <div key={gi} style={{ marginBottom: 10 }}>
                {!collapsed && g.title && <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.4)", padding: "8px 10px 5px", textTransform: "uppercase", letterSpacing: 1 }}>{g.title}</div>}
                {!collapsed && !g.title && gi > 0 && <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "6px 10px 8px" }} />}
                {items.map((m) => {
                  const a = active === m.key;
                  // ── Expandable (Project) ──
                  if (m.children) {
                    const childActive = m.children.some((c) => c.key === active);
                    return (
                      <div key={m.key}>
                        <div style={rowStyle(a || childActive)} onClick={() => { if (collapsed) { toggle(); setProjOpen(true); } else setProjOpen((o) => !o); }}>
                          <span style={{ display: "flex", alignItems: "center", opacity: (a || childActive) ? 1 : .85 }}><Icon name={m.icon} size={19} /></span>
                          {!collapsed && <><span style={{ flex: 1 }}>{m.label}</span><span style={{ transition: "transform .15s", transform: projOpen ? "rotate(90deg)" : "none", fontSize: 11 }}>▶</span></>}
                        </div>
                        {!collapsed && projOpen && (
                          <div style={{ marginLeft: 14, borderLeft: "1px solid rgba(255,255,255,.12)", paddingLeft: 6, marginBottom: 4 }}>
                            {m.children.map((c) => {
                              const ca = active === c.key;
                              return (
                                <a key={c.key} href={c.href} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, textDecoration: "none", color: ca ? "#fff" : "rgba(255,255,255,.65)", background: ca ? "rgba(236,24,110,.9)" : "transparent", fontSize: 13, fontWeight: ca ? 600 : 500, marginBottom: 1 }}>
                                  <span style={{ display: "flex", opacity: ca ? 1 : .75 }}><Icon name={c.icon} size={16} /></span>{c.label}
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  // ── Normal ──
                  return (
                    <a key={m.key} href={m.href} title={collapsed ? m.label : undefined} style={rowStyle(a)}>
                      <span style={{ display: "flex", alignItems: "center", opacity: a ? 1 : .85 }}><Icon name={m.icon} size={19} /></span>{!collapsed && <span>{m.label}</span>}
                    </a>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <button onClick={() => setShowProfile(true)} title="โปรไฟล์ของฉัน" style={{ borderTop: "1px solid rgba(255,255,255,.1)", padding: 12, display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}>
          {avatar ? <img src={avatar} alt="" style={{ width: 34, height: 34, minWidth: 34, borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: 34, height: 34, minWidth: 34, borderRadius: "50%", background: PINK, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff" }}>{initial}</div>}
          {!collapsed && (<div style={{ overflow: "hidden", flex: 1 }}><div style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name || user.email}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{roleLabel}</div></div>)}
          {!collapsed && <span style={{ color: "rgba(255,255,255,.5)", display: "flex" }}><Icon name="settings" size={16} /></span>}
        </button>
      </aside>

      <main style={{ flex: 1, minWidth: 0, overflowX: "auto" }}>
        {!guest && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "8px 20px", background: "#fff", borderBottom: "1px solid #F0F1F3", position: "sticky", top: 0, zIndex: 30 }}>
            <GlobalSearch />
            <NotificationBell />
          </div>
        )}
        {impersonating && (
          <div style={{ background: "#FEF3C7", borderBottom: "1px solid #FCD34D", color: "#92400E", padding: "8px 20px", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span>👁️ กำลังดูในมุมมองของ <b>{user.name || user.email}</b> (คุณคือ {realName}) — ทำรายการแทนได้ทุกอย่าง</span>
            <button className="btn-ghost" style={{ padding: "5px 12px" }} onClick={async () => { await fetch("/api/admin/impersonate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: null }) }); location.href = "/pm/dashboard"; }}>ออกจากมุมมองนี้</button>
          </div>
        )}
        {children}
      </main>

      {showProfile && <ProfileModal isAdmin={isAdmin} impersonating={!!impersonating} onClose={() => setShowProfile(false)} />}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "22px 26px", borderBottom: "1px solid #E5E7EB", background: "#fff", gap: 16, flexWrap: "wrap" }}>
      <div><h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: NAVY }}>{title}</h1>{subtitle && <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "#6B7280" }}>{subtitle}</p>}</div>
      {actions && <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>{actions}</div>}
    </header>
  );
}

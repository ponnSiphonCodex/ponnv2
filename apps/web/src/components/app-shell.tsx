"use client";
/**
 * apps/web/src/components/app-shell.tsx
 * Layout หลักของระบบ — Sidebar ซ้าย (Hamburger collapse/expand) + เนื้อหาขวา
 * - กดปุ่ม hamburger → ย่อเหลือเฉพาะไอคอน / ขยายเห็นไอคอน+ชื่อเมนู
 * - จำสถานะ collapse ไว้ใน localStorage
 * - เมนูที่เป็น admin-only จะซ่อนถ้า user ไม่ใช่ admin
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type MenuItem = { key: string; label: string; href: string; icon: ReactNode; adminOnly?: boolean };

const NAVY = "#001D58";
const PINK = "#EC186E";

function Icon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

const MENUS: MenuItem[] = [
  { key: "dashboard", label: "แดชบอร์ด", href: "/pm/dashboard", icon: <Icon d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" /> },
  { key: "board", label: "กระดานงาน (Kanban)", href: "/pm/board?id=1", icon: <Icon d="M4 5h4v14H4zM10 5h4v9h-4zM16 5h4v6h-4z" /> },
  { key: "projects", label: "โครงการ", href: "/pm/projects", icon: <Icon d="M3 7h18M3 12h18M3 17h18" /> },
  { key: "team", label: "ผู้ใช้งาน & สิทธิ์", href: "/pm/team", icon: <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />, adminOnly: true },
  { key: "settings", label: "ตั้งค่าระบบ", href: "/pm/settings", icon: <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />, adminOnly: true },
];

export function AppShell({
  children,
  active,
  user,
  isAdmin,
  roleLabel,
}: {
  children: ReactNode;
  active: string;
  user: { name: string | null; email: string };
  isAdmin: boolean;
  roleLabel: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved === "1") setCollapsed(true);
    setReady(true);
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  }

  const width = collapsed ? 68 : 248;
  const visibleMenus = MENUS.filter((m) => !m.adminOnly || isAdmin);
  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "#F4F4F6" }}>
      {/* Sidebar */}
      <aside
        style={{
          width,
          minWidth: width,
          background: NAVY,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          transition: ready ? "width 0.18s ease, min-width 0.18s ease" : "none",
          position: "sticky",
          top: 0,
          height: "100dvh",
        }}
      >
        {/* Header: hamburger + logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={toggle}
            aria-label="toggle menu"
            style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", padding: 6, borderRadius: 8, display: "flex", flexShrink: 0 }}
          >
            <Icon d="M3 12h18M3 6h18M3 18h18" />
          </button>
          {!collapsed && <span style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap" }}>Portfolio</span>}
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
          {visibleMenus.map((m) => {
            const isActive = active === m.key;
            return (
              <a
                key={m.key}
                href={m.href}
                title={collapsed ? m.label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: collapsed ? "11px 0" : "11px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                  background: isActive ? PINK : "transparent",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  whiteSpace: "nowrap",
                }}
              >
                {m.icon}
                {!collapsed && <span>{m.label}</span>}
              </a>
            );
          })}
        </nav>

        {/* Footer: user + logout */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: collapsed ? 0 : 10 }}>
            <div style={{ width: 34, height: 34, minWidth: 34, borderRadius: "50%", background: PINK, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{initial}</div>
            {!collapsed && (
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name || user.email}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>{roleLabel}</div>
              </div>
            )}
          </div>
          <a
            href="/api/logout"
            title="ออกจากระบบ"
            style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10, padding: collapsed ? "9px 0" : "9px 10px", borderRadius: 8, color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: 13 }}
          >
            <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            {!collapsed && <span>ออกจากระบบ</span>}
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, overflowX: "auto" }}>{children}</main>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "24px 28px", borderBottom: "1px solid #E5E7EB", background: "#fff", gap: 16, flexWrap: "wrap" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: NAVY }}>{title}</h1>
        {subtitle && <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6B7280" }}>{subtitle}</p>}
      </div>
      {actions}
    </header>
  );
}

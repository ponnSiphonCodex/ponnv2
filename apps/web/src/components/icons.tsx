/** icons.tsx — Minimal line icons (stroke, currentColor) ใช้ในเมนู sidebar
 *  ทุกตัว 20x20, stroke 1.6, สืบทอดสีจาก parent (ขาวบนพื้น navy) */
type P = { size?: number };
const base = (size = 20) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.1, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const p = base(size);
  switch (name) {
    case "dashboard": return <svg {...p}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>;
    case "todo": return <svg {...p}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
    case "board": return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/></svg>;
    case "project": return <svg {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>;
    case "gantt": return <svg {...p}><path d="M3 4h9M3 9h13M3 14h7M3 19h11"/></svg>;
    case "sprint": return <svg {...p}><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>;
    case "calendar": return <svg {...p}><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>;
    case "theme": return <svg {...p}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 3v18M4 7.5l8 4.5 8-4.5"/></svg>;
    case "initiative": return <svg {...p}><path d="M4 21V4l14 0-3 3.5L18 11H4"/></svg>;
    case "requirement": return <svg {...p}><path d="M14 3v5h5"/><path d="M6 3h8l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M9 13h6M9 17h4"/></svg>;
    case "product": return <svg {...p}><path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/></svg>;
    case "feature": return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
    case "milestone": return <svg {...p}><path d="M12 2l3 4-3 4-3-4z"/><path d="M12 10v12"/></svg>;
    case "issue": return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>;
    case "risk": return <svg {...p}><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="M12 9v4M12 16h.01"/></svg>;
    case "meeting": return <svg {...p}><circle cx="9" cy="8" r="3"/><path d="M2 21v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1"/><circle cx="18" cy="7" r="2.4"/><path d="M22 21v-1a4 4 0 0 0-3-3.8"/></svg>;
    case "priority": return <svg {...p}><path d="M12 3l3 6 6 .5-4.5 4 1.4 6L12 16.8 6.1 19.5l1.4-6L3 9.5 9 9z"/></svg>;
    case "category": return <svg {...p}><path d="M3 3h8v8H3zM13 3h8v5h-8zM13 12h8v9h-8zM3 14h8v7H3z"/></svg>;
    case "tag": return <svg {...p}><path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="7.5" cy="7.5" r="1.4"/></svg>;
    case "custom": return <svg {...p}><path d="M6 3v6a6 6 0 0 0 12 0V3M6 21v-6a6 6 0 0 1 12 0v6"/><path d="M6 9h12M6 15h12"/></svg>;
    case "users": return <svg {...p}><circle cx="9" cy="8" r="3.2"/><path d="M2.5 21v-1.5A5 5 0 0 1 7.5 15h3A5 5 0 0 1 15.5 20V21"/><circle cx="18" cy="7" r="2.4"/><path d="M21.5 21v-1a4 4 0 0 0-3-3.8"/></svg>;
    case "team": return <svg {...p}><circle cx="12" cy="7" r="3"/><path d="M6 21v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1"/><circle cx="5" cy="10" r="2"/><circle cx="19" cy="10" r="2"/></svg>;
    case "usercog": return <svg {...p}><circle cx="10" cy="8" r="3.2"/><path d="M3 21v-1.5A5 5 0 0 1 8 15h2"/><circle cx="18" cy="16" r="2.6"/><path d="M18 12.6v1M18 18.4v1M21 16h-1M16 16h-1M20.1 13.9l-.7.7M16.6 17.4l-.7.7M20.1 18.1l-.7-.7M16.6 14.6l-.7-.7"/></svg>;
    case "log": return <svg {...p}><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>;
    case "close": return <svg {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case "calendar-view": return <svg {...p}><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/></svg>;
    case "table": return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16M15 4v16"/></svg>;
    case "attach": return <svg {...p}><path d="M21 8.5 12.5 17a4 4 0 0 1-5.7-5.7l8-8a2.6 2.6 0 0 1 3.7 3.7l-8 8a1.2 1.2 0 0 1-1.7-1.7l7.3-7.3"/></svg>;
    case "settings": return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14 2h-4l-.6 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2L10 22h4l.6-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5A7 7 0 0 0 19 12z"/></svg>;
    default: return <svg {...p}><circle cx="12" cy="12" r="9"/></svg>;
  }
}

/** โลโก้จรวด minimal line (ขาว) แทน hamburger */
export function RocketLogo({ size = 28 }: P) {
  const p = base(size);
  return (
    <svg {...p}>
      <path d="M12 2c2.8 2 4.2 5 4.2 8.5 0 2.3-.7 4.3-1.6 6H9.4c-.9-1.7-1.6-3.7-1.6-6C7.8 7 9.2 4 12 2z"/>
      <circle cx="12" cy="9" r="1.8"/>
      <path d="M7.8 13.5L5 16.2c-.4.4-.4 1 0 1.4l1.6 1M16.2 13.5l2.8 2.7c.4.4.4 1 0 1.4l-1.6 1"/>
      <path d="M9.6 19.5c0 1.3.8 2.5 2.4 3 1.6-.5 2.4-1.7 2.4-3"/>
    </svg>
  );
}

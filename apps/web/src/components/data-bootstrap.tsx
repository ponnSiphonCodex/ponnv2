"use client";
import { useEffect } from "react";
const KEY = "pmcache:bootstrap";
const DAY = 86400000;
function put(key: string, data: any, at: number) { try { localStorage.setItem(`pmcache:${key}`, JSON.stringify({ data, at, v: 1 })); } catch {} }
export function DataBootstrap() {
  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(async () => {
      try {
        const old = JSON.parse(localStorage.getItem(KEY) || "null");
        if (old?.at && Date.now() - old.at < DAY) return;
        const r = await fetch("/api/bootstrap", { cache: "no-store" });
        if (!r.ok || cancelled) return;
        const data = await r.json(); const at = Date.now();
        localStorage.setItem(KEY, JSON.stringify({ data, at, v: 1 }));
        if (data.profile) put("profile", data.profile, at);
        for (const [n, options] of Object.entries(data.refs || {})) put(`ref:${n}`, { options }, at);
        for (const [n, payload] of Object.entries(data.master || {})) put(`crud:${n}`, payload, at);
      } catch {}
    }, 250);
    return () => { cancelled = true; window.clearTimeout(id); };
  }, []);
  return null;
}

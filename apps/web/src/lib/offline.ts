"use client";
/**
 * offline.ts — draft autosave (localStorage) + offline write queue
 * - saveDraft/loadDraft/clearDraft: เก็บ text ที่ยังไม่บันทึก กันหลุดตอนเปลี่ยนหน้า
 * - queueRequest + flushQueue: ถ้า fetch ล้ม (offline) เก็บไว้ยิงใหม่ตอนออนไลน์
 */
const DRAFT_PREFIX = "pmdraft:";
const QUEUE_KEY = "pmqueue:v1";

export function saveDraft(key: string, data: unknown) { try { localStorage.setItem(DRAFT_PREFIX + key, JSON.stringify({ data, at: Date.now() })); } catch {} }
export function loadDraft<T = any>(key: string): T | null { try { const s = localStorage.getItem(DRAFT_PREFIX + key); return s ? JSON.parse(s).data as T : null; } catch { return null; } }
export function clearDraft(key: string) { try { localStorage.removeItem(DRAFT_PREFIX + key); } catch {} }

type QueuedReq = { id: string; url: string; method: string; body: string; at: number };
function readQueue(): QueuedReq[] { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; } }
function writeQueue(q: QueuedReq[]) { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch {} }

export async function apiWrite(url: string, method: string, body: unknown): Promise<{ ok: boolean; queued?: boolean; data?: any; error?: string }> {
  const payload = JSON.stringify(body);
  try {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: payload });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };
    return { ok: true, data };
  } catch {
    // offline → queue
    const q = readQueue(); q.push({ id: crypto.randomUUID(), url, method, body: payload, at: Date.now() }); writeQueue(q);
    return { ok: false, queued: true, error: "ออฟไลน์อยู่ — บันทึกไว้แล้ว จะส่งอัตโนมัติเมื่อกลับมาออนไลน์" };
  }
}

export async function flushQueue(): Promise<number> {
  let q = readQueue(); if (!q.length) return 0;
  const remain: QueuedReq[] = []; let sent = 0;
  for (const item of q) {
    try { const res = await fetch(item.url, { method: item.method, headers: { "Content-Type": "application/json" }, body: item.body }); if (res.ok) sent++; else remain.push(item); }
    catch { remain.push(item); }
  }
  writeQueue(remain); return sent;
}

export function initOfflineSync(onFlush?: (n: number) => void) {
  if (typeof window === "undefined") return;
  const run = async () => { const n = await flushQueue(); if (n && onFlush) onFlush(n); };
  window.addEventListener("online", run);
  run();
  return () => window.removeEventListener("online", run);
}
export function queueCount(): number { return readQueue().length; }

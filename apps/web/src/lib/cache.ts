"use client";
/**
 * cache.ts — localStorage cache แบบ stale-while-revalidate + TTL ตามความถี่การเปลี่ยนแปลง
 *  - โชว์ข้อมูลจาก cache "ทันที" (ไม่ต้องรอโหลด)
 *  - เบื้องหลัง: ถ้า cache เก่ากว่า TTL → แอบยิงไป DB อัปเดต แล้วอัปเดต UI (user ไม่รู้)
 *  - ข้อมูลเปลี่ยนบ่อย → TTL สั้น/0 (โหลดทุกครั้ง) · ข้อมูลนิ่ง → TTL ยาว (7/14/30 วัน)
 */
const DAY = 86400_000;
export const TTL = {
  realtime: 0,          // งาน/บอร์ด/issue — โหลดทุกครั้ง (แต่ยังโชว์ cache ระหว่างรอ)
  short: 1 * DAY,        // meetings, todos
  profile: 7 * DAY,      // โปรไฟล์ผู้ใช้ — เปลี่ยนไม่บ่อย
  medium: 14 * DAY,      // projects, products, users list
  long: 30 * DAY,        // master data (priorities/categories/tags)
} as const;

type Entry<T> = { data: T; at: number; v: number };
const VERSION = 1;
const PREFIX = "pmcache:";

export function readCache<T>(key: string): { data: T; at: number } | null {
  try {
    const raw = localStorage.getItem(PREFIX + key); if (!raw) return null;
    const e = JSON.parse(raw) as Entry<T>; if (e.v !== VERSION) return null;
    return { data: e.data, at: e.at };
  } catch { return null; }
}
export function writeCache<T>(key: string, data: T) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify({ data, at: Date.now(), v: VERSION } as Entry<T>)); } catch {}
}
export async function cachedFetch<T>(key: string, url: string, ttlMs: number, onData: (data: T, fromCache: boolean) => void): Promise<void> {
  const cached = readCache<T>(key);
  const fresh = cached && (Date.now() - cached.at) < ttlMs;
  if (cached) onData(cached.data, true);
  if (fresh) return;
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const data = (await res.json()) as T;
    writeCache(key, data);
    onData(data, false);
  } catch { /* offline → ใช้ cache ที่มี */ }
}
export function invalidate(key: string) { try { localStorage.removeItem(PREFIX + key); } catch {} }
export function clearAllCache() { try { Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k)); } catch {} }

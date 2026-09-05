const DEFAULT_URL = "https://script.google.com/macros/s/AKfycbyYcvZGhpwhKUNAd4P60JB4UwAPcxHeJIQ4HhGdJRRgpoO_vRFC-z6AAEsA9GKK76rp/exec";
export function getDriveUploadUrl(): string { return process.env.NEXT_PUBLIC_DRIVE_UPLOAD_URL || DEFAULT_URL; }
export type UploadResult = { ok: boolean; fileId?: string; url?: string; error?: string };
export function fileToBase64(file: File): Promise<string> { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => { const s = r.result as string; const c = s.indexOf(","); res(c >= 0 ? s.slice(c + 1) : s); }; r.onerror = () => rej(r.error); r.readAsDataURL(file); }); }
export async function uploadToGoogleDrive(file: File, url = getDriveUploadUrl()): Promise<UploadResult> {
  try { const base64 = await fileToBase64(file); const res = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ filename: file.name, mimeType: file.type || "application/octet-stream", data: base64 }) }); if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }; const j = (await res.json()) as { fileId?: string; url?: string; error?: string }; if (j.error) return { ok: false, error: j.error }; return { ok: true, fileId: j.fileId, url: j.url }; } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

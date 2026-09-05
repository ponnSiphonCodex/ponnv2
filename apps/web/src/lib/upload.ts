/**
 * apps/web/src/lib/upload.ts
 * อัปโหลดไฟล์ไป Google Drive ผ่าน Apps Script (client, JS ธรรมดา)
 */
const DEFAULT_DRIVE_UPLOAD_URL = "https://script.google.com/macros/s/AKfycbyYcvZGhpwhKUNAd4P60JB4UwAPcxHeJIQ4HhGdJRRgpoO_vRFC-z6AAEsA9GKK76rp/exec";
export function getDriveUploadUrl(): string { return process.env.NEXT_PUBLIC_DRIVE_UPLOAD_URL || DEFAULT_DRIVE_UPLOAD_URL; }
export type UploadResult = { ok: boolean; fileId?: string; url?: string; error?: string };
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => { const result = reader.result as string; const comma = result.indexOf(","); resolve(comma >= 0 ? result.slice(comma + 1) : result); };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
export async function uploadToGoogleDrive(file: File, url = getDriveUploadUrl()): Promise<UploadResult> {
  try {
    const base64 = await fileToBase64(file);
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ filename: file.name, mimeType: file.type || "application/octet-stream", data: base64 }) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const json = (await res.json()) as { fileId?: string; url?: string; error?: string };
    if (json.error) return { ok: false, error: json.error };
    return { ok: true, fileId: json.fileId, url: json.url };
  } catch (err) { return { ok: false, error: err instanceof Error ? err.message : String(err) }; }
}

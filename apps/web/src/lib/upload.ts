/**
 * apps/web/src/lib/upload.ts
 * อัปโหลดไฟล์ไป Google Drive ผ่าน Google Apps Script Web App (client-side, JS ธรรมดา)
 *
 * ขั้นตอน:
 *   1. อ่านไฟล์จาก <input type="file" /> เป็น Base64
 *   2. POST JSON { filename, mimeType, data } ไปที่ Apps Script /exec URL
 *   3. Apps Script บันทึกลง Drive แล้วคืน { fileId, url }
 *
 * ⚠️ ใช้ Content-Type: text/plain โดยเจตนา — เพื่อให้เป็น "simple request" ไม่ trigger CORS
 * preflight (OPTIONS) ที่ Apps Script รองรับได้ไม่ดี Apps Script อ่าน body จาก e.postData.contents
 * ได้ตามปกติแม้ content-type เป็น text/plain
 */

// URL ของ Apps Script Web App (แก้เป็นของคุณได้ หรือ override ผ่าน NEXT_PUBLIC_DRIVE_UPLOAD_URL)
const DEFAULT_DRIVE_UPLOAD_URL =
  "https://script.google.com/macros/s/AKfycbyYcvZGhpwhKUNAd4P60JB4UwAPcxHeJIQ4HhGdJRRgpoO_vRFC-z6AAEsA9GKK76rp/exec";

export function getDriveUploadUrl(): string {
  return process.env.NEXT_PUBLIC_DRIVE_UPLOAD_URL || DEFAULT_DRIVE_UPLOAD_URL;
}

export type UploadResult = {
  ok: boolean;
  fileId?: string;
  url?: string;
  error?: string;
};

/** แปลง File เป็น Base64 (ตัด prefix "data:...;base64," ออก เหลือแค่ตัว base64) */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string; // "data:<mime>;base64,<DATA>"
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** อัปโหลดไฟล์เดียวไป Google Drive ผ่าน Apps Script */
export async function uploadToGoogleDrive(file: File, url = getDriveUploadUrl()): Promise<UploadResult> {
  try {
    const base64 = await fileToBase64(file);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ filename: file.name, mimeType: file.type || "application/octet-stream", data: base64 }),
    });

    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };

    const json = (await res.json()) as { fileId?: string; url?: string; error?: string };
    if (json.error) return { ok: false, error: json.error };
    return { ok: true, fileId: json.fileId, url: json.url };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

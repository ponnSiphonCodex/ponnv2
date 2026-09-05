"use client";
import { useState } from "react";
import { uploadToGoogleDrive, type UploadResult } from "@/lib/upload";
export function FileUpload({ onUploaded }: { onUploaded?: (result: UploadResult) => void }) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [fileName, setFileName] = useState("");
  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setFileName(file.name); setUploading(true); setResult(null);
    const r = await uploadToGoogleDrive(file);
    setUploading(false); setResult(r); onUploaded?.(r);
  }
  return (
    <div style={{ border: "1px dashed #E5E7EB", borderRadius: 10, padding: 16 }}>
      <label style={{ display: "inline-block", background: "#001D58", color: "#fff", padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
        เลือกไฟล์อัปโหลด<input type="file" onChange={handleChange} style={{ display: "none" }} disabled={uploading} />
      </label>
      {fileName && <span style={{ marginLeft: 12, fontSize: 13, color: "#6B7280" }}>{fileName}</span>}
      {uploading && <p style={{ fontSize: 13, color: "#6B7280", marginTop: 12 }}>กำลังอัปโหลดไป Google Drive...</p>}
      {result?.ok && <p style={{ fontSize: 13, color: "#059669", marginTop: 12 }}>✅ อัปโหลดสำเร็จ{result.url && <> · <a href={result.url} target="_blank" rel="noopener noreferrer" style={{ color: "#001D58" }}>เปิดไฟล์</a></>}</p>}
      {result && !result.ok && <p style={{ fontSize: 13, color: "#B91C1C", marginTop: 12 }}>❌ อัปโหลดไม่สำเร็จ: {result.error}</p>}
    </div>
  );
}

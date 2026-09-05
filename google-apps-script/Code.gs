/**
 * Code.gs — Google Apps Script Web App สำหรับรับไฟล์ Base64 แล้วบันทึกลง Google Drive
 *
 * วิธีใช้:
 * 1. เปิด https://script.google.com → เปิดโปรเจกต์ที่ deploy ไว้ (หรือสร้างใหม่)
 * 2. วางโค้ดนี้ทั้งหมดใน Code.gs (แทนของเดิม)
 * 3. แก้ FOLDER_ID ให้เป็นโฟลเดอร์ Drive ที่ต้องการเก็บไฟล์ (หรือปล่อยว่างเพื่อเก็บใน root)
 * 4. Deploy → New deployment → type: Web app
 *      - Execute as: Me
 *      - Who has access: Anyone   ← สำคัญ! ต้องเป็น Anyone ไม่งั้น fetch จากเว็บจะโดนบล็อก
 * 5. คัดลอก Web app URL (.../exec) ไปใส่ใน apps/web/src/lib/upload.ts (DEFAULT_DRIVE_UPLOAD_URL)
 *    หรือตั้ง env NEXT_PUBLIC_DRIVE_UPLOAD_URL
 *
 * รับ JSON body: { filename, mimeType, data (base64) }
 * คืน JSON: { fileId, url } หรือ { error }
 */

// ใส่ Drive Folder ID ที่ต้องการเก็บไฟล์ (เว้นว่าง "" = เก็บใน My Drive root)
var FOLDER_ID = "";

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var filename = body.filename || ("upload_" + new Date().getTime());
    var mimeType = body.mimeType || "application/octet-stream";
    var base64 = body.data;

    if (!base64) {
      return jsonOutput({ error: "no data" });
    }

    var bytes = Utilities.base64Decode(base64);
    var blob = Utilities.newBlob(bytes, mimeType, filename);

    var file;
    if (FOLDER_ID) {
      file = DriveApp.getFolderById(FOLDER_ID).createFile(blob);
    } else {
      file = DriveApp.createFile(blob);
    }

    // ตั้งสิทธิ์ให้เปิดดูได้ด้วยลิงก์ (ปรับได้ตามต้องการ)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return jsonOutput({ fileId: file.getId(), url: file.getUrl() });
  } catch (err) {
    return jsonOutput({ error: String(err) });
  }
}

// เผื่อเปิด URL ตรง ๆ (GET) เพื่อเทสว่า deploy ติดไหม
function doGet() {
  return jsonOutput({ status: "ok", message: "Drive upload endpoint is running" });
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

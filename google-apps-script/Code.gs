/** Code.gs — Apps Script รับไฟล์ Base64 บันทึกลง Drive. Deploy: Web app, Execute as Me, Access: Anyone */
var FOLDER_ID = "";
function doPost(e) {
  try {
    var b = JSON.parse(e.postData.contents);
    if (!b.data) return out({ error: "no data" });
    var blob = Utilities.newBlob(Utilities.base64Decode(b.data), b.mimeType || "application/octet-stream", b.filename || ("upload_" + Date.now()));
    var f = FOLDER_ID ? DriveApp.getFolderById(FOLDER_ID).createFile(blob) : DriveApp.createFile(blob);
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return out({ fileId: f.getId(), url: f.getUrl() });
  } catch (err) { return out({ error: String(err) }); }
}
function doGet() { return out({ status: "ok" }); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

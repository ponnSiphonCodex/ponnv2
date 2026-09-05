/**
 * Code.gs — Google Apps Script Web App รับไฟล์ Base64 บันทึกลง Drive
 * Deploy: New deployment → Web app → Execute as: Me, Who has access: Anyone
 */
var FOLDER_ID = "";
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var filename = body.filename || ("upload_" + new Date().getTime());
    var mimeType = body.mimeType || "application/octet-stream";
    if (!body.data) return jsonOutput({ error: "no data" });
    var blob = Utilities.newBlob(Utilities.base64Decode(body.data), mimeType, filename);
    var file = FOLDER_ID ? DriveApp.getFolderById(FOLDER_ID).createFile(blob) : DriveApp.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return jsonOutput({ fileId: file.getId(), url: file.getUrl() });
  } catch (err) { return jsonOutput({ error: String(err) }); }
}
function doGet() { return jsonOutput({ status: "ok", message: "Drive upload endpoint running" }); }
function jsonOutput(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

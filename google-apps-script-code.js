/**
 * =====================================================================
 * ASTRA HACKATHON 2026 - ORGANIZER REMOTE LOCK/UNLOCK SCRIPT
 * =====================================================================
 * 
 * HOW TO SET THIS UP IN 2 MINUTES (100% FREE):
 * 
 * 1. Open Google Sheets (https://sheets.new)
 * 2. In Cell A1, type: LOCKED  (or UNLOCKED when ready to start!)
 * 3. In the top menu, click: Extensions -> Apps Script
 * 4. Delete any code in the editor and paste THIS ENTIRE FILE.
 * 5. Click "Deploy" (top right button) -> "New deployment"
 * 6. Select type: "Web app"
 * 7. Set:
 *    - Description: ASTRA Lock Controller
 *    - Execute as: Me
 *    - Who has access: Anyone (Important: so participants' browsers can read it)
 * 8. Click "Deploy", copy the "Web app URL" (it looks like: https://script.google.com/macros/s/.../exec)
 * 9. Paste that URL into the ASTRA website config!
 * 
 * When you change Cell A1 from LOCKED to UNLOCKED, all 900 students' screens
 * will unlock simultaneously!
 */

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var status = sheet.getRange("A1").getValue();
    
    // Normalize status string
    var statusText = status ? status.toString().trim().toUpperCase() : "LOCKED";
    var isUnlocked = (statusText === "UNLOCKED" || statusText === "START" || statusText === "GO");
    
    var output = {
      success: true,
      unlocked: isUnlocked,
      status: statusText,
      timestamp: new Date().getTime(),
      event: "ASTRA Hackathon 2026"
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    // Default safe fallback
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        unlocked: false,
        error: err.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

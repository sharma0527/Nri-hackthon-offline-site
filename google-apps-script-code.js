/**
 * ====================================================================================
 * ASTRA HACKATHON 2026 - ORGANIZER REMOTE LOCK/UNLOCK SCRIPT (VERSION 2 - FIXED)
 * Includes: Google Apps Script Native Runner + Standalone API Support
 * ====================================================================================
 * 
 * INSTRUCTIONS:
 * 1. Open your Apps Script editor: https://script.google.com
 * 2. Replace all code in Code.gs with THIS ENTIRE FILE.
 * 3. Click "Save" (disk icon).
 * 4. Click "Deploy" (top right) -> "Manage deployments".
 * 5. Click the Edit pencil icon on Version 1.
 * 6. Under Version, select "New version".
 * 7. Ensure "Who has access" is set to "Anyone".
 * 8. Click "Deploy".
 */

// Server-side function called by the Admin HTML Page
function setStatus(action) {
  var props = PropertiesService.getScriptProperties();
  if (action === "lock") {
    props.setProperty("ASTRA_STATUS", "LOCKED");
    props.setProperty("LAST_UPDATED", new Date().toISOString());
  } else if (action === "unlock") {
    props.setProperty("ASTRA_STATUS", "UNLOCKED");
    props.setProperty("LAST_UPDATED", new Date().toISOString());
  }
  
  var currentStatus = props.getProperty("ASTRA_STATUS") || "LOCKED";
  return {
    unlocked: (currentStatus === "UNLOCKED"),
    status: currentStatus
  };
}

function getStatus() {
  var props = PropertiesService.getScriptProperties();
  var currentStatus = props.getProperty("ASTRA_STATUS") || "LOCKED";
  return {
    unlocked: (currentStatus === "UNLOCKED"),
    status: currentStatus
  };
}

function doGet(e) {
  var props = PropertiesService.getScriptProperties();
  var action = e && e.parameter ? e.parameter.action : null;
  var format = e && e.parameter ? e.parameter.format : null;
  var callback = e && e.parameter ? e.parameter.callback : null;

  // Set action if passed via query parameter
  if (action === "lock") {
    props.setProperty("ASTRA_STATUS", "LOCKED");
    props.setProperty("LAST_UPDATED", new Date().toISOString());
  } else if (action === "unlock") {
    props.setProperty("ASTRA_STATUS", "UNLOCKED");
    props.setProperty("LAST_UPDATED", new Date().toISOString());
  }

  var currentStatus = props.getProperty("ASTRA_STATUS") || "LOCKED";
  var isUnlocked = (currentStatus === "UNLOCKED");

  // If called as API / JSON / JSONP
  if (format === "json" || (e && e.parameter && e.parameter.api === "true") || callback) {
    var responseData = {
      success: true,
      unlocked: isUnlocked,
      status: currentStatus,
      timestamp: new Date().getTime()
    };
    
    var outputText = JSON.stringify(responseData);
    if (callback) {
      outputText = callback + "(" + outputText + ");";
      return ContentService.createTextOutput(outputText).setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService.createTextOutput(outputText).setMimeType(ContentService.MimeType.JSON);
  }

  // Admin Dashboard HTML
  var html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASTRA 2026 — Organizer Admin Controller</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body {
      background: #030712;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .panel {
      width: 100%;
      max-width: 480px;
      background: #0f172a;
      border: 1px solid rgba(34, 211, 238, 0.3);
      border-radius: 24px;
      padding: 2.2rem;
      box-shadow: 0 0 50px rgba(6, 182, 212, 0.25);
      text-align: center;
    }
    h1 {
      font-size: 1.8rem;
      letter-spacing: 0.15em;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #fff 0%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .sub {
      color: #94a3b8;
      font-size: 0.85rem;
      margin-bottom: 2rem;
      letter-spacing: 0.1em;
    }
    .status-display {
      padding: 1.5rem;
      border-radius: 16px;
      margin-bottom: 2rem;
      border: 2px solid transparent;
      transition: all 0.3s ease;
    }
    .status-locked {
      background: rgba(239, 68, 68, 0.15);
      border-color: #ef4444;
      color: #fca5a5;
    }
    .status-unlocked {
      background: rgba(16, 185, 129, 0.15);
      border-color: #10b981;
      color: #6ee7b7;
    }
    .status-title {
      font-size: 0.8rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 0.4rem;
      opacity: 0.85;
    }
    .status-val {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: 0.1em;
    }
    .btn-group {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .btn {
      padding: 1.2rem;
      border-radius: 14px;
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }
    .btn:active {
      transform: scale(0.97);
    }
    .btn-lock {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: #fff;
      box-shadow: 0 4px 20px rgba(220, 38, 38, 0.4);
    }
    .btn-lock:hover {
      background: #ef4444;
    }
    .btn-unlock {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: #fff;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
    }
    .btn-unlock:hover {
      background: #10b981;
    }
    .instruction {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 1rem;
      font-size: 0.75rem;
      color: #94a3b8;
      line-height: 1.6;
      text-align: left;
    }
  </style>
</head>
<body>
  <div class="panel">
    <h1>ASTRA CONTROLLER</h1>
    <p class="sub">ORGANIZER REMOTE SWITCH</p>

    <div id="statusBox" class="status-display ${isUnlocked ? 'status-unlocked' : 'status-locked'}">
      <div class="status-title">CURRENT WEBSITE STATUS</div>
      <div id="statusText" class="status-val">${isUnlocked ? '🟢 UNLOCKED' : '🔴 LOCKED'}</div>
    </div>

    <div class="btn-group">
      <button class="btn btn-unlock" onclick="triggerAction('unlock')">
        <span>🟢 UNLOCK FOR 900 USERS</span>
      </button>
      <button class="btn btn-lock" onclick="triggerAction('lock')">
        <span>🔒 LOCK START BUTTON</span>
      </button>
    </div>

    <div class="instruction">
      <p><b>⚡ Instructions:</b></p>
      <p>• Tap <b>UNLOCK</b>: All 900 devices unlock immediately.</p>
      <p>• Tap <b>LOCK</b>: The start button is blocked for all students.</p>
      <p>• Offline Passcode: <b>0527</b> (Tap ASTRA 5 times or press 'U').</p>
    </div>
  </div>

  <script>
    function updateUI(res) {
      const box = document.getElementById('statusBox');
      const txt = document.getElementById('statusText');
      if (res && res.unlocked) {
        box.className = 'status-display status-unlocked';
        txt.textContent = '🟢 UNLOCKED';
      } else {
        box.className = 'status-display status-locked';
        txt.textContent = '🔴 LOCKED';
      }
    }

    function triggerAction(action) {
      document.getElementById('statusText').textContent = 'UPDATING...';
      
      // Use native Google Apps Script runner (prevents JSON syntax errors!)
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(updateUI)
          .withFailureHandler(function(err) {
            alert('Error: ' + err);
            location.reload();
          })
          .setStatus(action);
      } else {
        // Fallback for standalone preview
        window.location.search = '?action=' + action;
      }
    }
  </script>
</body>
</html>
  `;

  return HtmlService.createHtmlOutput(html)
    .setTitle("ASTRA 2026 — Organizer Lock Controller")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

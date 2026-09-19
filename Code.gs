/*******************************************************
 * =====================================================
 * ASTRA HACKATHON 2026
 * ORGANIZER MASTER CONTROLLER
 * =====================================================
 *
 * FILE:
 *   Code.gs
 *
 * HTML FILE:
 *   app.html
 *
 * PURPOSE:
 *   Central organizer controller for the ASTRA
 *   cinematic experience.
 *
 * FEATURES:
 *
 *   ORGANIZER
 *   ----------
 *   • START FULLSCREEN
 *   • STOP ALL
 *   • LOCK ALL
 *   • UNLOCK ALL
 *   • SYNC ALL
 *   • RESET SYSTEM
 *
 *   SESSION
 *   -------
 *   • Central state
 *   • Command ID
 *   • Version number
 *   • Server timestamp
 *   • Start timestamp
 *   • Session ID
 *
 *   PARTICIPANTS
 *   ------------
 *   • Public state read endpoint
 *   • JSON response
 *   • JSONP response
 *   • No organizer token required
 *
 *   SECURITY
 *   --------
 *   • Organizer commands require ADMIN_TOKEN
 *   • Participant clients can ONLY read state
 *   • No public command URL
 *
 * STATES:
 *
 *   LOCKED
 *   UNLOCKED
 *   PLAYING
 *   STOPPED
 *
 *******************************************************/

/* =====================================================
   CONFIGURATION
   ===================================================== */
const CONFIG = {
  /*
   * IMPORTANT:
   * Keep this private.
   * Do NOT put this token inside your participant React/Vite website.
   */
  ADMIN_TOKEN: 'ASTRA-2026-ORGANIZER-PRIVATE-KEY-938472',

  /*
   * Event session identifier.
   */
  SESSION_ID: 'ASTRA-2026',

  /*
   * Participant polling interval.
   * 800 ms means approximately 1 request every 0.8 seconds per participant.
   */
  POLL_MS: 800,

  /*
   * Asset information sent to participants.
   * These are LOCAL website paths.
   * Apps Script does NOT host the media.
   */
  VIDEO_ASSET: '/assets/video/astra-hero.mp4',
  AUDIO_ASSET: '/assets/audio/astra-theme.mp3'
};

/* =====================================================
   WEB APP ENTRY POINT
   ===================================================== */
function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};

  /* ---------------------------------------------------
     ORGANIZER DASHBOARD
     --------------------------------------------------- */
  if (params.page === 'admin') {
    return HtmlService
      .createHtmlOutputFromFile('app')
      .setTitle('ASTRA Organizer Control')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  /* ---------------------------------------------------
     PUBLIC PARTICIPANT STATE
     ---------------------------------------------------
     Normal:
       ?api=state
     JSONP:
       ?api=state&callback=astraCallback
  */
  if (params.api === 'state' || params.format === 'json') {
    const state = getState_();

    /*
     * JSONP support.
     * Useful when the participant Vite website
     * is hosted on another origin and normal fetch()
     * encounters cross-origin restrictions.
     */
    if (params.callback) {
      return jsonpResponse_(params.callback, state);
    }

    /*
     * Normal JSON response.
     */
    return jsonResponse_(state);
  }

  /* ---------------------------------------------------
     DEFAULT
     --------------------------------------------------- */
  return jsonResponse_({
    success: true,
    service: 'ASTRA Organizer Controller',
    sessionId: CONFIG.SESSION_ID,
    state: getState_().state,
    version: getState_().version,
    serverTime: Date.now()
  });
}

/* =====================================================
   GET CURRENT STATE
   ===================================================== */
function getState_() {
  const props = PropertiesService.getScriptProperties();

  const state = props.getProperty('ASTRA_STATE') || 'LOCKED';
  const commandId = props.getProperty('ASTRA_COMMAND_ID') || '0';
  const startTime = Number(props.getProperty('ASTRA_START_TIME') || '0');
  const version = Number(props.getProperty('ASTRA_VERSION') || '0');
  const updatedAt = Number(props.getProperty('ASTRA_UPDATED_AT') || '0');
  const serverTime = Date.now();

  return {
    success: true,
    sessionId: CONFIG.SESSION_ID,
    state: state,
    unlocked: (state !== 'LOCKED'),
    commandId: commandId,
    startTime: startTime,
    version: version,
    updatedAt: updatedAt,
    serverTime: serverTime,
    pollMs: CONFIG.POLL_MS,
    videoAsset: CONFIG.VIDEO_ASSET,
    audioAsset: CONFIG.AUDIO_ASSET
  };
}

/* =====================================================
   START COMMAND
   ===================================================== */
function startCommand_(token) {
  verifyToken_(token);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const props = PropertiesService.getScriptProperties();
    const now = Date.now();
    const commandId = createCommandId_();
    const currentVersion = Number(props.getProperty('ASTRA_VERSION') || '0');
    const newVersion = currentVersion + 1;

    /*
     * START TIMESTAMP
     * Every participant uses this same timestamp
     * to calculate where playback should be.
     */
    props.setProperties({
      ASTRA_STATE: 'PLAYING',
      ASTRA_COMMAND_ID: commandId,
      ASTRA_START_TIME: String(now),
      ASTRA_VERSION: String(newVersion),
      ASTRA_UPDATED_AT: String(now)
    });

    return {
      success: true,
      command: 'ASTRA_START',
      state: 'PLAYING',
      unlocked: true,
      commandId: commandId,
      startTime: now,
      version: newVersion,
      serverTime: Date.now(),
      videoAsset: CONFIG.VIDEO_ASSET,
      audioAsset: CONFIG.AUDIO_ASSET
    };
  } finally {
    lock.releaseLock();
  }
}

/* =====================================================
   STOP COMMAND
   ===================================================== */
function stopCommand_(token) {
  verifyToken_(token);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const props = PropertiesService.getScriptProperties();
    const now = Date.now();
    const commandId = createCommandId_();
    const currentVersion = Number(props.getProperty('ASTRA_VERSION') || '0');
    const newVersion = currentVersion + 1;

    props.setProperties({
      ASTRA_STATE: 'STOPPED',
      ASTRA_COMMAND_ID: commandId,
      ASTRA_START_TIME: '0',
      ASTRA_VERSION: String(newVersion),
      ASTRA_UPDATED_AT: String(now)
    });

    return {
      success: true,
      command: 'ASTRA_STOP',
      state: 'STOPPED',
      unlocked: false,
      commandId: commandId,
      startTime: 0,
      version: newVersion,
      serverTime: Date.now()
    };
  } finally {
    lock.releaseLock();
  }
}

/* =====================================================
   LOCK COMMAND
   ===================================================== */
function lockCommand_(token) {
  verifyToken_(token);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const props = PropertiesService.getScriptProperties();
    const now = Date.now();
    const commandId = createCommandId_();
    const currentVersion = Number(props.getProperty('ASTRA_VERSION') || '0');
    const newVersion = currentVersion + 1;

    props.setProperties({
      ASTRA_STATE: 'LOCKED',
      ASTRA_COMMAND_ID: commandId,
      ASTRA_VERSION: String(newVersion),
      ASTRA_UPDATED_AT: String(now)
    });

    return {
      success: true,
      command: 'ASTRA_LOCK',
      state: 'LOCKED',
      unlocked: false,
      commandId: commandId,
      version: newVersion,
      serverTime: Date.now()
    };
  } finally {
    lock.releaseLock();
  }
}

/* =====================================================
   UNLOCK COMMAND
   ===================================================== */
function unlockCommand_(token) {
  verifyToken_(token);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const props = PropertiesService.getScriptProperties();
    const now = Date.now();
    const commandId = createCommandId_();
    const currentVersion = Number(props.getProperty('ASTRA_VERSION') || '0');
    const newVersion = currentVersion + 1;

    props.setProperties({
      ASTRA_STATE: 'UNLOCKED',
      ASTRA_COMMAND_ID: commandId,
      ASTRA_VERSION: String(newVersion),
      ASTRA_UPDATED_AT: String(now)
    });

    return {
      success: true,
      command: 'ASTRA_UNLOCK',
      state: 'UNLOCKED',
      unlocked: true,
      commandId: commandId,
      version: newVersion,
      serverTime: Date.now()
    };
  } finally {
    lock.releaseLock();
  }
}

/* =====================================================
   SYNC COMMAND
   ===================================================== */
function syncCommand_(token) {
  verifyToken_(token);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const props = PropertiesService.getScriptProperties();
    const state = props.getProperty('ASTRA_STATE') || 'LOCKED';
    const startTime = Number(props.getProperty('ASTRA_START_TIME') || '0');
    const now = Date.now();
    const commandId = createCommandId_();
    const currentVersion = Number(props.getProperty('ASTRA_VERSION') || '0');
    const newVersion = currentVersion + 1;

    props.setProperties({
      ASTRA_COMMAND_ID: commandId,
      ASTRA_VERSION: String(newVersion),
      ASTRA_UPDATED_AT: String(now)
    });

    return {
      success: true,
      command: 'ASTRA_SYNC',
      state: state,
      startTime: startTime,
      commandId: commandId,
      version: newVersion,
      serverTime: now,
      videoAsset: CONFIG.VIDEO_ASSET,
      audioAsset: CONFIG.AUDIO_ASSET
    };
  } finally {
    lock.releaseLock();
  }
}

/* =====================================================
   ADMIN COMMAND ROUTER
   ===================================================== */
function runAdminCommand(command, token) {
  verifyToken_(token);

  const normalizedCommand = String(command || '').trim().toLowerCase();

  switch (normalizedCommand) {
    case 'start':
      return startCommand_(token);
    case 'stop':
      return stopCommand_(token);
    case 'lock':
      return lockCommand_(token);
    case 'unlock':
      return unlockCommand_(token);
    case 'sync':
      return syncCommand_(token);
    default:
      throw new Error('Unknown organizer command: ' + command);
  }
}

/* =====================================================
   ADMIN STATE
   ===================================================== */
function getAdminState() {
  return getState_();
}

/* =====================================================
   ADMIN RESET
   ===================================================== */
function adminReset(token) {
  verifyToken_(token);
  emergencyReset_();
  return getState_();
}

/* =====================================================
   INITIALIZE ASTRA
   ===================================================== */
function initializeASTRA() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    PropertiesService
      .getScriptProperties()
      .setProperties({
        ASTRA_STATE: 'LOCKED',
        ASTRA_COMMAND_ID: '0',
        ASTRA_START_TIME: '0',
        ASTRA_VERSION: '0',
        ASTRA_UPDATED_AT: String(Date.now())
      });

    console.log('ASTRA initialized successfully.');
    return getState_();
  } finally {
    lock.releaseLock();
  }
}

/* =====================================================
   EMERGENCY RESET
   ===================================================== */
function emergencyReset_() {
  const props = PropertiesService.getScriptProperties();
  const now = Date.now();

  props.setProperties({
    ASTRA_STATE: 'LOCKED',
    ASTRA_COMMAND_ID: createCommandId_(),
    ASTRA_START_TIME: '0',
    ASTRA_VERSION: '0',
    ASTRA_UPDATED_AT: String(now)
  });
}

/* =====================================================
   TOKEN VERIFICATION
   ===================================================== */
function verifyToken_(token) {
  if (!token) {
    throw new Error('Organizer authorization required.');
  }

  if (String(token).trim() !== String(CONFIG.ADMIN_TOKEN).trim()) {
    throw new Error('Unauthorized organizer request.');
  }
}

/* =====================================================
   COMMAND ID
   ===================================================== */
function createCommandId_() {
  return Date.now() + '-' + Utilities.getUuid();
}

/* =====================================================
   JSON RESPONSE
   ===================================================== */
function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/* =====================================================
   JSONP RESPONSE
   ===================================================== */
function jsonpResponse_(callback, data) {
  const safeCallback = String(callback).replace(/[^a-zA-Z0-9_$\.]/g, '');

  if (!safeCallback) {
    return jsonResponse_({
      success: false,
      error: 'Invalid callback.'
    });
  }

  const payload = safeCallback + '(' + JSON.stringify(data) + ');';

  return ContentService
    .createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

/* =====================================================
   OPTIONAL TEST FUNCTION
   ===================================================== */
function testState() {
  const state = getState_();
  console.log(JSON.stringify(state, null, 2));
  return state;
}

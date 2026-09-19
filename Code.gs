/*******************************************************
 * =====================================================
 * ASTRA HACKATHON 2026
 * ORGANIZER MASTER CONTROLLER
 * =====================================================
 *
 * FILE:
 *   Code.gs
 *
 * SECOND FILE:
 *   app.html
 *
 * FEATURES:
 *   • Private organizer panel
 *   • START FULLSCREEN
 *   • LOCK ALL
 *   • UNLOCK ALL
 *   • STOP ALL
 *   • SYNC ALL
 *   • Central session state
 *   • Command ID
 *   • Version number
 *   • Server timestamp
 *   • Organizer authorization
 *   • Participant polling with JSON and JSONP support
 *
 * STATES:
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
   Private organizer key for authorizing admin actions.
  */
  ADMIN_TOKEN: 'ASTRA-2026-ORGANIZER-PRIVATE-KEY-938472',

  /*
   Event/session identifier.
  */
  SESSION_ID: 'ASTRA-2026',

  /*
   Participant polling interval.
   800 ms = near-real-time.
  */
  POLL_MS: 800,

  VIDEO: '/assets/video/astra-hero.mp4',
  AUDIO: '/assets/audio/astra-theme.mp3'
};

/* =====================================================
   WEB APP ENTRY POINT
   ===================================================== */
function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};

  /*
   * Organizer panel:
   * /exec?page=admin
   */
  if (params.page === 'admin') {
    return HtmlService
      .createHtmlOutputFromFile('app')
      .setTitle('ASTRA Organizer Control')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  /*
   * API:
   * /exec?api=state (Supports JSON and JSONP with ?callback=...)
   */
  if (params.api === 'state' || params.format === 'json') {
    const state = getState_();
    if (params.callback) {
      const callback = String(params.callback).replace(/[^a-zA-Z0-9_$\.]/g, '');
      return ContentService
        .createTextOutput(callback + '(' + JSON.stringify(state) + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return jsonResponse_(state);
  }

  /*
   * API:
   * /exec?api=start&token=...
   */
  if (params.api === 'start') {
    return jsonResponse_(startCommand_(params.token));
  }

  /*
   * API:
   * /exec?api=stop&token=...
   */
  if (params.api === 'stop') {
    return jsonResponse_(stopCommand_(params.token));
  }

  /*
   * API:
   * /exec?api=lock&token=...
   */
  if (params.api === 'lock') {
    return jsonResponse_(lockCommand_(params.token));
  }

  /*
   * API:
   * /exec?api=unlock&token=...
   */
  if (params.api === 'unlock') {
    return jsonResponse_(unlockCommand_(params.token));
  }

  /*
   * API:
   * /exec?api=sync&token=...
   */
  if (params.api === 'sync') {
    return jsonResponse_(syncCommand_(params.token));
  }

  /*
   * Default response: Serve app or current state JSON
   */
  if (params.page === 'app') {
    return HtmlService
      .createHtmlOutputFromFile('app')
      .setTitle('ASTRA Hackathon 2026')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return jsonResponse_({
    success: true,
    service: 'ASTRA Controller',
    sessionId: CONFIG.SESSION_ID,
    state: getState_().state,
    version: getState_().version
  });
}

/* =====================================================
   GET CURRENT SESSION STATE
   ===================================================== */
function getState_() {
  const props = PropertiesService.getScriptProperties();

  const state = props.getProperty('ASTRA_STATE') || 'LOCKED';
  const commandId = props.getProperty('ASTRA_COMMAND_ID') || '0';
  const startTime = Number(props.getProperty('ASTRA_START_TIME') || '0');
  const version = Number(props.getProperty('ASTRA_VERSION') || '0');
  const updatedAt = Number(props.getProperty('ASTRA_UPDATED_AT') || '0');

  return {
    success: true,
    sessionId: CONFIG.SESSION_ID,
    state: state,
    unlocked: (state !== 'LOCKED'),
    commandId: commandId,
    startTime: startTime,
    version: version,
    updatedAt: updatedAt,
    serverTime: Date.now(),
    pollMs: CONFIG.POLL_MS,
    video: CONFIG.VIDEO,
    audio: CONFIG.AUDIO
  };
}

/* =====================================================
   ORGANIZER START
   ===================================================== */
function startCommand_(token) {
  verifyToken_(token);

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const props = PropertiesService.getScriptProperties();
    const now = Date.now();
    const commandId = createCommandId_();
    const currentVersion = Number(props.getProperty('ASTRA_VERSION') || '0');
    const newVersion = currentVersion + 1;

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
      video: CONFIG.VIDEO,
      audio: CONFIG.AUDIO
    };
  } finally {
    lock.releaseLock();
  }
}

/* =====================================================
   ORGANIZER STOP
   ===================================================== */
function stopCommand_(token) {
  verifyToken_(token);

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

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
   ORGANIZER LOCK
   ===================================================== */
function lockCommand_(token) {
  verifyToken_(token);

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

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
   ORGANIZER UNLOCK
   ===================================================== */
function unlockCommand_(token) {
  verifyToken_(token);

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

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
   ORGANIZER SYNC
   ===================================================== */
function syncCommand_(token) {
  verifyToken_(token);

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
    unlocked: (state !== 'LOCKED'),
    startTime: startTime,
    commandId: commandId,
    version: newVersion,
    serverTime: now
  };
}

/* =====================================================
   ADMIN COMMAND ROUTER (For google.script.run)
   ===================================================== */
function runAdminCommand(command, token) {
  verifyToken_(token);

  switch (String(command).toLowerCase()) {
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

function getAdminState() {
  return getState_();
}

function adminReset(token) {
  verifyToken_(token);
  emergencyReset_();
  return getState_();
}

/* =====================================================
   TOKEN VERIFICATION
   ===================================================== */
function verifyToken_(token) {
  if (!token) {
    throw new Error('Organizer authorization required.');
  }

  if (String(token).trim() !== String(CONFIG.ADMIN_TOKEN).trim()) {
    throw new Error('Unauthorized organizer request. Invalid key.');
  }
}

function createCommandId_() {
  return Date.now() + '-' + Utilities.getUuid().substring(0, 8);
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/* =====================================================
   INITIALIZE ASTRA (RUN ONCE MANUALLY)
   ===================================================== */
function initializeASTRA() {
  PropertiesService
    .getScriptProperties()
    .setProperties({
      ASTRA_STATE: 'LOCKED',
      ASTRA_COMMAND_ID: '0',
      ASTRA_START_TIME: '0',
      ASTRA_VERSION: '0',
      ASTRA_UPDATED_AT: String(Date.now())
    });
}

function emergencyReset_() {
  PropertiesService
    .getScriptProperties()
    .setProperties({
      ASTRA_STATE: 'LOCKED',
      ASTRA_COMMAND_ID: createCommandId_(),
      ASTRA_START_TIME: '0',
      ASTRA_VERSION: '0',
      ASTRA_UPDATED_AT: String(Date.now())
    });
}

/*******************************************************
 * ASTRA HACKATHON 2026
 * ORGANIZER MASTER CONTROLLER
 *
 * STATES:
 * LOCKED
 * UNLOCKED
 * PLAYING
 * STOPPED
 *******************************************************/

const CONFIG = {

  // PRIVATE — ORGANIZER ONLY
  ADMIN_TOKEN:
    'ASTRA-2026-ORGANIZER-PRIVATE-KEY-938472',

  // Event session
  SESSION_ID:
    'ASTRA-2026',

  // Participant polling
  POLL_MS:
    800,

  // These are participant website LOCAL assets
  VIDEO_ASSET:
    '/assets/video/astra-hero.mp4',

  AUDIO_ASSET:
    '/assets/audio/astra-theme.mp3'
};


/* =====================================================
   WEB APP
   ===================================================== */

function doGet(e) {

  const params =
    e && e.parameter
      ? e.parameter
      : {};

  /* ---------------------------------------------------
     ORGANIZER DASHBOARD
     --------------------------------------------------- */

  if (params.page === 'admin') {

    return HtmlService
      .createHtmlOutputFromFile('app')
      .setTitle('ASTRA Organizer Control')
      .setXFrameOptionsMode(
        HtmlService.XFrameOptionsMode.ALLOWALL
      );
  }


  /* ---------------------------------------------------
     PUBLIC PARTICIPANT STATE
     --------------------------------------------------- */

  if (params.api === 'state') {

    const state =
      getState_();

    // JSONP for external Vite/React website
    if (params.callback) {

      return jsonpResponse_(
        params.callback,
        state
      );
    }

    return jsonResponse_(
      state
    );
  }


  /* ---------------------------------------------------
     DEFAULT
     --------------------------------------------------- */

  return jsonResponse_({

    success: true,

    service:
      'ASTRA Organizer Controller',

    sessionId:
      CONFIG.SESSION_ID,

    state:
      getState_().state,

    serverTime:
      Date.now()

  });
}


/* =====================================================
   GET STATE
   ===================================================== */

function getState_() {

  const props =
    PropertiesService
      .getScriptProperties();

  const state =
    props.getProperty('ASTRA_STATE') ||
    'LOCKED';

  const commandId =
    props.getProperty('ASTRA_COMMAND_ID') ||
    '0';

  const startTime =
    Number(
      props.getProperty('ASTRA_START_TIME') ||
      '0'
    );

  const version =
    Number(
      props.getProperty('ASTRA_VERSION') ||
      '0'
    );

  const updatedAt =
    Number(
      props.getProperty('ASTRA_UPDATED_AT') ||
      '0'
    );

  return {

    success:
      true,

    sessionId:
      CONFIG.SESSION_ID,

    state:
      state,

    commandId:
      commandId,

    startTime:
      startTime,

    version:
      version,

    updatedAt:
      updatedAt,

    serverTime:
      Date.now(),

    pollMs:
      CONFIG.POLL_MS,

    videoAsset:
      CONFIG.VIDEO_ASSET,

    audioAsset:
      CONFIG.AUDIO_ASSET,

    unlocked:
      state !== 'LOCKED'
  };
}


/* =====================================================
   START
   ===================================================== */

function startCommand_(token) {

  verifyToken_(token);

  const lock =
    LockService.getScriptLock();

  lock.waitLock(10000);

  try {

    const props =
      PropertiesService
        .getScriptProperties();

    const now =
      Date.now();

    const commandId =
      createCommandId_();

    const version =
      Number(
        props.getProperty('ASTRA_VERSION') ||
        '0'
      ) + 1;

    props.setProperties({

      ASTRA_STATE:
        'PLAYING',

      ASTRA_COMMAND_ID:
        commandId,

      ASTRA_START_TIME:
        String(now),

      ASTRA_VERSION:
        String(version),

      ASTRA_UPDATED_AT:
        String(now)

    });

    return {

      success: true,

      command:
        'ASTRA_START',

      state:
        'PLAYING',

      commandId:
        commandId,

      startTime:
        now,

      version:
        version,

      serverTime:
        Date.now(),

      videoAsset:
        CONFIG.VIDEO_ASSET,

      audioAsset:
        CONFIG.AUDIO_ASSET,

      unlocked:
        true
    };

  } finally {

    lock.releaseLock();
  }
}


/* =====================================================
   STOP
   ===================================================== */

function stopCommand_(token) {

  verifyToken_(token);

  const lock =
    LockService.getScriptLock();

  lock.waitLock(10000);

  try {

    const props =
      PropertiesService
        .getScriptProperties();

    const now =
      Date.now();

    const commandId =
      createCommandId_();

    const version =
      Number(
        props.getProperty('ASTRA_VERSION') ||
        '0'
      ) + 1;

    props.setProperties({

      ASTRA_STATE:
        'STOPPED',

      ASTRA_COMMAND_ID:
        commandId,

      ASTRA_START_TIME:
        '0',

      ASTRA_VERSION:
        String(version),

      ASTRA_UPDATED_AT:
        String(now)

    });

    return {

      success: true,

      command:
        'ASTRA_STOP',

      state:
        'STOPPED',

      commandId:
        commandId,

      startTime:
        0,

      version:
        version,

      serverTime:
        Date.now(),

      unlocked:
        false
    };

  } finally {

    lock.releaseLock();
  }
}


/* =====================================================
   LOCK ALL
   ===================================================== */

function lockCommand_(token) {

  verifyToken_(token);

  const lock =
    LockService.getScriptLock();

  lock.waitLock(10000);

  try {

    const props =
      PropertiesService
        .getScriptProperties();

    const now =
      Date.now();

    const commandId =
      createCommandId_();

    const version =
      Number(
        props.getProperty('ASTRA_VERSION') ||
        '0'
      ) + 1;

    props.setProperties({

      ASTRA_STATE:
        'LOCKED',

      ASTRA_COMMAND_ID:
        commandId,

      // Important:
      // locking cancels active playback
      ASTRA_START_TIME:
        '0',

      ASTRA_VERSION:
        String(version),

      ASTRA_UPDATED_AT:
        String(now)

    });

    return {

      success: true,

      command:
        'ASTRA_LOCK',

      state:
        'LOCKED',

      commandId:
        commandId,

      startTime:
        0,

      version:
        version,

      serverTime:
        Date.now(),

      unlocked:
        false
    };

  } finally {

    lock.releaseLock();
  }
}


/* =====================================================
   UNLOCK ALL
   ===================================================== */

function unlockCommand_(token) {

  verifyToken_(token);

  const lock =
    LockService.getScriptLock();

  lock.waitLock(10000);

  try {

    const props =
      PropertiesService
        .getScriptProperties();

    const now =
      Date.now();

    const commandId =
      createCommandId_();

    const version =
      Number(
        props.getProperty('ASTRA_VERSION') ||
        '0'
      ) + 1;

    props.setProperties({

      ASTRA_STATE:
        'UNLOCKED',

      ASTRA_COMMAND_ID:
        commandId,

      // Unlock does not start playback
      ASTRA_START_TIME:
        '0',

      ASTRA_VERSION:
        String(version),

      ASTRA_UPDATED_AT:
        String(now)

    });

    return {

      success: true,

      command:
        'ASTRA_UNLOCK',

      state:
        'UNLOCKED',

      commandId:
        commandId,

      startTime:
        0,

      version:
        version,

      serverTime:
        Date.now(),

      unlocked:
        true
    };

  } finally {

    lock.releaseLock();
  }
}


/* =====================================================
   SYNC
   ===================================================== */

function syncCommand_(token) {

  verifyToken_(token);

  const lock =
    LockService.getScriptLock();

  lock.waitLock(10000);

  try {

    const props =
      PropertiesService
        .getScriptProperties();

    const state =
      props.getProperty('ASTRA_STATE') ||
      'LOCKED';

    const startTime =
      Number(
        props.getProperty('ASTRA_START_TIME') ||
        '0'
      );

    const now =
      Date.now();

    const commandId =
      createCommandId_();

    const version =
      Number(
        props.getProperty('ASTRA_VERSION') ||
        '0'
      ) + 1;

    props.setProperties({

      ASTRA_COMMAND_ID:
        commandId,

      ASTRA_VERSION:
        String(version),

      ASTRA_UPDATED_AT:
        String(now)

    });

    return {

      success: true,

      command:
        'ASTRA_SYNC',

      state:
        state,

      startTime:
        startTime,

      commandId:
        commandId,

      version:
        version,

      serverTime:
        now,

      videoAsset:
        CONFIG.VIDEO_ASSET,

      audioAsset:
        CONFIG.AUDIO_ASSET,

      unlocked:
        state !== 'LOCKED'
    };

  } finally {

    lock.releaseLock();
  }
}


/* =====================================================
   ADMIN ROUTER
   ===================================================== */

function runAdminCommand(
  command,
  token
) {

  verifyToken_(token);

  const cmd =
    String(command || '')
      .trim()
      .toLowerCase();

  switch (cmd) {

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
      throw new Error(
        'Unknown organizer command: ' +
        command
      );
  }
}


/* =====================================================
   ADMIN STATE
   ===================================================== */

function getAdminState() {

  return getState_();
}


/* =====================================================
   RESET
   ===================================================== */

function adminReset(token) {

  verifyToken_(token);

  emergencyReset_();

  return getState_();
}


function initializeASTRA() {

  const lock =
    LockService.getScriptLock();

  lock.waitLock(10000);

  try {

    PropertiesService
      .getScriptProperties()
      .setProperties({

        ASTRA_STATE:
          'LOCKED',

        ASTRA_COMMAND_ID:
          '0',

        ASTRA_START_TIME:
          '0',

        ASTRA_VERSION:
          '0',

        ASTRA_UPDATED_AT:
          String(Date.now())

      });

    return getState_();

  } finally {

    lock.releaseLock();
  }
}


function emergencyReset_() {

  PropertiesService
    .getScriptProperties()
    .setProperties({

      ASTRA_STATE:
        'LOCKED',

      ASTRA_COMMAND_ID:
        createCommandId_(),

      ASTRA_START_TIME:
        '0',

      ASTRA_VERSION:
        '0',

      ASTRA_UPDATED_AT:
        String(Date.now())

    });
}


/* =====================================================
   TOKEN
   ===================================================== */

function verifyToken_(token) {

  if (!token) {

    throw new Error(
      'Organizer authorization required.'
    );
  }

  if (
    String(token) !==
    String(CONFIG.ADMIN_TOKEN)
  ) {

    throw new Error(
      'Unauthorized organizer request.'
    );
  }
}


/* =====================================================
   COMMAND ID
   ===================================================== */

function createCommandId_() {

  return (
    Date.now() +
    '-' +
    Utilities.getUuid()
  );
}


/* =====================================================
   JSON
   ===================================================== */

function jsonResponse_(data) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}


/* =====================================================
   JSONP
   ===================================================== */

function jsonpResponse_(
  callback,
  data
) {

  const safeCallback =
    String(callback)
      .replace(
        /[^a-zA-Z0-9_$\.]/g,
        ''
      );

  if (!safeCallback) {

    return jsonResponse_({
      success: false,
      error: 'Invalid callback.'
    });
  }

  const payload =
    safeCallback +
    '(' +
    JSON.stringify(data) +
    ');';

  return ContentService
    .createTextOutput(payload)
    .setMimeType(
      ContentService.MimeType.JAVASCRIPT
    );
}


/* =====================================================
   TEST
   ===================================================== */

function testState() {

  return getState_();
}

/**
 * =====================================================
 * ASTRA HACKATHON 2026 - PARTICIPANT REMOTE CONTROLLER
 * =====================================================
 * 
 * Connects participant website with Google Apps Script
 * Master Controller in near-real-time (800ms polling).
 */

export const ASTRA_CONTROLLER_URL = 'https://script.google.com/macros/s/AKfycbxEnhPkI6dWiI-83KS_j--0SfQ_C3LiL6c6HO5Wa8cQTzuRa8J8SLrdhxoOsoq_XKgS9g/exec';

let lastCommandId = '0';
let pollIntervalId = null;

/**
 * Robust JSONP state fetcher to overcome Google Apps Script redirect CORS
 */
function fetchStateJSONP(url, callback) {
  const callbackName = 'astra_cb_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  const script = document.createElement('script');
  
  let cleanupTimeout = null;

  window[callbackName] = function(data) {
    if (cleanupTimeout) clearTimeout(cleanupTimeout);
    delete window[callbackName];
    if (script.parentNode) script.parentNode.removeChild(script);
    callback(null, data);
  };

  script.src = url + (url.includes('?') ? '&' : '?') + 'api=state&callback=' + callbackName + '&_t=' + Date.now();
  script.onerror = function() {
    if (cleanupTimeout) clearTimeout(cleanupTimeout);
    delete window[callbackName];
    if (script.parentNode) script.parentNode.removeChild(script);
    // Fallback to fetch
    fetch(url + (url.includes('?') ? '&' : '?') + 'api=state&_t=' + Date.now())
      .then(res => res.json())
      .then(data => callback(null, data))
      .catch(err => callback(err, null));
  };

  cleanupTimeout = setTimeout(() => {
    delete window[callbackName];
    if (script.parentNode) script.parentNode.removeChild(script);
  }, 4000);

  document.head.appendChild(script);
}

/**
 * Initializes polling for remote commands from organizer
 */
export function initAstraRemoteController({
  onStateChange,
  onRemoteStart,
  onRemoteStop,
  onRemoteLock,
  onRemoteUnlock,
  onRemoteSync
}) {
  if (typeof window === 'undefined') return () => {};

  function checkRemoteState() {
    if (!navigator.onLine) return;

    fetchStateJSONP(ASTRA_CONTROLLER_URL, (err, data) => {
      if (err || !data || !data.success) return;

      if (onStateChange) onStateChange(data);

      // Detect new commands
      if (data.commandId && data.commandId !== lastCommandId) {
        lastCommandId = data.commandId;

        if (data.state === 'PLAYING' && onRemoteStart) {
          onRemoteStart(data);
        } else if (data.state === 'STOPPED' && onRemoteStop) {
          onRemoteStop(data);
        } else if (data.state === 'LOCKED' && onRemoteLock) {
          onRemoteLock(data);
        } else if (data.state === 'UNLOCKED' && onRemoteUnlock) {
          onRemoteUnlock(data);
        }

        if (data.command === 'ASTRA_SYNC' && onRemoteSync) {
          onRemoteSync(data);
        }
      }
    });
  }

  // Initial immediate check
  checkRemoteState();

  // Poll every 800ms
  pollIntervalId = setInterval(checkRemoteState, 800);

  return () => {
    if (pollIntervalId) clearInterval(pollIntervalId);
  };
}

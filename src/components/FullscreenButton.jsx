import React, { useState, useEffect } from 'react';

export default function FullscreenButton({ isPrimary = false }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || document.webkitFullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch((err) => {
          console.warn('[Fullscreen] Request blocked or failed:', err);
        });
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn('[Fullscreen] Exit blocked or failed:', err);
        });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  return (
    <button
      id="fullscreen-toggle-btn"
      className={`hud-action-btn ${isPrimary ? 'hud-btn-primary' : ''}`}
      onClick={toggleFullscreen}
      aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen (F)'}
    >
      {isFullscreen ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
          <span>Exit Fullscreen</span>
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          <span>Fullscreen</span>
        </>
      )}
    </button>
  );
}

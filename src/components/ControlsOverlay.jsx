import React, { useState, useEffect, useRef } from 'react';
import FullscreenButton from './FullscreenButton';
import OfflineIndicator from './OfflineIndicator';

export default function ControlsOverlay({ isMuted, onToggleMute, onRestart, showInfo, onToggleInfo }) {
  const [isVisible, setIsVisible] = useState(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleActivity = () => {
      setIsVisible(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 3500);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);

    // Initial timeout
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 3500);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className={`cinema-hud ${isVisible || showInfo ? '' : 'hud-hidden'}`} aria-label="Cinematic Controls">
      {/* Top Header */}
      <div className="hud-top-bar">
        <div className="hud-brand">
          <img src="assets/icons/icon-192.png" alt="ASTRA Logo" className="hud-brand-logo" />
          <span className="hud-brand-text">ASTRA</span>
        </div>

        <div className="hud-controls-group">
          <OfflineIndicator />

          {/* Info Toggle */}
          <button
            className="hud-action-btn"
            onClick={onToggleInfo}
            aria-label="Event Information"
            title="Event Info (I)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Info</span>
          </button>

          {/* Sound Toggle */}
          <button
            className="hud-action-btn"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            title={isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
          >
            {isMuted ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
                <span>Muted</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
                <span>Sound On</span>
              </>
            )}
          </button>

          {/* Restart Button */}
          <button
            className="hud-action-btn"
            onClick={onRestart}
            aria-label="Restart Video"
            title="Restart to Beginning (R)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            <span>Restart</span>
          </button>

          {/* Prominent Fullscreen Button */}
          <FullscreenButton isPrimary={true} />
        </div>
      </div>

      {/* Bottom Subtitle / Info */}
      <div className="hud-bottom-bar">
        <span>Continuous Cinematic Stream • Infinite Auto-Loop</span>
        <span>Zero Network Call • 100% Offline Air-Gapped</span>
      </div>
    </div>
  );
}

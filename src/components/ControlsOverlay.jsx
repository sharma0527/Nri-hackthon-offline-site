import React, { useState, useEffect, useRef } from 'react';

export default function ControlsOverlay({ isMuted, onToggleMute }) {
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

    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 3500);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className={`cinema-hud ${isVisible ? '' : 'hud-hidden'}`} aria-label="Cinematic Controls">
      {/* Top Header - ONLY the Mute/Sound Icon Button is displayed, all other buttons are hidden */}
      <div className="hud-top-bar" style={{ justifyContent: 'flex-end' }}>
        <div className="hud-controls-group">
          {/* ONLY THIS MUTE/SOUND BUTTON IS SHOWN */}
          <button
            className="hud-action-btn"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Song' : 'Mute Song'}
            title={isMuted ? 'Unmute Song (M)' : 'Mute Song (M)'}
          >
            {isMuted ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
                <span>MUTED</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
                <span>SOUND ON</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

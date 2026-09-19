import React, { useEffect, useRef, useState } from 'react';
import '../styles/start-screen.css';

export default function StartScreen({ onStart, isFadingOut }) {
  const canvasRef = useRef(null);
  
  // Google Apps Script Lock State
  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('lock') === 'true') return true;
      if (p.get('unlock') === 'true') return false;
    }
    return false; // Default unlocked unless ?lock=true or Google Script specifies
  });

  const [googleScriptUrl, setGoogleScriptUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('script') || '';
    }
    return '';
  });

  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);

  // Poll Google Apps Script if URL is provided
  useEffect(() => {
    if (!googleScriptUrl) return;

    const checkScript = () => {
      if (!navigator.onLine) return;
      fetch(`${googleScriptUrl}${googleScriptUrl.includes('?') ? '&' : '?'}t=${Date.now()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.unlocked === 'boolean') {
            setIsLocked(!data.unlocked);
          }
        })
        .catch(() => {});
    };

    checkScript();
    const interval = setInterval(checkScript, 3000);
    return () => clearInterval(interval);
  }, [googleScriptUrl]);

  // Subtle cosmic starfield particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const numStars = Math.min(80, Math.floor((width * height) / 15000));
    const stars = Array.from({ length: numStars }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.7 + 0.2,
      velocity: (Math.random() * 0.15 + 0.05),
      pulseSpeed: Math.random() * 0.02 + 0.01,
      pulseOffset: Math.random() * Math.PI * 2
    }));

    let tick = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      tick += 1;

      stars.forEach((star) => {
        star.y -= star.velocity;
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }

        const currentAlpha =
          star.alpha * (0.6 + 0.4 * Math.sin(tick * star.pulseSpeed + star.pulseOffset));

        ctx.fillStyle = `rgba(165, 243, 252, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Offline Organizer Secret Override: Press 'U' or tap ASTRA 5 times
  const handleSecretTap = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 2000);

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      const code = prompt('Organizer Override: Enter passcode to toggle lock (Default: 2026):');
      if (code === '2026' || code === 'admin') {
        setIsLocked((prev) => !prev);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'u' || e.key === 'U') {
        const code = prompt('Organizer Override: Enter passcode to toggle lock (Default: 2026):');
        if (code === '2026' || code === 'admin') {
          setIsLocked((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStart = () => {
    if (isLocked) {
      alert('Event has not started yet. Please wait for the organizer!');
      return;
    }
    onStart();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleStart();
    }
  };

  return (
    <div
      className={`start-screen-container ${isFadingOut ? 'fading-out' : ''}`}
      role="region"
      aria-label="ASTRA Cinematic Entry"
    >
      <canvas ref={canvasRef} className="particle-canvas" />
      <div className="ambient-glow" />

      <div className="start-content">
        <div
          className="brand-badge"
          onClick={handleSecretTap}
          style={{ cursor: 'pointer' }}
          title="Tap 5 times for Organizer Offline Override"
        >
          <span className="brand-badge-dot" />
          <span>ASTRA HACKATHON 2026</span>
        </div>

        <h1
          className="astra-title"
          onClick={handleSecretTap}
          style={{ cursor: 'pointer' }}
          title="Tap 5 times for Organizer Offline Override"
        >
          ASTRA
        </h1>
        <p className="astra-tagline">Cinematic Offline Experience</p>

        <div className="action-cluster">
          <button
            id="start-cinematic-btn"
            className="btn-start"
            onClick={handleStart}
            onKeyDown={handleKeyDown}
            disabled={isLocked}
            autoFocus
            aria-label="Start ASTRA cinematic fullscreen experience"
            style={isLocked ? { cursor: 'not-allowed', opacity: 0.8, borderColor: '#f59e0b', color: '#fbbf24' } : {}}
          >
            {isLocked ? (
              <span>🔒 LOCKED — WAITING FOR ORGANIZER</span>
            ) : (
              <>
                <span>START FULLSCREEN</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                </svg>
              </>
            )}
          </button>

          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', letterSpacing: '0.15em', color: isLocked ? '#f59e0b' : '#10b981' }}>
            {isLocked ? 'WAITING FOR ORGANIZER SIGNAL' : 'READY • TAP TO LAUNCH'}
          </div>
        </div>
      </div>
    </div>
  );
}

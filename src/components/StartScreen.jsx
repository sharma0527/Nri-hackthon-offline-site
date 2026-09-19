import React, { useEffect, useRef, useState } from 'react';
import '../styles/start-screen.css';

// Default Deployed Google Apps Script Web App URL
const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxEnhPkI6dWiI-83KS_j--0SfQ_C3LiL6c6HO5Wa8cQTzuRa8J8SLrdhxoOsoq_XKgS9g/exec";

export default function StartScreen({ onStart, isFadingOut, isLockedExternal }) {
  const canvasRef = useRef(null);
  
  // Persistent Lock State from localStorage
  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('lock') === 'true') {
        localStorage.setItem('astra_is_locked', 'true');
        return true;
      }
      if (p.get('unlock') === 'true') {
        localStorage.setItem('astra_is_locked', 'false');
        return false;
      }
      return localStorage.getItem('astra_is_locked') === 'true';
    }
    return false;
  });

  const effectiveLocked = Boolean(isLocked || isLockedExternal);

  const [googleScriptUrl, setGoogleScriptUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const s = p.get('script');
      if (s) {
        localStorage.setItem('astra_script_url', s);
        return s;
      }
      return localStorage.getItem('astra_script_url') || DEFAULT_SCRIPT_URL;
    }
    return DEFAULT_SCRIPT_URL;
  });

  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);

  // Poll Google Apps Script in real-time every 2.5 seconds
  useEffect(() => {
    if (!googleScriptUrl) return;

    const checkScript = () => {
      if (!navigator.onLine) return;
      const fetchUrl = `${googleScriptUrl}${googleScriptUrl.includes('?') ? '&' : '?'}format=json&t=${Date.now()}`;
      fetch(fetchUrl)
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.unlocked === 'boolean') {
            const lockedState = !data.unlocked;
            setIsLocked(lockedState);
            localStorage.setItem('astra_is_locked', lockedState ? 'true' : 'false');
          }
        })
        .catch(() => {});
    };

    checkScript();
    const interval = setInterval(checkScript, 2500);
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

  // Offline Organizer Secret Override: Passcode is "0527"
  const handleSecretTap = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 2000);

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      const code = prompt('Organizer Security Override\nEnter Passcode:');
      if (code === '0527') {
        setIsLocked((prev) => {
          const next = !prev;
          localStorage.setItem('astra_is_locked', next ? 'true' : 'false');
          alert(next ? 'Website is now LOCKED' : 'Website is now UNLOCKED!');
          return next;
        });
      } else if (code !== null) {
        alert('Invalid passcode.');
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'u' || e.key === 'U') {
        const code = prompt('Organizer Security Override\nEnter Passcode:');
        if (code === '0527') {
          setIsLocked((prev) => {
            const next = !prev;
            localStorage.setItem('astra_is_locked', next ? 'true' : 'false');
            alert(next ? 'Website is now LOCKED' : 'Website is now UNLOCKED!');
            return next;
          });
        } else if (code !== null) {
          alert('Invalid passcode.');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStart = () => {
    if (effectiveLocked) {
      alert('The event has not started yet. Please wait for the organizer to unlock!');
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
          title="Tap 5 times for Organizer Passcode Override"
        >
          <span className="brand-badge-dot" />
          <span>ASTRA HACKATHON 2026</span>
        </div>

        <h1
          className="astra-title"
          onClick={handleSecretTap}
          style={{ cursor: 'pointer' }}
          title="Tap 5 times for Organizer Passcode Override"
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
            disabled={effectiveLocked}
            autoFocus
            aria-label="Start ASTRA cinematic fullscreen experience"
            style={effectiveLocked ? { cursor: 'not-allowed', opacity: 0.8, borderColor: '#f59e0b', color: '#fbbf24' } : {}}
          >
            {effectiveLocked ? (
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

          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', letterSpacing: '0.15em', color: effectiveLocked ? '#f59e0b' : '#10b981' }}>
            {effectiveLocked ? 'WAITING FOR ORGANIZER SIGNAL' : 'READY • TAP TO LAUNCH'}
          </div>
        </div>
      </div>
    </div>
  );
}

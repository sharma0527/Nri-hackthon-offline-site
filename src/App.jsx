import React, { useState, useRef, useEffect, useCallback } from 'react';
import AstraController from './astra-controller';
import StartScreen from './components/StartScreen';
import './styles/video-player.css';

export default function App() {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const lockScreenRef = useRef(null);
  const videoPageRef = useRef(null);
  const statusRef = useRef(null);
  const controllerRef = useRef(null);

  const [controllerState, setControllerState] = useState('LOCKED');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const [manualLockOverride, setManualLockOverride] = useState(false);

  const fadeTimeoutRef = useRef(null);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);

  // Initialize AstraController on mount
  useEffect(() => {
    const controller = new AstraController({
      video: videoRef.current,
      audio: audioRef.current,
      lockScreen: lockScreenRef.current,
      videoPage: videoPageRef.current,
      statusElement: statusRef.current,
      onStateChange: (data) => {
        if (data && data.state) {
          setControllerState(data.state);
          if (data.state === 'PLAYING') {
            setIsPlaying(true);
          } else if (data.state === 'STOPPED' || data.state === 'LOCKED') {
            setIsPlaying(false);
          }
        }
      }
    });

    controllerRef.current = controller;
    controller.start();

    return () => {
      controller.stop();
    };
  }, []);

  // Handle Manual Start Fullscreen (when UNLOCKED)
  const handleManualStart = useCallback(async () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    const controller = controllerRef.current;

    if (!video || !audio) return;

    video.loop = true;
    video.muted = true;
    video.playsInline = true;

    audio.loop = true;
    audio.muted = false;
    audio.volume = 1;

    try {
      await video.play();
    } catch (e) {
      console.warn("Video playback blocked:", e);
    }

    try {
      await audio.play();
    } catch (e) {
      console.warn("Audio playback blocked, awaiting user interaction:", e);
    }

    if (controller) {
      controller.enterFullscreen();
    }

    setIsPlaying(true);
  }, []);

  // Mute / Unmute Sound Toggle
  const handleToggleSound = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextMuted = !audio.muted;
    audio.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  // Auto fade HUD sound button
  useEffect(() => {
    if (!isPlaying) return;

    const resetFadeTimer = () => {
      setIsButtonVisible(true);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = setTimeout(() => {
        setIsButtonVisible(false);
      }, 2500);
    };

    window.addEventListener('mousemove', resetFadeTimer);
    window.addEventListener('touchstart', resetFadeTimer);

    fadeTimeoutRef.current = setTimeout(() => {
      setIsButtonVisible(false);
    }, 2500);

    return () => {
      window.removeEventListener('mousemove', resetFadeTimer);
      window.removeEventListener('touchstart', resetFadeTimer);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, [isPlaying]);

  // Keyboard shortcuts ('m' for sound, 'f' for fullscreen, 'u' for emergency override)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'm' || e.key === 'M') {
        handleToggleSound();
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          controllerRef.current?.enterFullscreen();
        } else {
          controllerRef.current?.exitFullscreen();
        }
      } else if (e.key === 'u' || e.key === 'U') {
        const code = prompt('Organizer Security Override\nEnter Passcode:');
        if (code === '0527') {
          setManualLockOverride((prev) => {
            const next = !prev;
            if (next && lockScreenRef.current && videoPageRef.current) {
              lockScreenRef.current.style.display = 'none';
              videoPageRef.current.style.display = 'block';
            }
            alert(next ? 'Emergency Override: UNLOCKED' : 'Lock Restored');
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

  // Emergency 5-tap override
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
        setManualLockOverride((prev) => {
          const next = !prev;
          if (next && lockScreenRef.current && videoPageRef.current) {
            lockScreenRef.current.style.display = 'none';
            videoPageRef.current.style.display = 'block';
          }
          alert(next ? 'Emergency Override: UNLOCKED' : 'Lock Restored');
          return next;
        });
      } else if (code !== null) {
        alert('Invalid passcode.');
      }
    }
  };

  const isActuallyLocked = (controllerState === 'LOCKED') && !manualLockOverride;

  return (
    <div className="astra-app">
      {/* =================================================
          1. CENTRAL LOCK SCREEN
          Shown when central state === 'LOCKED'
          ================================================= */}
      <div
        ref={lockScreenRef}
        className="astra-lock-screen"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: isActuallyLocked ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at center, #0a1128 0%, #02040b 70%, #000000 100%)',
          color: '#ffffff',
          textAlign: 'center',
          padding: '2rem',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        <div style={{ maxWidth: '520px', width: '100%' }}>
          {/* Brand Badge */}
          <div
            onClick={handleSecretTap}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '1.5rem',
              cursor: 'pointer'
            }}
            title="Tap 5 times for emergency passcode override"
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                boxShadow: '0 0 10px #ef4444'
              }}
            />
            <span>ASTRA HACKATHON 2026</span>
          </div>

          <h1
            onClick={handleSecretTap}
            style={{
              fontSize: 'clamp(3rem, 8vw, 5rem)',
              fontWeight: 900,
              letterSpacing: '0.2em',
              margin: '0 0 0.5rem 0',
              background: 'linear-gradient(180deg, #ffffff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              cursor: 'pointer'
            }}
          >
            ASTRA
          </h1>

          <h2
            style={{
              fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: '#f87171',
              margin: '0 0 1rem 0',
              textTransform: 'uppercase'
            }}
          >
            SESSION LOCKED
          </h2>

          <p
            style={{
              fontSize: '1rem',
              color: '#94a3b8',
              letterSpacing: '0.05em',
              lineHeight: 1.6,
              margin: '0 0 2rem 0'
            }}
          >
            Waiting for organizer to initiate the experience...
          </p>

          <div
            ref={statusRef}
            style={{
              display: 'inline-block',
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              letterSpacing: '0.1em',
              fontWeight: 700
            }}
          >
            {controllerState}
          </div>
        </div>
      </div>

      {/* =================================================
          2. VIDEO PAGE
          Shown when central state !== 'LOCKED'
          ================================================= */}
      <main
        ref={videoPageRef}
        style={{
          display: isActuallyLocked ? 'none' : 'block',
          position: 'fixed',
          inset: 0,
          background: '#000000',
          overflow: 'hidden'
        }}
      >
        {/* CINEMATIC VIDEO (PERMANENTLY SILENT) */}
        <video
          ref={videoRef}
          src="/assets/video/astra-hero.mp4"
          preload="auto"
          playsInline
          loop
          muted
          className={`cinematic-video ${isPlaying ? 'video-visible' : ''}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />

        {/* DEDICATED AUDIO: ONLY /assets/audio/astra-theme.mp3 */}
        <audio
          ref={audioRef}
          src="/assets/audio/astra-theme.mp3"
          preload="auto"
          loop
          style={{ display: 'none' }}
        />

        {/* SOUND TOGGLE BUTTON (AUTO-FADES) */}
        {isPlaying && (
          <div
            style={{
              position: 'absolute',
              top: 'max(1.25rem, env(safe-area-inset-top))',
              right: 'max(1.25rem, env(safe-area-inset-right))',
              zIndex: 40,
              opacity: isButtonVisible ? 1 : 0.15,
              transition: 'opacity 0.4s ease',
              pointerEvents: 'auto'
            }}
          >
            <button
              id="astra-sound-btn"
              onClick={handleToggleSound}
              aria-label={isMuted ? 'Unmute Song' : 'Mute Song'}
              title={isMuted ? 'Unmute Song (M)' : 'Mute Song (M)'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.15rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(34, 211, 238, 0.35)',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
                outline: 'none',
                transition: 'transform 0.2s, background-color 0.2s, border-color 0.2s'
              }}
            >
              {isMuted ? '🔇 MUTED' : '🔊 SOUND ON'}
            </button>
          </div>
        )}

        {/* START SCREEN (Shown when UNLOCKED but not yet PLAYING) */}
        {!isPlaying && (
          <StartScreen
            onStart={handleManualStart}
            isLockedExternal={isActuallyLocked}
          />
        )}
      </main>
    </div>
  );
}

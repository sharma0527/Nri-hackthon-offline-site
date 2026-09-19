import React, { useState, useRef, useEffect, useCallback } from 'react';
import StartScreen from './components/StartScreen';
import { initAstraRemoteController } from './astra-controller';
import './styles/video-player.css';

export default function App() {
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const videoRef = useRef(null);

  const [started, setStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const fadeTimeoutRef = useRef(null);

  // START FULLSCREEN CLICK / REMOTE TRIGGER LOGIC
  const handleStartFullscreen = useCallback(async () => {
    const audio = audioRef.current;
    const video = videoRef.current;
    const container = containerRef.current;

    if (!audio || !video) return;

    // 1. Prepare ASTRA theme
    audio.pause();
    audio.currentTime = 0;
    audio.loop = true;
    audio.muted = false;
    audio.volume = 1;

    // 2. Prepare ASTRA video (permanently silent)
    video.pause();
    video.currentTime = 0;
    video.loop = true;
    video.muted = true;

    // 3. Start ASTRA theme with sound
    try {
      await audio.play();
    } catch (error) {
      console.warn("ASTRA theme playback failed (waiting for user gesture):", error);
      const unlockAudio = () => {
        audio.muted = false;
        audio.volume = 1;
        audio.play().catch(() => {});
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('click', unlockAudio);
      window.addEventListener('touchstart', unlockAudio);
    }

    // 4. Start ASTRA video
    try {
      await video.play();
    } catch (error) {
      console.warn("ASTRA video playback failed:", error);
    }

    // 5. Request fullscreen
    try {
      if (
        container &&
        document.fullscreenEnabled &&
        !document.fullscreenElement
      ) {
        await container.requestFullscreen();
      }
    } catch (error) {
      console.warn("Fullscreen request failed:", error);
    }

    setStarted(true);
  }, []);

  // STOP LOGIC (Triggered when organizer clicks STOP ALL)
  const handleStopAll = useCallback(() => {
    const audio = audioRef.current;
    const video = videoRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setStarted(false);
  }, []);

  // SYNC LOGIC (Triggered when organizer clicks SYNC ALL)
  const handleSyncAll = useCallback((data) => {
    const audio = audioRef.current;
    const video = videoRef.current;
    if (!audio || !video || !data.startTime) return;

    const elapsed = Math.max(0, (Date.now() - data.startTime) / 1000);
    if (video.duration && isFinite(video.duration)) {
      video.currentTime = elapsed % video.duration;
    } else {
      video.currentTime = elapsed;
    }
    if (audio.duration && isFinite(audio.duration)) {
      audio.currentTime = elapsed % audio.duration;
    } else {
      audio.currentTime = elapsed;
    }
  }, []);

  // CONNECT WITH GOOGLE APPS SCRIPT MASTER CONTROLLER
  useEffect(() => {
    const cleanup = initAstraRemoteController({
      onRemoteStart: () => {
        console.log('[ASTRA Remote] Organizer triggered START FULLSCREEN');
        handleStartFullscreen();
      },
      onRemoteStop: () => {
        console.log('[ASTRA Remote] Organizer triggered STOP ALL');
        handleStopAll();
      },
      onRemoteLock: () => {
        console.log('[ASTRA Remote] Organizer triggered LOCK ALL');
        setIsLocked(true);
      },
      onRemoteUnlock: () => {
        console.log('[ASTRA Remote] Organizer triggered UNLOCK ALL');
        setIsLocked(false);
      },
      onRemoteSync: (data) => {
        console.log('[ASTRA Remote] Organizer triggered SYNC ALL');
        handleSyncAll(data);
      },
      onStateChange: (stateData) => {
        if (stateData && stateData.state) {
          if (stateData.state === 'LOCKED') setIsLocked(true);
          else if (stateData.state === 'UNLOCKED') setIsLocked(false);
        }
      }
    });

    return cleanup;
  }, [handleStartFullscreen, handleStopAll, handleSyncAll]);

  // SOUND BUTTON TOGGLE LOGIC
  const handleToggleSound = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Muting/unmuting does not restart audio or reset currentTime
    const nextMuted = !audio.muted;
    audio.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  // AUTO FADE LOGIC FOR SOUND BUTTON (2-3 seconds)
  useEffect(() => {
    if (!started) return;

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
  }, [started]);

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!started) return;

      if (e.key === 'm' || e.key === 'M') {
        handleToggleSound();
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          containerRef.current?.requestFullscreen?.().catch(() => {});
        } else {
          document.exitFullscreen?.().catch(() => {});
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [started]);

  return (
    <main
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        overflow: 'hidden'
      }}
    >
      {/* EXACTLY ONE AUDIO ELEMENT: ONLY /assets/audio/astra-theme.mp3 */}
      <audio
        ref={audioRef}
        src="/assets/audio/astra-theme.mp3"
        preload="auto"
        loop
        style={{ display: 'none' }}
      />

      {/* ASTRA CINEMATIC VIDEO */}
      <video
        ref={videoRef}
        className={`cinematic-video ${started ? 'video-visible' : ''}`}
        src="/assets/video/astra-hero.mp4"
        loop
        muted
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        preload="auto"
      />

      {/* ONLY VISIBLE CONTROL AFTER START: SOUND BUTTON */}
      {started && (
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

      {/* START FULLSCREEN SCREEN */}
      {!started && (
        <StartScreen
          onStart={handleStartFullscreen}
          isLockedExternal={isLocked}
        />
      )}
    </main>
  );
}

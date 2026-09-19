import React, { useState, useRef, useEffect } from 'react';
import StartScreen from './components/StartScreen';
import './styles/video-player.css';

export default function App() {
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const videoRef = useRef(null);

  const [started, setStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const fadeTimeoutRef = useRef(null);

  // START FULLSCREEN CLICK LOGIC
  const handleStartFullscreen = async () => {
    const audio = audioRef.current;
    const video = videoRef.current;
    const container = containerRef.current;

    if (!audio || !video) return;

    // Prepare ASTRA theme
    audio.pause();
    audio.currentTime = 0;
    audio.loop = true;
    audio.muted = false;
    audio.volume = 1;

    // Prepare ASTRA video
    video.pause();
    video.currentTime = 0;
    video.loop = true;
    video.muted = true;

    // Start ASTRA theme
    try {
      await audio.play();
    } catch (error) {
      console.warn("ASTRA theme playback failed:", error);
    }

    // Start ASTRA video
    try {
      await video.play();
    } catch (error) {
      console.warn("ASTRA video playback failed:", error);
    }

    // Request fullscreen
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
  };

  // SOUND TOGGLE LOGIC
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
        <StartScreen onStart={handleStartFullscreen} />
      )}
    </main>
  );
}

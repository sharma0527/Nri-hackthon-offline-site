import React, { useState, useRef } from 'react';
import StartScreen from './components/StartScreen';
import VideoPlayer from './components/VideoPlayer';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const videoPlayerRef = useRef(null);

  const requestAutoFullscreen = () => {
    try {
      const docEl = document.documentElement;
      const videoEl = videoPlayerRef.current?.getVideoElement?.();

      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch((err) => {
          console.log('[Fullscreen] Standard request:', err);
        });
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      } else if (videoEl && videoEl.webkitEnterFullscreen) {
        // Native mobile iOS Safari fullscreen
        videoEl.webkitEnterFullscreen();
      }
    } catch (err) {
      console.warn('[Fullscreen] Trigger caught:', err);
    }
  };

  const handleStart = () => {
    // 1. Immediately request true fullscreen on laptop & mobile
    requestAutoFullscreen();

    // 2. Begin video playback immediately on the user click gesture
    setIsPlaying(true);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.playVideo();
    }

    // 3. Start UI cross-fade transition
    setIsFadingOut(true);

    // 4. Video smoothly fades into view
    setTimeout(() => {
      setIsVideoVisible(true);
    }, 300);

    // 5. Complete transition
    setTimeout(() => {
      setHasStarted(true);
    }, 800);
  };

  return (
    <main style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Persistent Video Player stays mounted to ensure seamless instant playback */}
      <VideoPlayer
        ref={videoPlayerRef}
        isPlaying={isPlaying}
        isVisible={isVideoVisible}
      />

      {/* Start Screen sits above video until user triggers Start */}
      {!hasStarted && (
        <StartScreen
          onStart={handleStart}
          isFadingOut={isFadingOut}
        />
      )}
    </main>
  );
}

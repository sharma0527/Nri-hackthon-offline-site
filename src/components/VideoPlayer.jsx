import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import ControlsOverlay from './ControlsOverlay';
import '../styles/video-player.css';

const VideoPlayer = forwardRef(function VideoPlayer({ isPlaying, isVisible }, ref) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);

  // Expose video & audio controls to parent
  useImperativeHandle(ref, () => ({
    getVideoElement: () => videoRef.current,
    getAudioElement: () => audioRef.current,
    playVideo: () => {
      const video = videoRef.current;
      const audio = audioRef.current;

      // 1. Play astra-theme.mp3 immediately with full sound on user gesture
      if (audio) {
        audio.muted = false;
        audio.volume = 1.0;
        audio.currentTime = 0;
        setIsMuted(false);
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[Audio] Autoplay blocked or interrupted, registering unlock listeners:', err);
            const resumeAudio = () => {
              audio.muted = false;
              audio.volume = 1.0;
              audio.play().catch(() => {});
              window.removeEventListener('click', resumeAudio);
              window.removeEventListener('touchstart', resumeAudio);
            };
            window.addEventListener('click', resumeAudio);
            window.addEventListener('touchstart', resumeAudio);
          });
        }
      }

      // 2. Video plays silently (audio stripped with -an)
      if (video) {
        video.muted = true;
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    },
    restart: () => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    }
  }));

  // Preload audio on initial mount
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, []);

  // Trigger continuous playback when isPlaying transitions to true
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!isPlaying) return;

    if (video && video.paused) {
      video.muted = true;
      video.play().catch(() => {});
    }
    if (audio && audio.paused) {
      audio.muted = isMuted;
      audio.play().catch(() => {});
    }
  }, [isPlaying]);

  // Seamless Loop Engine: Loops video and astra-theme.mp3 continuously forever
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video) return;

    const handleVideoEnded = () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    };

    const handleAudioEnded = () => {
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    };

    video.addEventListener('ended', handleVideoEnded);
    if (audio) {
      audio.addEventListener('ended', handleAudioEnded);
    }

    return () => {
      video.removeEventListener('ended', handleVideoEnded);
      if (audio) {
        audio.removeEventListener('ended', handleAudioEnded);
      }
    };
  }, [isPlaying]);

  const toggleMute = () => {
    if (audioRef.current) {
      const nextMuted = !audioRef.current.muted;
      audioRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
      if (!nextMuted) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  // Keyboard shortcuts (F for Fullscreen, M for Mute)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying) return;

      if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          const docEl = document.documentElement;
          if (docEl.requestFullscreen) docEl.requestFullscreen().catch(() => {});
          else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
        } else {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  return (
    <div className="video-stage" aria-label="ASTRA Cinematic Presentation">
      {/* VIDEO IS 100% SILENT (AUDIO TRACK STRIPPED WITH -AN) */}
      <video
        ref={videoRef}
        className={`cinematic-video ${isVisible ? 'video-visible' : ''}`}
        loop
        muted={true}
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        preload="auto"
      >
        <source src="/assets/video/astra-hero.mp4" type="video/mp4" />
        <source src="assets/video/astra-hero.mp4" type="video/mp4" />
        <source src="/hackthon video.mp4" type="video/mp4" />
        <source src="hackthon video.mp4" type="video/mp4" />
      </video>

      {/* PLAYS ASTRA-THEME.MP3 WITH FULL SOUND AND CONTINUOUS LOOP */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
        src="/assets/audio/astra-theme.mp3"
      >
        <source src="/assets/audio/astra-theme.mp3" type="audio/mpeg" />
        <source src="assets/audio/astra-theme.mp3" type="audio/mpeg" />
        <source src="/astra-theme.mp3" type="audio/mpeg" />
        <source src="astra-theme.mp3" type="audio/mpeg" />
        <source src="/hackthon-song-cut-030-to-150.mp3" type="audio/mpeg" />
        <source src="hackthon-song-cut-030-to-150.mp3" type="audio/mpeg" />
      </audio>

      {/* Floating HUD: Only the Mute/Sound Icon Button is displayed */}
      {isVisible && (
        <ControlsOverlay
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}
    </div>
  );
});

export default VideoPlayer;

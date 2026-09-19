import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import '../styles/video-player.css';

const VideoPlayer = forwardRef(function VideoPlayer({ isPlaying, isVisible }, ref) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  // Expose video & audio controls to parent
  useImperativeHandle(ref, () => ({
    getVideoElement: () => videoRef.current,
    getAudioElement: () => audioRef.current,
    playVideo: () => {
      const video = videoRef.current;
      const audio = audioRef.current;

      // 1. Play video with sound enabled
      if (video) {
        video.muted = false;
        video.volume = 1.0;
        video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[Audio] Autoplay unmuted was restricted, falling back:', err);
            video.muted = true;
            video.play().catch(() => {});
            if (audio) {
              audio.muted = false;
              audio.volume = 1.0;
              audio.play().catch(() => {});
            }
          });
        }
      }

      // Also start fallback audio in sync
      if (audio) {
        audio.currentTime = 0;
        audio.volume = 1.0;
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

  // Trigger continuous playback as soon as isPlaying is true
  useEffect(() => {
    const video = videoRef.current;
    if (!isPlaying || !video) return;

    video.muted = false;
    video.volume = 1.0;
    video.play().catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });
  }, [isPlaying]);

  // Seamless Loop Engine: Loops video with sound continuously
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoEnded = () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    };

    video.addEventListener('ended', handleVideoEnded);
    return () => video.removeEventListener('ended', handleVideoEnded);
  }, [isPlaying]);

  // Invisible keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying) return;

      if (e.key === 'm' || e.key === 'M') {
        if (videoRef.current) {
          videoRef.current.muted = !videoRef.current.muted;
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
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

  const unmuteOnClick = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="video-stage" aria-label="ASTRA Cinematic Presentation" onClick={unmuteOnClick}>
      {/* VIDEO PLAYS DIRECTLY WITH ITS OWN SOUND */}
      <video
        ref={videoRef}
        className={`cinematic-video ${isVisible ? 'video-visible' : ''}`}
        loop
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        preload="auto"
      >
        <source src="assets/video/astra-hero.mp4" type="video/mp4" />
        <source src="hackthon-video.mp4" type="video/mp4" />
        <source src="hackthon video.mp4" type="video/mp4" />
      </video>

      {/* Fallback audio track */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
        src="hackthon-video-audio.mp3"
      />
    </div>
  );
});

export default VideoPlayer;

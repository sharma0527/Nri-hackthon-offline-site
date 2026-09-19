# ASTRA Hackathon — Offline Cinematic Website

An offline-first, local-asset cinematic web experience built for the **ASTRA Hackathon 2026**.

---

## 🚀 The 4 Possibilities to Run Without Internet

Here are the complete possibilities for how this website works 100% offline without any internet connection:

### Option 1: 1-Click Windows Launcher (`start-offline.bat`) — ⭐ Recommended
- **How it works**: Simply double-click `start-offline.bat`.
- It automatically detects Python (which is installed on your computer) or Node.js to spin up a local offline HTTP server on `http://localhost:8080` and opens your browser immediately.
- **Why this is best**: 
  - Supports full Service Worker caching and HTTP Range requests for instant video streaming and looping.
  - Zero terminal knowledge needed for anyone running the computer during the event.
  - Can be copied to a USB drive and run on any laptop without internet.

### Option 2: Installed Progressive Web App (PWA)
- **How it works**:
  1. Open the website on your browser (e.g. `http://localhost:8080`).
  2. Click the **Install ASTRA** icon in the browser address bar (Chrome, Edge, or mobile browsers).
  3. The website installs as a standalone desktop or mobile application.
- **Why this is best**:
  - Launches in true full-screen application window like a native desktop software.
  - Once cached, you can disconnect Wi-Fi, turn off mobile data, restart the computer, and launch ASTRA from your desktop or Start Menu anytime.
  - No terminal or batch script needed once installed.

### Option 3: Standalone Direct File (`dist/offline.html`)
- **How it works**: Double-click `dist/offline.html` directly in File Explorer.
- **Why this is best**:
  - Completely serverless air-gapped mode.
  - Works even on computers that do NOT have Python, Node.js, or any server software installed.
  - Directly loads the bundled video with full start screen and cinema controls.

### Option 4: Vite Dev / Preview Server
- **Development mode**: `npm run dev` (runs live hot-reloading at `http://localhost:3000`)
- **Production preview**: `npm run preview` (runs optimized production build at `http://localhost:4173`)

---

## 🎬 Cinematic User Experience

1. **Initial Blank / Cinematic Screen**:
   - Deep obsidian/navy space gradient with floating micro-star particles.
   - Glowing **ASTRA** typography.
   - Centered futuristic glassmorphic **START** button with cyan neon glow and micro-interaction animations.
   - Keyboard accessible (Press `Enter` or `Space` to start).
   - "Open in Fullscreen Mode" toggle right on the start screen.

2. **START Interaction**:
   - On click, start button scales down smoothly.
   - Start screen fades out (0.3s - 0.8s).
   - Local video (`/assets/video/astra-hero.mp4`) begins playback instantly with zero network delay.
   - Cross-fade into full opacity (0.5s - 1.0s).

3. **Continuous Playback & Loop**:
   - Loops seamlessly without black flash frames or interruption.
   - Internet connection changes (online to offline, offline to online) do NOT pause or halt video.
   - Floating cinema HUD (Brand, Offline Status, Mute/Unmute, Restart, Fullscreen) auto-hides during inactivity and appears on mouse movement or touch.

4. **Prominent Fullscreen Control**:
   - Fullscreen is immediately accessible on the HUD from the very start of playback.
   - Keyboard shortcut `F` toggles fullscreen instantly.
   - Keyboard shortcut `M` toggles mute/unmute.
   - Keyboard shortcut `R` restarts playback to the beginning.

---

## 📂 Project Architecture

```
offline site/
│
├── public/
│   ├── assets/
│   │   ├── video/
│   │   │   └── astra-hero.mp4      <- Local bundled 4MB cinematic video
│   │   └── icons/
│   │       ├── icon-192.png        <- PWA icon
│   │       └── icon-512.png        <- PWA high-res icon
│   ├── favicon.ico
│   ├── manifest.webmanifest        <- PWA installation manifest
│   ├── sw.js                       <- Cache-First Service Worker with HTTP Range slicing
│   └── offline.html                <- Direct zero-server fallback player
│
├── src/
│   ├── components/
│   │   ├── StartScreen.jsx         <- Cinematic start screen with canvas particles
│   │   ├── VideoPlayer.jsx         <- Persistent <video> player with seamless loop
│   │   ├── ControlsOverlay.jsx     <- Floating HUD with auto-hide
│   │   ├── FullscreenButton.jsx    <- Prominent Fullscreen controller
│   │   └── OfflineIndicator.jsx    <- Offline readiness badge
│   ├── hooks/
│   │   └── useOnlineStatus.js      <- Network listener
│   ├── styles/
│   │   ├── global.css              <- CSS tokens, typography & reset
│   │   ├── start-screen.css        <- Start screen animations & glow
│   │   └── video-player.css        <- Video presentation & HUD styles
│   ├── App.jsx                     <- State transition controller
│   └── main.jsx                    <- PWA registration & React entry
│
├── dist/                           <- Pre-compiled production bundle (Ready to distribute!)
├── index.html
├── package.json
├── vite.config.js
└── start-offline.bat               <- 1-click Windows offline launcher
```

---

## 📦 How to Copy to a USB Drive / Other Computers

1. Copy the entire `offline site` folder onto your USB drive or target laptop.
2. On the target computer, open the folder and double-click `start-offline.bat`.
3. The site opens instantly in the browser and plays the local ASTRA video completely offline!

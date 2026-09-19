/* =====================================================
   ASTRA PARTICIPANT CONTROLLER
   ===================================================== */

export const ASTRA_API =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ASTRA_APPS_SCRIPT_URL) ||
  'https://script.google.com/macros/s/AKfycbxEnhPkI6dWiI-83KS_j--0SfQ_C3LiL6c6HO5Wa8cQTzuRa8J8SLrdhxoOsoq_XKgS9g/exec';

export const ASTRA_POLL_MS = 800;

/* =====================================================
   CONTROLLER CLASS
   ===================================================== */

class AstraController {

  constructor(options = {}) {

    this.video =
      options.video || null;

    this.audio =
      options.audio || null;

    this.lockScreen =
      options.lockScreen || null;

    this.videoPage =
      options.videoPage || null;

    this.statusElement =
      options.statusElement || null;

    this.onStateChange =
      options.onStateChange || null;

    this.currentState =
      'LOCKED';

    this.lastCommandId =
      null;

    this.lastVersion =
      -1;

    this.pollTimer =
      null;

    this.isPolling =
      false;

  }


  /* ===================================================
     START CONTROLLER
     =================================================== */

  start() {

    this.applyLockedState();

    this.poll();

    this.pollTimer =
      setInterval(
        () => this.poll(),
        ASTRA_POLL_MS
      );

  }


  /* ===================================================
     STOP CONTROLLER
     =================================================== */

  stop() {

    if (this.pollTimer) {

      clearInterval(this.pollTimer);

      this.pollTimer = null;

    }

    this.stopMedia();

  }


  /* ===================================================
     POLL
     =================================================== */

  async poll() {

    if (this.isPolling) {
      return;
    }

    this.isPolling = true;

    try {

      const data =
        await this.getState();

      if (
        data &&
        data.success
      ) {

        this.handleState(data);

      }

    } catch (error) {

      console.warn(
        'ASTRA state check failed:',
        error
      );

    } finally {

      this.isPolling = false;

    }

  }


  /* ===================================================
     GET STATE USING JSONP
     =================================================== */

  getState() {

    return new Promise(
      (resolve, reject) => {

        const callbackName =
          'astraCallback_' +
          Date.now() +
          '_' +
          Math.floor(
            Math.random() * 100000
          );

        const script =
          document.createElement('script');

        const timeout =
          setTimeout(
            () => {

              cleanup();

              reject(
                new Error(
                  'ASTRA state request timeout.'
                )
              );

            },
            5000
          );


        function cleanup() {

          clearTimeout(timeout);

          if (script.parentNode) {

            script.remove();

          }

          try {

            delete window[
              callbackName
            ];

          } catch (error) {

            window[
              callbackName
            ] = undefined;

          }

        }


        window[
          callbackName
        ] = (data) => {

          cleanup();

          resolve(data);

        };


        script.onerror =
          () => {

            cleanup();

            // Fallback to fetch if script tag encounters any issue
            fetch(
              ASTRA_API +
              (ASTRA_API.includes('?') ? '&' : '?') +
              'api=state&_t=' +
              Date.now()
            )
              .then((res) => res.json())
              .then((data) => resolve(data))
              .catch((err) => reject(err));

          };


        script.src =
          ASTRA_API +
          (ASTRA_API.includes('?') ? '&' : '?') +
          'api=state' +
          '&callback=' +
          encodeURIComponent(
            callbackName
          ) +
          '&_=' +
          Date.now();


        document.body.appendChild(
          script
        );

      }
    );

  }


  /* ===================================================
     HANDLE CENTRAL STATE
     =================================================== */

  handleState(data) {

    const state =
      String(
        data.state || 'LOCKED'
      );


    /*
     * Ignore old versions.
     */

    if (
      Number(data.version || 0) <
      this.lastVersion
    ) {

      return;

    }


    this.lastVersion =
      Number(
        data.version || 0
      );


    this.currentState =
      state;


    if (this.statusElement) {

      this.statusElement.textContent =
        state;

    }

    if (typeof this.onStateChange === 'function') {

      this.onStateChange(data);

    }


    /* -----------------------------------------------
       LOCKED
       ----------------------------------------------- */

    if (state === 'LOCKED') {

      this.applyLockedState();

      return;

    }


    /* -----------------------------------------------
       UNLOCKED
       ----------------------------------------------- */

    if (state === 'UNLOCKED') {

      this.applyUnlockedState();

      return;

    }


    /* -----------------------------------------------
       PLAYING
       ----------------------------------------------- */

    if (state === 'PLAYING') {

      this.applyPlayingState(
        data
      );

      return;

    }


    /* -----------------------------------------------
       STOPPED
       ----------------------------------------------- */

    if (state === 'STOPPED') {

      this.applyStoppedState();

      return;

    }

  }


  /* ===================================================
     LOCKED
     =================================================== */

  applyLockedState() {

    this.stopMedia();

    this.exitFullscreen();

    this.showLockScreen();

    this.hideVideoPage();

  }


  /* ===================================================
     UNLOCKED
     =================================================== */

  applyUnlockedState() {

    /*
     * Organizer has opened the session.
     *
     * Participant automatically enters video page.
     *
     * Playback does NOT begin yet.
     */

    this.hideLockScreen();

    this.showVideoPage();

    this.stopMedia();

  }


  /* ===================================================
     PLAYING
     =================================================== */

  applyPlayingState(data) {

    this.hideLockScreen();

    this.showVideoPage();

    this.startPlayback(
      data
    );

  }


  /* ===================================================
     STOPPED
     =================================================== */

  applyStoppedState() {

    this.stopMedia();

    this.showVideoPage();

  }


  /* ===================================================
     START PLAYBACK
     =================================================== */

  async startPlayback(data = {}) {

    if (!this.video) {
      return;
    }


    /*
     * Local media.
     */

    this.video.loop =
      true;

    this.video.muted =
      true;

    this.video.playsInline =
      true;


    if (this.audio) {

      this.audio.loop =
        true;

      this.audio.muted =
        false;

    }


    /*
     * Wait until video duration is known.
     */

    if (
      !this.video.duration ||
      !Number.isFinite(
        this.video.duration
      )
    ) {

      await this.waitForVideoMetadata();

    }


    /*
     * Calculate synchronized position.
     */

    const serverNow =
      Number(
        data.serverTime ||
        Date.now()
      );

    const startTime =
      Number(
        data.startTime ||
        0
      );


    if (
      startTime > 0 &&
      this.video.duration > 0
    ) {

      const elapsed =
        Math.max(
          0,
          serverNow - startTime
        ) / 1000;


      const videoDuration =
        this.video.duration;


      this.video.currentTime =
        elapsed %
        videoDuration;


      if (
        this.audio &&
        this.audio.duration &&
        Number.isFinite(
          this.audio.duration
        )
      ) {

        this.audio.currentTime =
          elapsed %
          this.audio.duration;

      }

    }


    /*
     * Start local playback.
     */

    try {

      await this.video.play();

    } catch (error) {

      /*
       * Browser autoplay policy may block
       * audible/video playback.
       */

      console.warn(
        'Video autoplay blocked:',
        error
      );

    }


    if (this.audio) {

      try {

        await this.audio.play();

      } catch (error) {

        console.warn(
          'Audio autoplay blocked (waiting for user interaction):',
          error
        );

        const unlockAudio = () => {

          if (this.audio) {

            this.audio.play().catch(() => {});

          }

          window.removeEventListener('click', unlockAudio);

          window.removeEventListener('touchstart', unlockAudio);

          window.removeEventListener('keydown', unlockAudio);

        };

        window.addEventListener('click', unlockAudio);

        window.addEventListener('touchstart', unlockAudio);

        window.addEventListener('keydown', unlockAudio);

      }

    }


    this.enterFullscreen();

  }


  /* ===================================================
     WAIT VIDEO METADATA
     =================================================== */

  waitForVideoMetadata() {

    return new Promise(
      (resolve) => {

        if (
          this.video.readyState >= 1
        ) {

          resolve();

          return;

        }


        const handler =
          () => {

            this.video.removeEventListener(
              'loadedmetadata',
              handler
            );

            resolve();

          };


        this.video.addEventListener(
          'loadedmetadata',
          handler
        );

      }
    );

  }


  /* ===================================================
     STOP MEDIA
     =================================================== */

  stopMedia() {

    if (this.video) {

      this.video.pause();

      this.video.currentTime =
        0;

    }


    if (this.audio) {

      this.audio.pause();

      this.audio.currentTime =
        0;

    }

  }


  /* ===================================================
     LOCK SCREEN
     =================================================== */

  showLockScreen() {

    if (this.lockScreen) {

      this.lockScreen.style.display =
        'flex';

    }

  }


  hideLockScreen() {

    if (this.lockScreen) {

      this.lockScreen.style.display =
        'none';

    }

  }


  /* ===================================================
     VIDEO PAGE
     =================================================== */

  showVideoPage() {

    if (this.videoPage) {

      this.videoPage.style.display =
        'block';

    }

  }


  hideVideoPage() {

    if (this.videoPage) {

      this.videoPage.style.display =
        'none';

    }

  }


  /* ===================================================
     FULLSCREEN
     =================================================== */

  enterFullscreen() {

    const element =
      document.documentElement;


    if (
      document.fullscreenElement
    ) {

      return;

    }


    try {

      const request =
        element.requestFullscreen ||
        element.webkitRequestFullscreen ||
        element.mozRequestFullScreen ||
        element.msRequestFullscreen;

      if (request) {

        request.call(element)
          .catch(
            () => {}
          );

      }

    } catch (error) {

      console.warn(
        'Fullscreen unavailable:',
        error
      );

    }

  }


  /* ===================================================
     EXIT FULLSCREEN
     =================================================== */

  exitFullscreen() {

    if (
      !document.fullscreenElement
    ) {

      return;

    }


    try {

      const exit =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen;

      if (exit) {

        exit.call(document)
          .catch(
            () => {}
          );

      }

    } catch (error) {

      console.warn(
        'Exit fullscreen failed:',
        error
      );

    }

  }

}

export default AstraController;

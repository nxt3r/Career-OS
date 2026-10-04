import { state } from "../../core/state.js";
import { saveData } from "../../core/storage.js";
import { formatTime } from "../timer/timer.js";
import {
  setAmbientCategory,
  pauseAmbient,
  resumeAmbient,
  setAmbientVolume,
  getCurrentCategory,
  isAmbientPlaying
} from "../../core/ambientAudio.js";

export function isFocusModeOpen() {
  return overlay !== null;
}

export function syncFocusDisplay() {
  if (overlay) render();
}

let overlay = null;
let tickInterval = null;
let lastVolumeValue = 50;
let hasShownHint = false;
let fullscreenChangeHandler = null;

const CATEGORY_COLORS = {
  "Deep Work": "#3B82F6",
  "Study": "#A855F7",
  "Scrolling": "#EF4444",
  "Gaming": "#F97316",
  "Exercise": "#22C55E"
};


let keyHandler = null;


export function enterFocusMode() {

  if (!state.activeTimer) return;

  if (overlay) return;

  overlay = document.createElement("div");
  overlay.id = "focusModeOverlay";
  overlay.className = "focus-overlay";

  document.body.appendChild(overlay);

  render();

  tickInterval = setInterval(updateTimerDisplay, 1000);

    /*
   * Go truly fullscreen via the Fullscreen API so the browser
   * chrome (address bar, tabs, OS taskbar) disappears — a plain
   * fixed overlay only covers the viewport, not the whole screen.
   */

  enterFullscreen();

  /*
   * If the user exits fullscreen via the browser UI (F11, Esc,
   * or toolbar button), the overlay is still on the page, so
   * keep them in sync: treat any fullscreen exit as a request
   * to leave focus mode too.
   */

  fullscreenChangeHandler = () => {

    if (!document.fullscreenElement) {

      exitFocusMode();

    }

  };

  document.addEventListener("fullscreenchange", fullscreenChangeHandler);

  keyHandler = event => {

    if (event.code === "Space") {

      event.preventDefault();
      event.stopImmediatePropagation();

      togglePauseFromFocus();

      return;

    }

    if (event.key === "Escape") {

      exitFocusMode();

    }

  };

  /*
   * capture:true so this runs BEFORE the global
   * Timer-page spacebar handler in keyboard.js,
   * and stopImmediatePropagation above stops that
   * handler from also firing — otherwise both
   * handlers toggle pause independently and drift
   * out of sync with each other.
   */

  document.addEventListener("keydown", keyHandler, true);

}


function updateTimerDisplay() {

  const active = state.activeTimer;

  if (!active) {

    exitFocusMode();
    return;

  }

  const display =
    document.getElementById("focusTimerDisplay");

  if (display) {

    display.textContent =
      formatTime(getElapsed(active));

  }

}


export function exitFocusMode() {

  if (tickInterval) {

    clearInterval(tickInterval);
    tickInterval = null;

  }

  if (keyHandler) {

    document.removeEventListener("keydown", keyHandler, true);
    keyHandler = null;

  }

    if (fullscreenChangeHandler) {

    document.removeEventListener("fullscreenchange", fullscreenChangeHandler);
    fullscreenChangeHandler = null;

  }

  exitFullscreen();

  if (overlay) {

    overlay.remove();
    overlay = null;

  }

}


function enterFullscreen() {

  const root = document.documentElement;

  const request =
    root.requestFullscreen ||
    root.webkitRequestFullscreen ||
    root.mozRequestFullScreen ||
    root.msRequestFullscreen;

  if (request) {

    request.call(root).catch(() => {

      /* fullscreen may be blocked by permissions policy; the
         fixed overlay still dims the browser chrome visually */

    });

  }

}


function exitFullscreen() {

  const exit =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.mozCancelFullScreen ||
    document.msExitFullscreen;

  if (exit && document.fullscreenElement) {

    exit.call(document).catch(() => {});

  }

}


function togglePauseFromFocus() {

  const active = state.activeTimer;

  if (!active) return;

  if (active.status === "running") {

    active.elapsedBeforeStart = getElapsed(active);
    active.status = "paused";
    active.startedAt = null;

    pauseAmbient();

  } else {

    active.status = "running";
    active.startedAt = Date.now();

    resumeAmbient();

  }

  saveData(state);
  syncTimerPage();

  render();

  syncTimerPage();

}


function render() {

  if (!overlay) return;

  const active = state.activeTimer;

  if (!active) {

    exitFocusMode();
    return;

  }

  const color =
    CATEGORY_COLORS[active.category] || getHashColor(active.category);

  overlay.style.setProperty("--focus-color", color);

  const sparkles =
    Array.from({ length: 18 })
      .map(() => {

        const left = Math.random() * 100;
        const size = 2 + Math.random() * 4;
        const duration = 6 + Math.random() * 8;
        const delay = Math.random() * 10;
        const drift = (Math.random() * 60 - 30).toFixed(0);
        const opacity = (0.3 + Math.random() * 0.5).toFixed(2);

        return `
          <div class="focus-sparkle" style="
            left:${left}%;
            width:${size}px;
            height:${size}px;
            animation-duration:${duration}s;
            animation-delay:${delay}s;
            --sparkle-drift:${drift}px;
            --sparkle-opacity:${opacity};
          "></div>
        `;

      })
      .join("");

  overlay.innerHTML = `

    ${sparkles}

    <div class="focus-hover-zone">
      <button id="exitFocusBtn" class="focus-exit">
        ✕ Exit Focus Mode
      </button>
    </div>

    ${
      !hasShownHint
        ? `
          <div class="focus-hint" id="focusHint">
            Press <strong>Esc</strong> or hover the top of the screen to exit
          </div>
        `
        : ""
    }

    <div class="focus-content">

      <p class="focus-category">${escapeHTML(active.category)}</p>

      <h1 class="focus-timer" id="focusTimerDisplay">${formatTime(getElapsed(active))}</h1>

      ${
        active.project || active.activity
          ? `
            <p class="focus-subtitle">
              ${active.project ? escapeHTML(active.project) : ""}
              ${active.project && active.activity ? " · " : ""}
              ${active.activity ? escapeHTML(active.activity) : ""}
            </p>
          `
          : ""
      }

      <div class="focus-controls">

        <button id="focusPauseBtn" class="focus-control-btn">
          ${active.status === "paused" ? "▶ Resume" : "⏸ Pause"}
        </button>

        <button id="focusStopBtn" class="focus-control-btn focus-stop-btn">
          ■ Stop
        </button>

      </div>

      <div class="focus-audio-panel">

        <div class="focus-audio-row">

          <button
            class="focus-audio-option ${getCurrentCategory() === "silence" ? "active" : ""}"
            data-audio="silence"
          >
            Silence
          </button>

          <button
            class="focus-audio-option ${getCurrentCategory() === "lofi" ? "active" : ""}"
            data-audio="lofi"
          >
            Lo-fi
          </button>

          <button
            class="focus-audio-option ${getCurrentCategory() === "whitenoise" ? "active" : ""}"
            data-audio="whitenoise"
          >
            White Noise
          </button>

        </div>

      <div class="focus-volume-row">

          <span>🔈</span>

          <input
            type="range"
            id="focusVolumeSlider"
            min="0"
            max="100"
            value="${lastVolumeValue}"
          >

          <span>🔊</span>

        </div>

      </div>

    </div>

  `;

  attachEvents(active);

}


function attachEvents(active) {

  document.getElementById("exitFocusBtn")
    .addEventListener("click", exitFocusMode);

  const hint =
    document.getElementById("focusHint");

  if (hint) {

    hasShownHint = true;

    setTimeout(() => {

      hint.classList.add("focus-hint-fade");

    }, 3500);

  }

  document.getElementById("focusPauseBtn")
    .addEventListener("click", togglePauseFromFocus);

  document.getElementById("focusStopBtn")
    .addEventListener("click", () => {

      const endTime = Date.now();
      const duration = getElapsed(active);

      state.sessions.unshift({
        category: active.category,
        projectId: active.projectId,
        project: active.project,
        skillId: active.skillId ?? null,
        skill: active.skill ?? null,
        activity: active.activity,
        start: active.originalStart,
        end: endTime,
        duration: duration
      });

      state.activeTimer = null;

      saveData(state);
      syncTimerPage();

      exitFocusMode();

      /*
       * If the Timer page is the one underneath,
       * re-render it so it reflects the stopped state
       * instead of showing stale "running" UI.
       */

      import("../../core/router.js").then(({ loadRoute }) => {

        if (window.location.hash === "#timer") {

          loadRoute();

        }

      });

    });

  document.querySelectorAll(".focus-audio-option").forEach(button => {

    button.addEventListener("click", () => {

      setAmbientCategory(button.dataset.audio);

      document.querySelectorAll(".focus-audio-option")
        .forEach(b => b.classList.toggle("active", b === button));

    });

  });

  const volumeSlider =
    document.getElementById("focusVolumeSlider");

  volumeSlider.addEventListener("input", () => {

    lastVolumeValue = volumeSlider.value;

    setAmbientVolume(volumeSlider.value / 100);

  });

}


function getElapsed(active) {

  if (active.status === "paused") {
    return active.elapsedBeforeStart || 0;
  }

  return (active.elapsedBeforeStart || 0) + (Date.now() - active.startedAt);

}


function getHashColor(name) {

  let hash = 0;

  for (let i = 0; i < name.length; i++) {

    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;

  }

  return `hsl(${Math.abs(hash) % 360}, 70%, 55%)`;

}


function escapeHTML(value) {

  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

function syncTimerPage() {

  if (window.location.hash === "#timer") {

    import("../../core/router.js").then(({ loadRoute }) => loadRoute());

  }

}
import { state } from "../../core/state.js";
import { saveData } from "../../core/storage.js";
import { goTo } from "../../core/router.js";


/*
 * Only brand-new / empty accounts see the tour automatically.
 * Existing users with data are never interrupted.
 */

export function shouldShowOnboarding() {

  if (state.settings?.onboardingDone === true) return false;

  const hasData =
    state.projects?.length > 0 ||
    state.skills?.length > 0 ||
    state.careerGoals?.length > 0 ||
    state.sessions?.length > 0;

  return !hasData;

}


function markDone() {

  if (!state.settings || state.settings.onboardingDone === true) return;

  state.settings.onboardingDone = true;

  saveData(state);

}


/* =========================================================
   TOUR STEPS — edit text / targets here

   page:   which page to show (hash route name)
   target: CSS selector of the element to light up
           (null = centered card, nothing highlighted;
            if the element isn't found the card is centered too)
   side:   preferred side for the card (right/left/top/bottom)
   ========================================================= */

const STEPS = [

  {
    page: "dashboard",
    target: null,
    icon: "👋",
    title: "Welcome to Career OS",
    text: "A quick tour of the app: we'll visit each page and show you what it's for. Use the buttons or the ← → keys. Press Esc to skip."
  },

  {
    page: "dashboard",
    target: "#sidebar",
    side: "right",
    icon: "🧭",
    title: "Your navigation",
    text: "Every page lives here. You can also press 1–8 on your keyboard to jump between them from anywhere."
  },

  {
    page: "dashboard",
    target: '[data-page="dashboard"]',
    side: "right",
    icon: "📊",
    title: "Dashboard",
    text: "Your weekly focus progress, distraction alerts, top projects and your quick-capture inbox. Press Ctrl+Q anywhere to jot a thought down."
  },

  {
    page: "timer",
    target: ".timer-setup-card",
    side: "bottom",
    icon: "⏱️",
    title: "Time OS",
    text: "Pick a category, optionally link a project and a skill, then press Start. Focus time counts toward your weekly target, Distraction time counts against your limit. Press F while a timer runs for fullscreen Focus Mode with lo-fi or white noise."
  },

  {
    page: "projects",
    target: "#addProjectBtn",
    side: "bottom",
    icon: "📁",
    title: "Projects",
    text: "Plan work with milestones and tasks. Progress is worked out from the milestones you complete, and you can archive finished projects."
  },

  {
    page: "skills",
    target: '[data-page="skills"]',
    side: "right",
    icon: "🧩",
    title: "Skills",
    text: "Five levels per skill. Each level has capabilities you prove with evidence like links, files and achievements. Skills you stop practising glow yellow, then red."
  },

  {
    page: "career",
    target: '[data-page="career"]',
    side: "right",
    icon: "🧭",
    title: "Career goals",
    text: "Set a goal, follow its roadmap, and watch your readiness rise as your linked skills level up."
  },

  {
    page: "reviews",
    target: '[data-page="reviews"]',
    side: "right",
    icon: "📈",
    title: "Reviews",
    text: "Charts of where your time went: by category, project and skill, compared with the previous period."
  },

  {
    page: "rankings",
    target: '[data-page="rankings"]',
    side: "right",
    icon: "🏆",
    title: "Rankings",
    text: "Weekly and monthly leaderboards. Your name and avatar are visible by default. Switch on Anonymous on this page to hide them (your totals still count)."
  },

  {
    page: "settings",
    target: "#editWeeklyTarget",
    side: "bottom",
    icon: "🎯",
    title: "Set your weekly target",
    text: "How many hours of focused work do you want each week? You can change it any time here in Settings.",
    extra: `
      <div class="tour-field">
        <label for="tourTarget">Hours per week</label>
        <input type="text" id="tourTarget" inputmode="decimal">
      </div>
    `,
    onShow() {

      const input = document.getElementById("tourTarget");

      input.value = state.settings.weeklyTarget;

    },
    onNext(showError) {

      const parsed =
        Number(document.getElementById("tourTarget").value.trim());

      if (!Number.isFinite(parsed) || parsed <= 0) {

        showError("Enter a positive number of hours.");

        return false;

      }

      state.settings.weeklyTarget = parsed;

      saveData(state);

    }
  },

  {
    page: "settings",
    target: null,
    icon: "🚀",
    title: "You're all set",
    text: "Space pauses the timer, F opens Focus Mode, Ctrl+Q captures a thought, and 1–8 switch pages. You can replay this tour any time from Settings."
  }

];


/* =========================================================
   HELPERS
   ========================================================= */

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), max);


function waitForElement(selector, timeout = 1800) {

  return new Promise(resolve => {

    if (!selector) {
      resolve(null);
      return;
    }

    const start = Date.now();

    const check = () => {

      const el = document.querySelector(selector);

      if (el) {

        const rect = el.getBoundingClientRect();

        if (rect.width > 0 && rect.height > 0) {
          resolve(el);
          return;
        }

      }

      if (Date.now() - start > timeout) {
        resolve(null);
        return;
      }

      setTimeout(check, 60);

    };

    check();

  });

}


/* =========================================================
   TOUR
   ========================================================= */

export function startOnboarding({ replay = false } = {}) {

  if (document.getElementById("tourRoot")) return;

  const startHash = window.location.hash || "#dashboard";

  let index = 0;
  let target = null;
  let busy = false;
  let ended = false;

  const root = document.createElement("div");
  root.id = "tourRoot";
  root.className = "tour-root";

  root.innerHTML = `
    <div class="tour-blocker"></div>
    <div class="tour-spotlight tour-spot-empty" id="tourSpotlight"></div>
    <div class="tour-card" id="tourCard" role="dialog" aria-live="polite">
      <span class="tour-arrow" id="tourArrow"></span>
      <div class="tour-progress">
        <div class="tour-progress-fill" id="tourProgressFill"></div>
      </div>
      <div id="tourContent"></div>
    </div>
  `;

  document.body.appendChild(root);

  const spot = document.getElementById("tourSpotlight");
  const card = document.getElementById("tourCard");
  const arrow = document.getElementById("tourArrow");
  const content = document.getElementById("tourContent");
  const progressFill = document.getElementById("tourProgressFill");


  /* ---------- content ---------- */

  function showError(message) {

    const box = document.getElementById("tourError");

    if (!box) return;

    box.textContent = message;

    box.classList.remove("tour-shake");
    void box.offsetWidth;
    box.classList.add("tour-shake");

  }

  function renderContent() {

    const step = STEPS[index];

    const isLast = index === STEPS.length - 1;

    content.innerHTML = `

      <div class="tour-icon">${step.icon}</div>

      <h3 class="tour-title">${step.title}</h3>

      <p class="tour-text">${step.text}</p>

      ${step.extra || ""}

      <div id="tourError" class="tour-error"></div>

      <div class="tour-footer">

        <span class="tour-count">${index + 1} / ${STEPS.length}</span>

        <span class="tour-spacer"></span>

        ${isLast ? "" : `<button class="modal-cancel tour-btn" id="tourSkip">Skip</button>`}

        ${index > 0 ? `<button class="modal-cancel tour-btn" id="tourBack">Back</button>` : ""}

        <button class="modal-save tour-btn" id="tourNext">
          ${isLast ? (replay ? "Done" : "Get started") : "Next"}
        </button>

      </div>

    `;

    progressFill.style.width =
      `${((index + 1) / STEPS.length) * 100}%`;

    document.getElementById("tourSkip")
      ?.addEventListener("click", () => end(false));

    document.getElementById("tourBack")
      ?.addEventListener("click", back);

    document.getElementById("tourNext")
      .addEventListener("click", next);

    step.onShow?.();

  }


  /* ---------- positioning ---------- */

  function positionAll() {

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const cw = card.offsetWidth;
    const ch = card.offsetHeight;

    arrow.className = "tour-arrow";
    arrow.style.cssText = "";

    if (!target || !document.body.contains(target)) {

      spot.classList.add("tour-spot-empty");

      spot.style.top = `${vh / 2}px`;
      spot.style.left = `${vw / 2}px`;
      spot.style.width = "0px";
      spot.style.height = "0px";

      card.style.left = `${Math.max(12, (vw - cw) / 2)}px`;
      card.style.top = `${Math.max(12, (vh - ch) / 2)}px`;

      arrow.style.display = "none";

      return;

    }

    const pad = 8;
    const gap = 18;
    const margin = 12;

    const rect = target.getBoundingClientRect();

    spot.classList.remove("tour-spot-empty");

    spot.style.top = `${rect.top - pad}px`;
    spot.style.left = `${rect.left - pad}px`;
    spot.style.width = `${rect.width + pad * 2}px`;
    spot.style.height = `${rect.height + pad * 2}px`;

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const options = {
      right:  { left: rect.right + pad + gap,        top: cy - ch / 2 },
      left:   { left: rect.left - pad - gap - cw,    top: cy - ch / 2 },
      bottom: { left: cx - cw / 2,                   top: rect.bottom + pad + gap },
      top:    { left: cx - cw / 2,                   top: rect.top - pad - gap - ch }
    };

    const preferred = STEPS[index].side || "bottom";

    const order = [preferred, "right", "bottom", "left", "top"]
      .filter((side, i, list) => list.indexOf(side) === i);

    for (const side of order) {

      const wanted = options[side];

      const left = clamp(wanted.left, margin, vw - cw - margin);
      const top = clamp(wanted.top, margin, vh - ch - margin);

      /* the side facing the target must not be pushed around */
      const fits =
        side === "right" || side === "left"
          ? Math.abs(left - wanted.left) < 1
          : Math.abs(top - wanted.top) < 1;

      if (!fits) continue;

      card.style.left = `${left}px`;
      card.style.top = `${top}px`;

      if (side === "right") {

        arrow.classList.add("tour-arrow-left");
        arrow.style.top = `${clamp(cy - top, 22, ch - 22)}px`;

      } else if (side === "left") {

        arrow.classList.add("tour-arrow-right");
        arrow.style.top = `${clamp(cy - top, 22, ch - 22)}px`;

      } else if (side === "bottom") {

        arrow.classList.add("tour-arrow-top");
        arrow.style.left = `${clamp(cx - left, 22, cw - 22)}px`;

      } else {

        arrow.classList.add("tour-arrow-bottom");
        arrow.style.left = `${clamp(cx - left, 22, cw - 22)}px`;

      }

      return;

    }

    /* nothing fits (e.g. a huge target): dock at the bottom, no arrow */
    card.style.left = `${Math.max(12, (vw - cw) / 2)}px`;
    card.style.top = `${Math.max(12, vh - ch - 24)}px`;

    arrow.style.display = "none";

  }

  let reflowQueued = false;

  function onReflow() {

    if (busy || reflowQueued) return;

    reflowQueued = true;

    requestAnimationFrame(() => {

      reflowQueued = false;

      if (!ended) positionAll();

    });

  }


  /* ---------- moving between steps ---------- */

  async function enterStep(newIndex, direction, first = false) {

    busy = true;

    if (!first) {

      card.classList.remove("tour-in-from-right", "tour-in-from-left");

      card.classList.add(direction > 0 ? "tour-out-left" : "tour-out-right");

      await sleep(190);

    }

    index = newIndex;

    const step = STEPS[index];

    /* swap to the real page */

    const wantedHash = `#${step.page}`;

    if (window.location.hash !== wantedHash) {

      goTo(step.page);

      await sleep(350);

    }

    target = await waitForElement(step.target);

    if (target) {

      const rect = target.getBoundingClientRect();

      if (rect.top < 0 || rect.bottom > window.innerHeight) {

        target.scrollIntoView({ block: "center" });

        await sleep(80);

      }

    }

    if (ended) return;

    renderContent();

    if (first) root.classList.add("tour-instant");

    positionAll();

    if (first) {

      void root.offsetWidth;

      root.classList.remove("tour-instant");

    }

    card.classList.remove("tour-out-left", "tour-out-right");

    void card.offsetWidth;

    card.classList.add(direction > 0 ? "tour-in-from-right" : "tour-in-from-left");

    busy = false;

    if (step.target === null || !target) {

      document.getElementById("tourNext")?.focus();

    }

    document.getElementById("tourTarget")?.focus();

  }

  function next() {

    if (busy) return;

    const step = STEPS[index];

    if (step.onNext && step.onNext(showError) === false) return;

    if (index === STEPS.length - 1) {

      end(true);

      return;

    }

    enterStep(index + 1, 1);

  }

  function back() {

    if (busy || index === 0) return;

    enterStep(index - 1, -1);

  }

  function end(finished) {

    if (ended) return;

    ended = true;

    markDone();

    document.removeEventListener("keydown", onKey, true);
    window.removeEventListener("resize", onReflow);
    window.removeEventListener("scroll", onReflow, true);

    root.classList.remove("tour-visible");

    setTimeout(() => root.remove(), 400);

    if (finished && !replay) {

      goTo("timer");

    } else if (window.location.hash !== startHash) {

      window.location.hash = startHash;

    }

  }


  /* ---------- keyboard ---------- */

  function onKey(event) {

    if (ended) return;

    const tag = event.target?.tagName;

    const inInput = tag === "INPUT";

    if (event.key === "Escape") {

      event.preventDefault();
      event.stopImmediatePropagation();

      end(false);

      return;

    }

    if (event.key === "Enter" && tag !== "BUTTON") {

      event.preventDefault();
      event.stopImmediatePropagation();

      next();

      return;

    }

    if (!inInput && event.key === "ArrowRight") {

      event.preventDefault();
      event.stopImmediatePropagation();

      next();

      return;

    }

    if (!inInput && event.key === "ArrowLeft") {

      event.preventDefault();
      event.stopImmediatePropagation();

      back();

      return;

    }

    /* keep app shortcuts (1–8, Space, F, Ctrl+Q) quiet during the tour */
    if (!inInput) event.stopImmediatePropagation();

  }

  document.addEventListener("keydown", onKey, true);
  window.addEventListener("resize", onReflow);
  window.addEventListener("scroll", onReflow, true);


  /* ---------- go ---------- */

  requestAnimationFrame(() => root.classList.add("tour-visible"));

  enterStep(0, 1, true);

}
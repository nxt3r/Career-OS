import { state } from "../../core/state.js";
import { saveData } from "../../core/storage.js";
import { pauseAmbient, resumeAmbient } from "../../core/ambientAudio.js";
import { getDisplayStatus } from "../skills/skills.js";
import { renderLinkChip, attachLinkChipEvents } from "../../core/linkChip.js";

let timer = null;
let timerApp = null;
let selectedCategory = null;

const timerControls = {
  start: null,
  pauseResume: null,
  stop: null
};


/*
 * KEYBOARD / EXTERNAL CONTROLS
 */

export function startTimer() {
  timerControls.start?.();
}

export function togglePause() {
  timerControls.pauseResume?.();
}

export function stopTimer() {
  timerControls.stop?.();
}


/*
 * RENDER TIMER
 */

export function renderTimer(app) {

  timerApp = app;

  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  const active = state.activeTimer;

  selectedCategory =
    active?.category ||
    selectedCategory ||
    state.categories[0]?.name ||
    null;

  const projectOptions = state.projects
    .filter(project => !project.archived && project.status === "Active" || project.status === "Planning")
    .map(
      project => `
        <option value="${project.id}">
          ${escapeHTML(project.name)}
        </option>
      `
    )
    .join("");

  const skillOptions = state.skills
    .filter(skill => getDisplayStatus(skill) === "Active")
    .map(
      skill => `
        <option value="${skill.id}">
          ${escapeHTML(skill.name)}
        </option>
      `
    )
    .join("");

  const categoryPills = state.categories
    .map(category => `
      <button
        class="category-pill ${selectedCategory === category.name ? "active" : ""}"
        data-category="${escapeHTML(category.name)}"
        style="--pill-color:${getCategoryColor(category)}"
        ${active ? "disabled" : ""}
      >
        ${escapeHTML(category.name)}
      </button>
    `)
    .join("");

  const activeCategoryColor =
    active ? getCategoryColor(findCategory(active.category)) : "var(--accent)";

  app.innerHTML = `
    <section class="timer-page">

      <h2>Time OS</h2>

      <div class="card timer-setup-card ${active ? "timer-running" : ""}" style="--active-color:${activeCategoryColor}">

        <div class="timer-display-wrap">
          <h1 id="timerDisplay" class="timer-digits">
            ${formatTime(getElapsed())}
          </h1>
          ${
            active
              ? `<p class="timer-active-label">${escapeHTML(active.category)}${active.project ? ` · ${escapeHTML(active.project)}` : ""}</p>`
              : `<p class="timer-idle-label">Ready when you are</p>`
          }
        </div>

        ${
          !active
            ? `
              <div class="timer-setup-fields">

                <label>Category</label>
                <div class="category-pill-row">
                  ${categoryPills}
                </div>

                <div class="timer-field-grid">

                  <div>
                    <label>Project</label>
                    <select id="project">
                      <option value="">No Project</option>
                      ${projectOptions}
                    </select>
                  </div>

                  <div>
                    <label>Skill</label>
                    <select id="skill">
                      <option value="">No Skill</option>
                      ${skillOptions}
                    </select>
                  </div>

                </div>

                <label>Activity</label>
                <input
                  id="activity"
                  placeholder="What are you building?"
                >

              </div>

              <button id="startBtn" class="timer-start-btn">
                ▶ Start Session
              </button>
            `
            : `
              <div class="timer-running-controls">

                <button id="pauseBtn" class="timer-control-btn">
                  ${active.status === "paused" ? "▶ Resume" : "⏸ Pause"}
                </button>

                <button id="stopBtn" class="timer-control-btn timer-stop-btn">
                  ■ Stop
                </button>

                <button id="focusModeBtn" class="timer-control-btn timer-focus-btn">
                  ⛶ Focus Mode
                </button>

              </div>
            `
        }

      </div>

      <div class="card">
        <h3>Today's Sessions</h3>
        <div id="sessionList"></div>
      </div>

    </section>
  `;

  const projectSelect = document.getElementById("project");
  const skillSelect = document.getElementById("skill");
  const activityInput = document.getElementById("activity");

  if (!active) {

    updateCategoryUI();

    document.querySelectorAll(".category-pill").forEach(pill => {

      pill.addEventListener("click", () => {

        selectedCategory = pill.dataset.category;

        document.querySelectorAll(".category-pill")
          .forEach(p => p.classList.toggle("active", p === pill));

        updateCategoryUI();

      });

    });

    activityInput?.addEventListener("keydown", event => {

      if (event.key === "Enter" && !state.activeTimer) {

        event.preventDefault();
        timerControls.start();

      }

    });

  }

  function updateCategoryUI() {

    const category = findCategory(selectedCategory);

    const linksAllowed =
      category?.group === "Focus";

    if (projectSelect) {

      if (!linksAllowed) {
        projectSelect.value = "";
        projectSelect.disabled = true;
      } else {
        projectSelect.disabled = false;
      }

    }

    if (skillSelect) {

      if (!linksAllowed) {
        skillSelect.value = "";
        skillSelect.disabled = true;
      } else {
        skillSelect.disabled = false;
      }

    }

    if (activityInput) {

      const placeholders = {
        "Deep Work": "What are you building?",
        "Study": "What subject are you studying?",
        "Scrolling": "Which app were you on?",
        "Gaming": "What game are you playing?",
        "Exercise": "What workout are you doing?"
      };

      activityInput.placeholder =
        placeholders[selectedCategory] || "What are you doing?";

    }

  }

  renderSessions();


  /*
   * START
   */

  timerControls.start = () => {

    if (state.activeTimer) return;

    const category = selectedCategory;

    const categoryObj = findCategory(category);

    const isDistraction =
      categoryObj?.group === "Distraction";

    let selectedProject = null;

    if (!isDistraction && projectSelect?.value) {

      selectedProject = state.projects.find(
        project => project.id === projectSelect.value
      );

    }

    let selectedSkill = null;

    if (!isDistraction && skillSelect?.value) {

      selectedSkill = state.skills.find(
        skill => skill.id === skillSelect.value
      );

    }

    const now = Date.now();

    state.activeTimer = {

      status: "running",
      startedAt: now,
      originalStart: now,
      elapsedBeforeStart: 0,
      category,
      projectId: selectedProject?.id ?? null,
      project: selectedProject?.name ?? null,
      skillId: selectedSkill?.id ?? null,
      skill: selectedSkill?.name ?? null,
      activity: activityInput?.value.trim() || "Untitled"

    };

    saveData(state);

    renderTimer(timerApp);

  };


  /*
   * PAUSE / RESUME
   */

  timerControls.pauseResume = () => {

    const activeTimer = state.activeTimer;

    if (!activeTimer) return;

    if (activeTimer.status === "running") {

      activeTimer.elapsedBeforeStart = getElapsed();
      activeTimer.status = "paused";
      activeTimer.startedAt = null;

      pauseAmbient();

    } else {

      activeTimer.status = "running";
      activeTimer.startedAt = Date.now();

      resumeAmbient();

    }

    saveData(state);

    renderTimer(timerApp);

    import("../focus/focusMode.js").then(({ isFocusModeOpen, syncFocusDisplay }) => {

      if (isFocusModeOpen()) syncFocusDisplay();

    });

  };


  /*
   * STOP
   */

  timerControls.stop = () => {

    const activeTimer = state.activeTimer;

    if (!activeTimer) return;

    const endTime = Date.now();
    const duration = getElapsed();

    const session = {
      category: activeTimer.category,
      projectId: activeTimer.projectId,
      project: activeTimer.project,
      skillId: activeTimer.skillId ?? null,
      skill: activeTimer.skill ?? null,
      activity: activeTimer.activity,
      start: activeTimer.originalStart,
      end: endTime,
      duration: duration
    };

    state.sessions.unshift(session);

    state.activeTimer = null;

    saveData(state);

    renderTimer(timerApp);

  };


  const startBtn = document.getElementById("startBtn");
  if (startBtn) startBtn.addEventListener("click", timerControls.start);

  const pauseBtn = document.getElementById("pauseBtn");
  if (pauseBtn) pauseBtn.addEventListener("click", timerControls.pauseResume);

  const stopBtn = document.getElementById("stopBtn");
  if (stopBtn) stopBtn.addEventListener("click", timerControls.stop);

  const focusModeBtn = document.getElementById("focusModeBtn");
  if (focusModeBtn) {

    focusModeBtn.addEventListener("click", async () => {

      const { enterFocusMode } = await import("../focus/focusMode.js");

      enterFocusMode();

    });

  }


  /*
   * RUNNING TIMER LOOP
   */

  if (state.activeTimer && state.activeTimer.status === "running") {

    timer = setInterval(() => {

      const display = document.getElementById("timerDisplay");

      if (!display) return;

      display.textContent = formatTime(getElapsed());

    }, 1000);

  }

}


/*
 * HELPERS
 */

function findCategory(name) {

  return state.categories.find(c => c.name === name);

}


function getCategoryColor(category) {

  if (!category) return "#64748B";

  const builtIn = {
    "Deep Work": "#3B82F6",
    "Study": "#A855F7",
    "Scrolling": "#EF4444",
    "Gaming": "#F97316",
    "Exercise": "#22C55E"
  };

  if (builtIn[category.name]) return builtIn[category.name];

  let hash = 0;

  for (let i = 0; i < category.name.length; i++) {

    hash = category.name.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;

  }

  return `hsl(${Math.abs(hash) % 360}, 70%, 55%)`;

}


function getElapsed() {

  const active = state.activeTimer;

  if (!active) return 0;

  if (active.status === "paused") {
    return active.elapsedBeforeStart || 0;
  }

  return (active.elapsedBeforeStart || 0) + (Date.now() - active.startedAt);

}


export function formatTime(ms) {

  const total = Math.floor(ms / 1000);

  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");

  return `${h}:${m}:${s}`;

}


function renderSessions() {

  const list = document.getElementById("sessionList");

  if (!list) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySessions = state.sessions.filter(session => {

    const sessionDate = new Date(session.start);
    sessionDate.setHours(0, 0, 0, 0);

    return sessionDate.getTime() === today.getTime();

  });

  if (todaySessions.length === 0) {

    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">⏱️</span>
        <p>No sessions today.</p>
      </div>
    `;

    return;

  }

  list.innerHTML = todaySessions
    .map(session => {

      const color = getCategoryColor(findCategory(session.category));

      const categoryObj = findCategory(session.category);
      const isLinked = categoryObj?.group === "Focus";

      const projectLabel =
        session.projectId
          ? renderLinkChip("project", session.projectId, session.project)
          : isLinked
            ? `<span class="session-unlinked">No Project</span>`
            : "";

      const skillLabel =
        session.skillId
          ? renderLinkChip("skill", session.skillId, session.skill)
          : isLinked
            ? `<span class="session-unlinked">No Skill</span>`
          : "";

      return `
        <div class="session-row">
          <span class="session-dot" style="background:${color}"></span>
          <div class="session-info">
            <strong>${projectLabel || escapeHTML(session.category)}</strong>
            <small>${skillLabel} ${escapeHTML(session.activity)}</small>
          </div>
          <span class="session-duration">${formatDuration(session.duration)}</span>
        </div>
      `;

    })
    .join("");

  attachLinkChipEvents(list);

}


function formatDuration(ms) {

  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;

}


function escapeHTML(text) {

  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;

}
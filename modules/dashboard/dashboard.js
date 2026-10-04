import { state } from "../../core/state.js";
import {
  getWeekSessions,
  hoursByCategory,
  totalHours
} from "../../core/utils.js";
import { saveData } from "../../core/storage.js";
import { renderLinkChip, attachLinkChipEvents } from "../../core/linkChip.js";
import { openModal, closeModal } from "../../core/modal.js";
import {
  getTodayDistractionHours,
  getActiveProjects,
  getTotalNeutralHours,
  getWeeklyFocusHours,
  formatHours
} from "./analytics.js";

export function renderDashboard(app) {

  const week = getWeekSessions(state.sessions, state);

  const deep = hoursByCategory(week, "Deep Work");
  const weeklyTracked = totalHours(week);

  const deepGoal = state.settings.weeklyTarget;

  const deepPercent = Math.min((deep / deepGoal) * 100, 100);

  const weeklyDistraction = hoursByCategory(week, "Scrolling");

const distractionLimit = state.settings.distractionLimit;

const distractionPercent = Math.min(
  (weeklyDistraction / distractionLimit) * 100,
  100
);

const rawDistractionPercent =
  (weeklyDistraction / distractionLimit) * 100;

const distractionGlowClass =
  rawDistractionPercent >= 100
    ? "glow-danger-max"
    : rawDistractionPercent >= 90
      ? "glow-danger-high"
      : rawDistractionPercent >= 80
        ? "glow-danger-low"
        : "";

const showDangerIcon =
  rawDistractionPercent >= 100;

  const projectMap = {};

week.forEach(session => {

  if (!session.projectId) return;

  projectMap[session.projectId] =
    (projectMap[session.projectId] || 0) +
    session.duration;

});

const projects = Object.entries(projectMap)
  .map(([id, time]) => {

    const project = state.projects.find(
      p => p.id === id
    );

    return {
      name: project?.name || "Unknown",
      time
    };

  })
  .sort((a, b) => b.time - a.time)
  .slice(0, 3);;

  const weeklyDeep =
  getWeeklyFocusHours();

const weeklyGoal =
  state.settings.weeklyTarget;

const weeklyPercent =
  Math.min(
    (weeklyDeep/weeklyGoal)*100,
    100
  );

const rawWeeklyPercent =
  (weeklyDeep/weeklyGoal)*100;

const focusGlowClass =
  rawWeeklyPercent >= 100
    ? "glow-success"
    : rawWeeklyPercent >= 80
      ? "glow-approaching-success"
      : "";

const neutralTime =
  formatHours(getTotalNeutralHours());

const activeProjects =
  getActiveProjects();

const distraction =
  formatHours(getTodayDistractionHours());

const tracked = formatHours(weeklyTracked);

  app.innerHTML = `
<section>

  <h2>Dashboard</h2>

  <!-- HERO CARD -->

  <div class="card hero-card ${focusGlowClass}">

        <p class="hero-label">
      WEEKLY FOCUS TIME
    </p>
    <h1>
      ${weeklyDeep.toFixed(1)}h
      <span>/ ${weeklyGoal}h</span>
    </h1>

    <div class="progress hero-progress">
      <div
        class="fill blue"
        style="width:${weeklyPercent}%"
      ></div>
    </div>

    <small>
      ${weeklyPercent.toFixed(0)}% of your weekly goal completed
    </small>

  </div>


  <!-- STATS -->

  <div class="grid">

    <div class="card stat-card ${distractionGlowClass}">
      <p>Distraction Time ${showDangerIcon ? '<span class="danger-icon">⚠️</span>' : ""}</p>
      <h2>${distraction}</h2>
    </div>

    <div class="card stat-card">
      <p>Neutral Time</p>
      <h2>${neutralTime}</h2>
    </div>

    <div class="card stat-card">
      <p>Active Projects</p>
      <h2>${activeProjects}</h2>
      <small>Currently active</small>
    </div>

    <div class="card stat-card">
      <p>Total Tracked</p>
      <h2>${tracked}</h2>
      <small>This week</small>
    </div>

  </div>


  <!-- BOTTOM GRID -->

  <div class="grid">

    <div class="card">

      <h3>Top Projects</h3>

      ${
        projects.length === 0
          ? `<div class="empty-state"><span class="empty-state-icon">⏱️</span><p>No project sessions yet.</p></div>`
          : projects.map(project => `
              <p>
                ${renderLinkChip("project", project.id, project.name)}<br>
                ${(project.time / 3600000).toFixed(1)}h
              </p>
            `).join("")
      }

    </div>


    <div class="card">

      <h3>Inbox</h3>

      <input
        id="quickCapture"
        placeholder="What's on your mind?"
      >

      <select id="captureProject">

        <option value="">
          No project
        </option>

        ${
          state.projects
            .filter(project => !project.archived)
            .map(project => `
              <option value="${project.id}">
                ${project.name}
              </option>
            `)
            .join("")
        }

      </select>

      <button id="saveIdea">
        Capture
      </button>

      <div id="captureList"></div>

    </div>

  </div>

</section>
`;

  renderCaptures();

  document
    .getElementById("saveIdea")
    .addEventListener("click", saveCapture);

  document
    .getElementById("quickCapture")
    .addEventListener("keydown", event => {

      if (event.key === "Enter") {
        saveCapture();
      }

    });

  attachLinkChipEvents(app);

}

function saveCapture() {

  const input = document.getElementById("quickCapture");

  const projectSelect =
    document.getElementById("captureProject");

  const text = input.value.trim();

  if (!text) return;

  const projectId =
  projectSelect.value || null;

  state.captures.unshift({

    id: Date.now(),

    text,

    projectId,

    createdAt: Date.now()

  });

  saveData(state);

  input.value = "";

  projectSelect.value = "";

  renderCaptures();

}

function renderCaptures() {

  const list =
    document.getElementById("captureList");

  if (!list) return;

  if (state.captures.length === 0) {

    list.innerHTML =
      `<p class="inbox-empty">Inbox is empty.</p>`;

    return;

  }

  list.innerHTML =
    state.captures
      .slice(0, 5)
      .map(capture => renderCaptureRow(capture))
      .join("") +
    (
      state.captures.length > 5
        ? `<button id="viewAllCapturesBtn" class="inbox-view-all">View all ${state.captures.length} →</button>`
        : ""
    );

  attachLinkChipEvents(list);

  const viewAllBtn =
    document.getElementById("viewAllCapturesBtn");

  if (viewAllBtn) {

    viewAllBtn.addEventListener("click", showAllCapturesModal);

  }

}


function renderCaptureRow(capture) {

  const project =
    state.projects.find(
      p => p.id === capture.projectId
    );

  return `
    <div class="capture">

      <strong>
        ${escapeHTML(capture.text)}
      </strong>

      <small>
        ${
          project
            ? renderLinkChip("project", project.id, project.name)
            : "No project"
        }
      </small>

    </div>
  `;

}


function showAllCapturesModal() {

  const sorted =
    [...state.captures].sort(
      (a, b) => b.createdAt - a.createdAt
    );

  const rows =
    sorted
      .map(capture => {

        const project =
          state.projects.find(
            p => p.id === capture.projectId
          );

        return `
          <div class="capture">

            <strong>
              ${escapeHTML(capture.text)}
            </strong>

            <small>
              ${
                project
                  ? renderLinkChip("project", project.id, project.name)
                  : "No project"
              }
              ·
              ${new Date(capture.createdAt).toLocaleString()}
            </small>

          </div>
        `;

      })
      .join("");

  openModal(`

    <h3>All Captures</h3>

    <div class="modal-capture-list">
      ${rows}
    </div>

    <div class="modal-actions">
      <button class="modal-cancel" id="closeAllCaptures">Close</button>
    </div>

  `);

  attachLinkChipEvents(document.getElementById("modalOverlay"));

  document
    .getElementById("closeAllCaptures")
    .addEventListener("click", closeModal);

}

function escapeHTML(text) {

  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}
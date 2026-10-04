import { state } from "../../core/state.js";
import { saveData } from "../../core/storage.js";
import { roadmapTemplates } from "./roadmapTemplates.js";
import {
  getLevelName,
  getCapabilityProgress
} from "../skills/skills.js";
import { getProgress } from "../projects/projects.js";
import { openModal, closeModal, showModalError, confirmDelete } from "../../core/modal.js";
import { replayFadeIn } from "../../core/utils.js";
import { renderLinkChip, attachLinkChipEvents } from "../../core/linkChip.js";

let openedGoal = null;
let activeGoalTab = {};


/* =========================================================
   MAIN CAREER VIEW
   ========================================================= */

export function renderCareer(app, targetId) {

  if (!app) return;

  if (targetId) {

    openedGoal = targetId;

  }

  app.innerHTML = `
    <section>

      <h2>Career</h2>

      <div class="career-controls">

        <button id="addCareerGoalBtn">
          + Add Career Goal
        </button>

      </div>

      <div id="careerGoalList"></div>

    </section>
  `;

  renderGoalList();

  attachCareerEvents();

  attachLinkChipEvents(app);

}


/* =========================================================
   GOAL LIST
   ========================================================= */

function renderGoalList() {

  const container =
    document.getElementById("careerGoalList");

  if (!container) return;

  if (state.careerGoals.length === 0) {

    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">🧭</span>
        <p>No career goals yet.</p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    state.careerGoals
      .map(goal => renderGoalCard(goal))
      .join("");

  replayFadeIn(container);

  attachLinkChipEvents(container);

}


function renderGoalCard(goal) {

  const expanded =
    openedGoal === goal.id;

  const requiredSkills =
    getRequiredSkillObjects(goal);

  return `
    <div class="card career-goal-card">

      <div
        class="career-goal-header ${!expanded ? "career-goal-header-collapsed" : ""}"
        data-id="${goal.id}"
      >

        <div>

          <h3>
            ${escapeHTML(goal.title)}
          </h3>

          <small>
            ${requiredSkills.length}
            required skill${requiredSkills.length === 1 ? "" : "s"}
          </small>

        </div>

        <span class="expand-icon">
          ${expanded ? "−" : "+"}
        </span>

      </div>

      ${
        expanded
          ? renderExpandedGoal(goal, requiredSkills)
          : ""
      }

    </div>
  `;

}


function renderExpandedGoal(goal, requiredSkills) {

  const tab =
    activeGoalTab[goal.id] || "overview";

  return `
    <div class="career-goal-body">

      <div class="project-tabs">

        <button
          class="tab-btn ${tab === "overview" ? "active" : ""}"
          data-goal="${goal.id}"
          data-tab="overview"
        >
          Overview
        </button>

        <button
          class="tab-btn ${tab === "roadmap" ? "active" : ""}"
          data-goal="${goal.id}"
          data-tab="roadmap"
        >
          Roadmap
        </button>

        <button
          class="tab-btn ${tab === "readiness" ? "active" : ""}"
          data-goal="${goal.id}"
          data-tab="readiness"
        >
          Readiness
        </button>

      </div>

      <div class="fade-in" id="goalTabContent-${goal.id}">

        ${renderGoalTab(goal, tab, requiredSkills)}

      </div>


      <hr>


      <div class="career-goal-actions">

        <button
          class="edit-career-goal"
          data-goal="${goal.id}"
        >
          Edit Goal
        </button>

        <button
          class="delete-career-goal"
          data-goal="${goal.id}"
        >
          Delete Goal
        </button>

      </div>

    </div>
  `;

}


function renderGoalTab(goal, tab, requiredSkills) {

  if (tab === "roadmap") {

    return `
      <div class="skill-section">

        <div class="project-actions">
          <button
            class="add-roadmap-stage"
            data-goal="${goal.id}"
          >
            + Add Stage
          </button>
        </div>

        ${renderRoadmap(goal)}

      </div>
    `;

  }


  if (tab === "readiness") {

    return `

      <div class="skill-section">

        <h4>
          Readiness
        </h4>

        ${renderReadiness(requiredSkills)}

      </div>


      <div class="skill-section">

        <h4>
          Related Projects
        </h4>

        ${renderRelatedProjects(goal)}

      </div>

    `;

  }


  /* OVERVIEW (default) */

  return `

    <div class="skill-section">

      <h4>
        About
      </h4>

      <p>
        ${
          goal.description
            ? escapeHTML(goal.description)
            : "No description."
        }
      </p>

    </div>


    <div class="skill-section">

      <h4>
        Required Skills
      </h4>

      ${
        requiredSkills.length === 0
          ? `
            <p>
              No required skills selected.
            </p>
          `
          : `
            <ul class="skill-related-projects">

              ${
                requiredSkills
                  .map(skill => `
                    <li>
                      ${renderLinkChip("skill", skill.id, skill.name)}
                    </li>
                  `)
                  .join("")
              }

            </ul>
          `
      }

    </div>

  `;

}


/* =========================================================
   ROADMAP RENDER
   ========================================================= */

function renderRoadmap(goal) {

  if (goal.roadmap.length === 0) {

    return `
      <p>
        No roadmap stages yet.
      </p>
    `;

  }

  const sorted =
    [...goal.roadmap].sort(
      (a, b) =>
        (a.order || 0) - (b.order || 0)
    );

  return `
    <ul class="milestone-list">

      ${
        sorted
          .map(stage => `
            <li class="milestone">

              <label>
                <input
                  type="checkbox"
                  data-goal="${goal.id}"
                  data-stage="${stage.id}"
                  ${stage.done ? "checked" : ""}
                >
                <span>${escapeHTML(stage.title)}</span>
              </label>

              <div class="project-actions inline-actions">

                <button
                  class="edit-roadmap-stage"
                  data-goal="${goal.id}"
                  data-stage="${stage.id}"
                >
                  Edit
                </button>

                <button
                  class="delete-roadmap-stage"
                  data-goal="${goal.id}"
                  data-stage="${stage.id}"
                >
                  Delete
                </button>

              </div>

            </li>
          `)
          .join("")
      }

    </ul>
  `;

}


/* =========================================================
   READINESS
   ========================================================= */

function renderReadiness(requiredSkills) {

  if (requiredSkills.length === 0) {

    return `
      <p>
        No required skills selected.
      </p>
    `;

  }

  return `
    <div class="readiness-list">

      ${
        requiredSkills
          .map(skill => renderSkillReadiness(skill))
          .join("")
      }

    </div>

    <div class="skill-section">

      <h4>
        Evidence
      </h4>

      ${renderEvidenceRollup(requiredSkills)}

    </div>
  `;

}


function renderSkillReadiness(skill) {

  const isMastered =
    skill.level >= skill.targetLevel || skill.level >= 5;

  if (isMastered) {

    return `
      <div class="readiness-item readiness-mastered">
        <p><strong>${escapeHTML(skill.name)}</strong></p>
        <p class="readiness-mastered-badge">🏆 Mastered — ${getLevelName(skill.level)}</p>
      </div>
    `;

  }

  const currentLevelName = getLevelName(skill.level);
  const targetLevelName = getLevelName(skill.targetLevel);

  const progress = getCapabilityProgress(skill, skill.level);
  const evidenceCount = (skill.evidence || []).length;

  return `
    <div class="readiness-item">
      <p><strong>${escapeHTML(skill.name)}</strong></p>
      <p>Level: ${currentLevelName} → ${targetLevelName}</p>
      <p>${progress.total > 0 ? `${progress.demonstrated} / ${progress.total} demonstrated at current level` : "No capabilities defined at current level."}</p>
      <p>Evidence recorded: <strong>${evidenceCount}</strong></p>
    </div>
  `;

}


function renderEvidenceRollup(requiredSkills) {

  const groups =
    requiredSkills
      .map(skill => ({
        skill,
        evidence: skill.evidence || []
      }))
      .filter(group => group.evidence.length > 0);

  if (groups.length === 0) {

    return `
      <p>
        No evidence recorded yet across
        required skills.
      </p>
    `;

  }

  return `
    <div class="evidence-rollup">

      ${
        groups
          .map(group => `
            <div class="evidence-rollup-group">

              <p>
                <strong>
                  ${escapeHTML(group.skill.name)}
                </strong>
              </p>

              <ul class="skill-related-projects">

                ${
                  group.evidence
                    .map(item => `
                      <li>

                        <strong>
                          ${escapeHTML(item.type)}
                        </strong>
                        —
                        ${escapeHTML(item.title)}

                        ${
                          item.projectId
                            ? renderEvidenceProjectName(item.projectId)
                            : ""
                        }

                        ${
                          item.url
                            ? `
                              <br>
                              <a
                                href="${escapeHTML(item.url)}"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                ${escapeHTML(item.url)}
                              </a>
                            `
                            : ""
                        }

                      </li>
                    `)
                    .join("")
                }

              </ul>

            </div>
          `)
          .join("")
      }

    </div>
  `;

}


function renderEvidenceProjectName(projectId) {

  const project =
    state.projects.find(
      existingProject =>
        existingProject.id === projectId
    );

  return project
    ? ` (${renderLinkChip("project", project.id, project.name)})`
    : "";

}


/* =========================================================
   RELATED PROJECTS (GOAL)
   ========================================================= */

function renderRelatedProjects(goal) {

  if (
    !Array.isArray(goal.relatedProjects) ||
    goal.relatedProjects.length === 0
  ) {

    return `
      <p>
        No related projects linked.
      </p>
    `;

  }

  const projects =
    goal.relatedProjects
      .map(id =>
        state.projects.find(
          project => project.id === id
        )
      )
      .filter(Boolean);

  if (projects.length === 0) {

    return `
      <p>
        No related projects linked.
      </p>
    `;

  }

  const usedAsEvidence =
    getEvidenceProjectIds(
      getRequiredSkillObjects(goal)
    );

  return `
    <ul class="skill-related-projects">

      ${
        projects
          .map(project => {

            const progress =
              getProgress(project);

            const isEvidence =
              usedAsEvidence.has(project.id);

            return `
              <li>

                ${renderLinkChip("project", project.id, project.name)}
                —
                ${progress}% complete

                ${
                  isEvidence
                    ? `
                      <br>
                      <small>
                        ✓ Also used as evidence
                      </small>
                    `
                    : ""
                }

              </li>
            `;

          })
          .join("")
      }

    </ul>
  `;

}


function getEvidenceProjectIds(requiredSkills) {

  const ids = new Set();

  requiredSkills.forEach(skill => {

    (skill.evidence || []).forEach(item => {

      if (item.projectId) {
        ids.add(item.projectId);
      }

    });

  });

  return ids;

}


/* =========================================================
   EVENTS
   ========================================================= */

function attachCareerEvents() {

  const addButton =
    document.getElementById("addCareerGoalBtn");

  if (addButton) {

    addButton.addEventListener(
      "click",
      openAddGoalForm
    );

  }

  const list =
    document.getElementById("careerGoalList");

  if (!list) return;

  list.onclick =
    handleGoalListClick;

  list
    .querySelectorAll(".milestone input")
    .forEach(box => {

      box.addEventListener(
        "change",
        () => toggleRoadmapStage(box)
      );

    });

}


function toggleRoadmapStage(box) {

  const goal =
    findGoal(box.dataset.goal);

  if (!goal) return;

  const stage =
    goal.roadmap.find(
      existingStage =>
        existingStage.id === box.dataset.stage
    );

  if (!stage) return;

  stage.done =
    box.checked;

  stage.completedAt =
    box.checked
      ? Date.now()
      : null;

  saveData(state);

  renderGoalList();

}


function handleGoalListClick(event) {

  const target =
    event.target instanceof Element
      ? event.target
      : event.target.parentElement;

  if (!target) return;


  const header =
    target.closest(".career-goal-header");

  if (
    header &&
    !target.closest("button")
  ) {

    const id =
      header.dataset.id;

    openedGoal =
      openedGoal === id
        ? null
        : id;

    renderGoalList();

    return;
  }


  const button =
    target.closest("button");

  if (!button) return;

  event.stopPropagation();


  if (
    button.classList.contains("tab-btn")
  ) {

    const goalId =
      button.dataset.goal;

    const tabName =
      button.dataset.tab;

    activeGoalTab[goalId] =
      tabName;

    renderGoalList();

    return;

  }


  if (
    button.classList.contains(
      "edit-career-goal"
    )
  ) {

    const goal =
      findGoal(button.dataset.goal);

    if (goal) {
      openEditGoalForm(goal);
    }

    return;
  }


  if (
    button.classList.contains(
      "delete-career-goal"
    )
  ) {

    const goal =
      findGoal(button.dataset.goal);

    if (goal) {
      deleteGoal(goal);
    }

    return;
  }


  if (
    button.classList.contains(
      "add-roadmap-stage"
    )
  ) {

    const goal =
      findGoal(button.dataset.goal);

    if (goal) {
      addRoadmapStage(goal);
    }

    return;
  }


  if (
    button.classList.contains(
      "edit-roadmap-stage"
    )
  ) {

    const goal =
      findGoal(button.dataset.goal);

    if (!goal) return;

    const stage =
      goal.roadmap.find(
        existingStage =>
          existingStage.id === button.dataset.stage
      );

    if (stage) {
      editRoadmapStage(goal, stage);
    }

    return;
  }


  if (
    button.classList.contains(
      "delete-roadmap-stage"
    )
  ) {

    const goal =
      findGoal(button.dataset.goal);

    if (!goal) return;

    const stage =
      goal.roadmap.find(
        existingStage =>
          existingStage.id === button.dataset.stage
      );

    if (stage) {
      deleteRoadmapStage(goal, stage);
    }

  }

}


/* =========================================================
   ADD / EDIT GOAL — SMART FORM
   ========================================================= */

function openAddGoalForm() {

  if (state.skills.length === 0) {

    openModal(`
      <h3>No Skills Yet</h3>
      <p>Add skills in the Skills tab first before creating a career goal.</p>
      <div class="modal-actions">
        <button class="modal-cancel" id="noSkillsClose">Close</button>
      </div>
    `);

    document
      .getElementById("noSkillsClose")
      .addEventListener("click", closeModal);

    return;

  }

  renderGoalFormModal({ mode: "add", goal: null });

}


function openEditGoalForm(goal) {

  renderGoalFormModal({ mode: "edit", goal });

}


function renderGoalFormModal({ mode, goal }) {

  const activeProjects =
    state.projects.filter(p => !p.archived);

  const skillCheckboxes =
    state.skills
      .map(skill => `
        <label class="modal-checkbox-row">
          <input
            type="checkbox"
            value="${skill.id}"
            class="goal-skill-checkbox"
            ${goal && goal.requiredSkillIds.includes(skill.id) ? "checked" : ""}
          >
          ${escapeHTML(skill.name)}
        </label>
      `)
      .join("");

  const projectCheckboxes =
    activeProjects
      .map(project => `
        <label class="modal-checkbox-row">
          <input
            type="checkbox"
            value="${project.id}"
            class="goal-project-checkbox"
            ${goal && goal.relatedProjects.includes(project.id) ? "checked" : ""}
          >
          ${escapeHTML(project.name)}
        </label>
      `)
      .join("");

  openModal(`

    <h3>${mode === "add" ? "New Career Goal" : "Edit Career Goal"}</h3>

    <div id="goalFormError" class="auth-error"></div>

    <div class="modal-field">
      <label>Title</label>
      <input
        type="text"
        id="goalTitleInput"
        value="${goal ? escapeHTML(goal.title) : ""}"
        placeholder="e.g. Frontend Developer"
      >
    </div>

    <div class="modal-field">
      <label>Description (optional)</label>
      <textarea id="goalDescriptionInput">${goal ? escapeHTML(goal.description || "") : ""}</textarea>
    </div>

    <div class="modal-field">
      <label>Required Skills</label>
      <div class="modal-checkbox-list">${skillCheckboxes}</div>
      <div id="overlapWarningBox" class="overlap-warning"></div>
    </div>

    ${
      activeProjects.length > 0
        ? `
          <div class="modal-field">
            <label>Related Projects (optional — auto-suggested from required skills)</label>
            <div class="modal-checkbox-list">${projectCheckboxes}</div>
          </div>
        `
        : ""
    }

    <div class="modal-actions">
      <button class="modal-save" id="goalFormSave">${mode === "add" ? "Create Goal" : "Save"}</button>
      <button class="modal-cancel" id="goalFormCancel">Cancel</button>
    </div>

  `);

  document
    .getElementById("goalFormCancel")
    .addEventListener("click", closeModal);

  let overlapAcknowledged = false;

  function recomputeOverlap() {

    const checkedSkillIds =
      Array.from(
        document.querySelectorAll(".goal-skill-checkbox:checked")
      ).map(c => c.value);

    const warning =
      getOverlapWarning(
        checkedSkillIds,
        goal ? goal.id : null
      );

    document.getElementById("overlapWarningBox").textContent =
      warning || "";

    overlapAcknowledged = false;

    document.getElementById("goalFormSave").textContent =
      mode === "add" ? "Create Goal" : "Save";

  }

  function recomputeProjectSuggestions() {

    const checkedSkillIds =
      Array.from(
        document.querySelectorAll(".goal-skill-checkbox:checked")
      ).map(c => c.value);

    const suggested = new Set();

    checkedSkillIds.forEach(skillId => {

      const skill =
        state.skills.find(s => s.id === skillId);

      if (skill && Array.isArray(skill.relatedProjects)) {

        skill.relatedProjects.forEach(pid => suggested.add(pid));

      }

    });

    document
      .querySelectorAll(".goal-project-checkbox")
      .forEach(checkbox => {

        if (checkbox.dataset.touched !== "true") {

          checkbox.checked = suggested.has(checkbox.value);

        }

      });

  }

  document
    .querySelectorAll(".goal-skill-checkbox")
    .forEach(checkbox => {

      checkbox.addEventListener("change", () => {

        recomputeOverlap();

        recomputeProjectSuggestions();

      });

    });

  document
    .querySelectorAll(".goal-project-checkbox")
    .forEach(checkbox => {

      checkbox.addEventListener("change", () => {

        checkbox.dataset.touched = "true";

      });

    });

  if (mode === "edit") {

    recomputeOverlap();

  }

  document
    .getElementById("goalFormSave")
    .addEventListener("click", () => {

      const errorBox =
        document.getElementById("goalFormError");

      const title =
        document.getElementById("goalTitleInput").value.trim();

      if (!title) {

        showModalError(errorBox, "Title cannot be empty.");

        return;

      }

      const titleExists =
        state.careerGoals.some(g =>
          (!goal || g.id !== goal.id) &&
          g.title.toLowerCase() === title.toLowerCase()
        );

      if (titleExists) {

        showModalError(errorBox, "A career goal with this title already exists.");

        return;

      }

      const description =
        document.getElementById("goalDescriptionInput").value.trim();

      const requiredSkillIds =
        Array.from(
          document.querySelectorAll(".goal-skill-checkbox:checked")
        ).map(c => c.value);

      const relatedProjects =
        Array.from(
          document.querySelectorAll(".goal-project-checkbox:checked")
        ).map(c => c.value);

      const overlapWarning =
        getOverlapWarning(requiredSkillIds, goal ? goal.id : null);

      if (overlapWarning && !overlapAcknowledged) {

        showModalError(errorBox, overlapWarning + " Click again to continue anyway.");

        overlapAcknowledged = true;

        document.getElementById("goalFormSave").textContent =
          mode === "add" ? "Create Anyway" : "Save Anyway";

        return;

      }

      if (mode === "add") {

        const suggestion =
          getRoadmapSuggestion(title, requiredSkillIds);

        closeModal();

        if (suggestion) {

          showRoadmapSuggestionModal(suggestion, roadmap => {

            finalizeCreateGoal(
              title,
              description,
              requiredSkillIds,
              relatedProjects,
              roadmap
            );

          });

        } else {

          finalizeCreateGoal(
            title,
            description,
            requiredSkillIds,
            relatedProjects,
            []
          );

        }

      } else {

        goal.title = title;
        goal.description = description;
        goal.requiredSkillIds = requiredSkillIds;
        goal.relatedProjects = relatedProjects;

        saveData(state);

        closeModal();

        openedGoal = goal.id;

        renderCareer(document.getElementById("app"));

      }

    });

}


function finalizeCreateGoal(title, description, requiredSkillIds, relatedProjects, roadmap) {

  state.careerGoals.push({

    id: crypto.randomUUID(),
    title,
    description,
    requiredSkillIds,
    relatedProjects,
    roadmap,
    createdAt: Date.now()

  });

  saveData(state);

  openedGoal =
    state.careerGoals[state.careerGoals.length - 1].id;

  renderCareer(document.getElementById("app"));

}


function showRoadmapSuggestionModal(suggestion, onChoice) {

  const sourceLabel =
    suggestion.source === "template"
      ? "a saved roadmap template"
      : "your required skills' levels";

  const preview =
    suggestion.suggestedTitles
      .map((t, i) => `<li>${escapeHTML(t)}</li>`)
      .join("");

  openModal(`

    <h3>Suggested Roadmap</h3>

    <p>Based on ${sourceLabel}:</p>

    <ol class="modal-suggested-list">${preview}</ol>

    <div class="modal-actions">
      <button class="modal-save" id="useRoadmapSuggestion">Use This Roadmap</button>
      <button class="modal-cancel" id="skipRoadmapSuggestion">Start Blank</button>
    </div>

  `);

  document
    .getElementById("skipRoadmapSuggestion")
    .addEventListener("click", () => {

      closeModal();

      onChoice([]);

    });

  document
    .getElementById("useRoadmapSuggestion")
    .addEventListener("click", () => {

      closeModal();

      onChoice(buildRoadmapFromTitles(suggestion.suggestedTitles));

    });

}


/* =========================================================
   DELETE GOAL
   ========================================================= */

function deleteGoal(goal) {

  confirmDelete({

    title: "Delete Career Goal",

    message: `This permanently removes "${goal.title}" and its roadmap.`,

    confirmText: goal.title,

    onConfirm: () => {

      state.careerGoals =
        state.careerGoals.filter(
          existingGoal => existingGoal.id !== goal.id
        );

      saveData(state);

      openedGoal = null;

      renderCareer(document.getElementById("app"));

    }

  });

}


/* =========================================================
   OVERLAP WARNING
   ========================================================= */

function getOverlapWarning(requiredSkillIds, excludeGoalId) {

  if (requiredSkillIds.length === 0) {
    return null;
  }

  const otherGoals =
    state.careerGoals.filter(
      goal => goal.id !== excludeGoalId
    );

  for (const goal of otherGoals) {

    if (goal.requiredSkillIds.length === 0) {
      continue;
    }

    const shared =
      requiredSkillIds.filter(id =>
        goal.requiredSkillIds.includes(id)
      );

    const overlapPercent =
      shared.length / requiredSkillIds.length;

    if (overlapPercent >= 0.7) {

      return (
        `This overlaps heavily with your existing goal ` +
        `"${goal.title}" (${Math.round(overlapPercent * 100)}% ` +
        `shared required skills).`
      );

    }

  }

  return null;

}


/* =========================================================
   ROADMAP SUGGESTION
   ========================================================= */

function getRoadmapSuggestion(title, requiredSkillIds) {

  const template =
    roadmapTemplates[title];

  let suggestedTitles = [];

  let source = null;

  if (
    Array.isArray(template) &&
    template.length > 0
  ) {

    suggestedTitles = template;
    source = "template";

  } else if (requiredSkillIds.length > 0) {

    suggestedTitles =
      deriveStagesFromSkills(requiredSkillIds);

    source = "derived";

  }

  if (suggestedTitles.length === 0) {
    return null;
  }

  return { suggestedTitles, source };

}


function buildRoadmapFromTitles(titles) {

  return titles.map(
    (stageTitle, index) => ({

      id: crypto.randomUUID(),
      title: stageTitle,
      order: index + 1,
      done: false,
      completedAt: null

    })
  );

}


function deriveStagesFromSkills(requiredSkillIds) {

  const stages = [];

  requiredSkillIds.forEach(skillId => {

    const skill =
      state.skills.find(
        existingSkill =>
          existingSkill.id === skillId
      );

    if (!skill) return;

    const targetLevel =
      skill.targetLevel ||
      skill.level;

    const levelName =
      getLevelName(targetLevel);

    stages.push(
      `Reach ${levelName} in ${skill.name}`
    );

  });

  return stages;

}


/* =========================================================
   ROADMAP STAGE MANAGEMENT
   ========================================================= */

function addRoadmapStage(goal) {

  openModal(`

    <h3>Add Roadmap Stage</h3>

    <div id="addStageError" class="auth-error"></div>

    <div class="modal-field">
      <label>Stage name</label>
      <input type="text" id="addStageInput">
    </div>

    <div class="modal-actions">
      <button class="modal-save" id="addStageSave">Add</button>
      <button class="modal-cancel" id="addStageCancel">Cancel</button>
    </div>

  `);

  document
    .getElementById("addStageCancel")
    .addEventListener("click", closeModal);

  document
    .getElementById("addStageSave")
    .addEventListener("click", () => {

      const errorBox =
        document.getElementById("addStageError");

      const trimmedTitle =
        document.getElementById("addStageInput").value.trim();

      if (!trimmedTitle) {

        showModalError(errorBox, "Stage cannot be empty.");

        return;

      }

      const titleExists =
        goal.roadmap.some(
          stage =>
            stage.title.toLowerCase() ===
            trimmedTitle.toLowerCase()
        );

      if (titleExists) {

        showModalError(errorBox, "A roadmap stage with this name already exists.");

        return;

      }

      goal.roadmap.push({

        id: crypto.randomUUID(),
        title: trimmedTitle,
        order: goal.roadmap.length + 1,
        done: false,
        completedAt: null

      });

      saveData(state);

      closeModal();

      openedGoal = goal.id;

      renderCareer(document.getElementById("app"));

    });

}


function editRoadmapStage(goal, stage) {

  openModal(`

    <h3>Edit Roadmap Stage</h3>

    <div id="editStageError" class="auth-error"></div>

    <div class="modal-field">
      <label>Stage name</label>
      <input type="text" id="editStageInput" value="${stage.title}">
    </div>

    <div class="modal-actions">
      <button class="modal-save" id="editStageSave">Save</button>
      <button class="modal-cancel" id="editStageCancel">Cancel</button>
    </div>

  `);

  document
    .getElementById("editStageCancel")
    .addEventListener("click", closeModal);

  document
    .getElementById("editStageSave")
    .addEventListener("click", () => {

      const errorBox =
        document.getElementById("editStageError");

      const trimmedTitle =
        document.getElementById("editStageInput").value.trim();

      if (!trimmedTitle) {

        showModalError(errorBox, "Stage cannot be empty.");

        return;

      }

      const titleExists =
        goal.roadmap.some(
          existingStage =>
            existingStage.id !== stage.id &&
            existingStage.title.toLowerCase() ===
            trimmedTitle.toLowerCase()
        );

      if (titleExists) {

        showModalError(errorBox, "A roadmap stage with this name already exists.");

        return;

      }

      stage.title = trimmedTitle;

      saveData(state);

      closeModal();

      openedGoal = goal.id;

      renderCareer(document.getElementById("app"));

    });

}


function deleteRoadmapStage(goal, stage) {

  openModal(`

    <h3>Delete Stage</h3>

    <p>Delete "${escapeHTML(stage.title)}"?</p>

    <div class="modal-actions">
      <button class="modal-danger" id="deleteStageSave">Delete</button>
      <button class="modal-cancel" id="deleteStageCancel">Cancel</button>
    </div>

  `);

  document
    .getElementById("deleteStageCancel")
    .addEventListener("click", closeModal);

  document
    .getElementById("deleteStageSave")
    .addEventListener("click", () => {

      closeModal();

      goal.roadmap =
        goal.roadmap.filter(
          existingStage => existingStage.id !== stage.id
        );

      saveData(state);

      openedGoal = goal.id;

      renderCareer(document.getElementById("app"));

    });

}


/* =========================================================
   HELPERS
   ========================================================= */

function getRequiredSkillObjects(goal) {

  return goal.requiredSkillIds
    .map(id =>
      state.skills.find(
        skill => skill.id === id
      )
    )
    .filter(Boolean);

}


function findGoal(goalId) {

  return state.careerGoals.find(
    goal => goal.id === goalId
  );

}


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}
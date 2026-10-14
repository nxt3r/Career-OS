import { state } from "../../core/state.js";
import { saveData } from "../../core/storage.js";
import { openModal, closeModal, showModalError, confirmDelete, confirmSimple } from "../../core/modal.js";
import { replayFadeIn } from "../../core/utils.js";
import { renderLinkChip, attachLinkChipEvents } from "../../core/linkChip.js";

let openedSkill = null;
let activeSkillTab = {};
let reviewingPromotion = null;

const LEVELS = [
  "Beginner",
  "Elementary",
  "Intermediate",
  "Advanced",
  "Expert"
];

const STATUS_MAP = {
  1: "Active",
  2: "Paused"
};


export function getDisplayStatus(skill) {

  if (skill.level >= skill.targetLevel || skill.level >= 5) {
    return "Mastered";
  }

  return skill.status === "Learning" ? "Active" : skill.status;

}

const EVIDENCE_TYPES = {
  1: "Project",
  2: "Link",
  3: "Document",
  4: "Achievement",
  5: "Note",
  6: "Artifact"
};


/* =========================================================
   MAIN SKILLS VIEW
   ========================================================= */

export function renderSkills(app, targetId) {

  if (!app) return;

  if (targetId) {

    openedSkill = targetId;

  }

  app.innerHTML = `
    <section>

      <h2>Skills</h2>

      <div class="skill-controls">

        <button id="addSkillBtn">
          + Add Skill
        </button>

      </div>

      <div class="skill-filters">

        <button
          class="skill-filter active"
          data-filter="All"
        >
          All
        </button>

        ${
          state.skillCategories
            .map(category => `
              <button
                class="skill-filter"
                data-filter="${escapeHTML(category)}"
              >
                ${escapeHTML(category)}
              </button>
            `)
            .join("")
        }

      </div>

      <div id="skillList"></div>

    </section>
  `;

  renderSkillList();

  attachSkillEvents();
}


/* =========================================================
   SKILL LIST
   ========================================================= */

function renderSkillList(filter = "All") {

  const container =
    document.getElementById("skillList");

  if (!container) return;

  const visibleSkills =
    filter === "All"
      ? state.skills
      : state.skills.filter(
          skill =>
            skill.category === filter
        );

  if (visibleSkills.length === 0) {

    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">🌱</span>
        <p>No skills added yet.</p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    visibleSkills
      .map(skill => renderSkillCard(skill))
      .join("");

  replayFadeIn(container);

  attachLinkChipEvents(container);
}

/* =========================================================
   SKILL CARD
   ========================================================= */

function renderSkillCard(skill) {

  ensureSkillData(skill);

  const levelName =
    getLevelName(skill.level);

  const targetLevelName =
    getLevelName(skill.targetLevel);

  const expanded =
    openedSkill === skill.id;

  return `
    <div
      class="
        card
        skill-card
        ${expanded ? "expanded-skill" : ""}
        ${getStaleGlowClass(skill)}
      "
    >

      <div
        class="skill-header ${!expanded ? "skill-header-collapsed" : ""}"
        data-id="${skill.id}"
      >

        <div>

          <h3>
            ${escapeHTML(skill.name)}
          </h3>

          <p>
            ${escapeHTML(skill.category)}
          </p>

          <p>
            Level:
            <strong>
              ${levelName}
            </strong>

            →

            <strong>
              ${targetLevelName}
            </strong>
          </p>

          <p>
            Status:
            <span class="status ${getDisplayStatus(skill).toLowerCase()}">
              ${getDisplayStatus(skill)}
            </span>
          </p>

        </div>

        <div class="skill-right">

          <span class="expand-icon">
            ${expanded ? "−" : "+"}
          </span>

        </div>

      </div>

      ${
        expanded
          ? renderExpandedSkill(skill)
          : ""
      }

    </div>
  `;
}


/* =========================================================
   EXPANDED SKILL
   ========================================================= */

function renderExpandedSkill(skill) {

  const tab =
    activeSkillTab[skill.id] || "overview";

  return `
    <div class="skill-body">

      <div class="project-tabs">

        <button
          class="tab-btn ${tab === "overview" ? "active" : ""}"
          data-skill="${skill.id}"
          data-tab="overview"
        >
          Overview
        </button>

        <button
          class="tab-btn ${tab === "capabilities" ? "active" : ""}"
          data-skill="${skill.id}"
          data-tab="capabilities"
        >
          Capabilities
        </button>

        <button
          class="tab-btn ${tab === "evidence" ? "active" : ""}"
          data-skill="${skill.id}"
          data-tab="evidence"
        >
          Evidence
        </button>

        <button
          class="tab-btn ${tab === "practice" ? "active" : ""}"
          data-skill="${skill.id}"
          data-tab="practice"
        >
          Practice & History
        </button>

      </div>

      <div class="fade-in" id="skillTabContent-${skill.id}">

        ${renderSkillTab(skill, tab)}

      </div>


      <hr>


      <!-- SKILL MANAGEMENT -->

      <div class="skill-actions">

        <button
          class="edit-skill"
          data-skill="${skill.id}"
        >
          Edit Skill
        </button>

        <button
          class="delete-skill"
          data-skill="${skill.id}"
        >
          Delete Skill
        </button>

      </div>

    </div>
  `;
}


function renderSkillTab(skill, tab) {

  const levelName =
    getLevelName(skill.level);

  const targetLevelName =
    getLevelName(skill.targetLevel);


  if (tab === "capabilities") {

    return `
      <div class="skill-section capability-section">

        <p>
          Define what being good at this skill
          actually means.
        </p>

        ${renderCapabilities(skill)}

      </div>
    `;

  }


  if (tab === "evidence") {

    return `
      <div class="skill-section">

        ${renderSkillEvidence(skill)}

      </div>
    `;

  }


  if (tab === "practice") {

    return `

      <div class="skill-section">

        <h4>
          Practice
        </h4>

        <p>
          Total practice:
          <strong>
            ${formatSkillPracticeTime(
              getSkillPracticeTime(skill.id)
            )}
          </strong>
        </p>

        <p>
          Practice sessions:
          <strong>
            ${getSkillSessionCount(skill.id)}
          </strong>
        </p>

        <p>
          ${
            getSkillLastPracticed(skill.id)
              ? `
                Last practiced:
                <strong>
                  ${new Date(
                    getSkillLastPracticed(skill.id)
                  ).toLocaleString()}
                </strong>
              `
              : "No practice recorded yet."
          }
        </p>

        ${renderPracticeTrend(skill)}

        ${renderStaleMessage(skill)}

      </div>


      <div class="skill-section">

        <h4>
          Level History
        </h4>

        ${renderLevelHistory(skill)}

      </div>


      <div class="skill-section">

        <h4>
          Related Projects
        </h4>

        ${renderRelatedProjects(skill)}

      </div>

    `;

  }


  /* OVERVIEW (default) */

  return `

    <div class="skill-section">

      <h4>
        About This Skill
      </h4>

      <p>
        ${
          skill.description
            ? escapeHTML(skill.description)
            : "No description."
        }
      </p>

    </div>


    <div class="skill-section">

      <h4>
        Skill Level
      </h4>

      <p>
        Current:
        <strong>
          ${levelName}
        </strong>
      </p>

      <p>
        Target:
        <strong>
          ${targetLevelName}
        </strong>
      </p>

      ${renderCurrentLevelProgress(skill)}

      ${renderLevelProgression(skill)}

    </div>


    <div class="skill-section">

      <h4>
        Status
      </h4>

      ${
        getDisplayStatus(skill) === "Mastered"
          ? `<span class="status mastered">🏆 Mastered</span>`
          : `
            <button
              class="status status-toggle-btn ${getDisplayStatus(skill).toLowerCase()}"
              data-skill="${skill.id}"
              data-action="toggle-status"
            >
              ${getDisplayStatus(skill)} (click to toggle)
            </button>
          `
      }

    </div>

  `;

}


/* =========================================================
   CURRENT LEVEL PROGRESS
   ========================================================= */

function renderCurrentLevelProgress(skill) {

  const progress =
    getCapabilityProgress(
      skill,
      skill.level
    );

  if (progress.total === 0) {

    return `
      <div class="skill-progression">

        <p>
          <strong>
            Current Level Progress
          </strong>
        </p>

        <p>
          No capabilities defined for
          ${getLevelName(skill.level)} yet.
        </p>

      </div>
    `;
  }

  return `
    <div class="skill-progression">

      <p>
        <strong>
          Current Level Progress
        </strong>
      </p>

      <p>
        ${progress.demonstrated}
        /
        ${progress.total}
        demonstrated
      </p>

    </div>
  `;
}


/* =========================================================
   LEVEL PROGRESSION
   ========================================================= */

function renderLevelProgression(skill) {

  const readiness =
    getNextLevelReadiness(skill);


  /* EXPERT */

  if (readiness.reason === "max-level") {

    return `
      <div class="skill-progression">

        <p>
          🏆
          <strong>
            Expert level reached.
          </strong>
        </p>

        <p>
          This skill is at the maximum level.
        </p>

      </div>
    `;
  }


  /* TARGET REACHED */

  if (readiness.reason === "target-reached") {

    return `
      <div class="skill-progression">

        <p>
          <strong>
            Target level reached.
          </strong>
        </p>

        <p>
          No promotion needed right now.
        </p>

      </div>
    `;
  }


  /* NO CAPABILITIES */

  if (readiness.reason === "no-capabilities") {

    return `
      <div class="skill-progression">

        <p>
          <strong>
            Next Level Readiness
          </strong>
        </p>

        <p>
          Next level:
          <strong>
            ${getLevelName(readiness.nextLevel)}
          </strong>
        </p>

        <p>
          No capabilities have been defined
          for the next level yet.
        </p>

        <p>
          Define the required capabilities
          before promotion can be assessed.
        </p>

      </div>
    `;
  }


  /* NEXT LEVEL READINESS */

  return `
    <div class="skill-progression">

      <p>
        <strong>
          Next Level Readiness
        </strong>
      </p>

      <p>
        Next level:
        <strong>
          ${getLevelName(readiness.nextLevel)}
        </strong>
      </p>

      <p>
        ${readiness.demonstrated}
        /
        ${readiness.total}
        demonstrated
      </p>

            ${
        readiness.ready
          ? (
              reviewingPromotion === skill.id
                ? renderPromotionReview(skill, readiness)
                : `
                  <p>
                    <strong>
                      Ready for promotion.
                    </strong>
                  </p>

                  <button
                    class="review-promotion"
                    data-skill="${skill.id}"
                  >
                    Review & Promote to
                    ${getLevelName(readiness.nextLevel)}
                  </button>
                `
            )
          : `
            <p>
              Demonstrate all next-level
              capabilities to become ready
              for promotion.
            </p>
          `
      }

    </div>
  `;
}


/* =========================================================
   PROMOTION REVIEW
   ========================================================= */

function renderPromotionReview(skill, readiness) {

  const nextLevelCapabilities =
    skill.capabilities
      .filter(
        capability =>
          capability.level === readiness.nextLevel
      )
      .sort(
        (a, b) =>
          (a.order || 0) - (b.order || 0)
      );

  return `
    <div class="promotion-review">

      <p>
        <strong>
          Review before promoting to
          ${getLevelName(readiness.nextLevel)}
        </strong>
      </p>

      <p>
        These capabilities will be credited
        for this promotion:
      </p>

      <div class="promotion-review-list">

        ${
          nextLevelCapabilities
            .map(capability => {

              const evidence =
                skill.evidence.find(
                  item =>
                    item.capabilityId === capability.id
                );

              return `
                <div class="promotion-review-item">

                  <p>
                    <strong>
                      ${escapeHTML(capability.title)}
                    </strong>
                  </p>

                  ${
                    evidence
                      ? `
                        <p>
                          Evidence:
                          <strong>
                            ${escapeHTML(evidence.type)}
                          </strong>
                          —
                          ${escapeHTML(evidence.title)}
                        </p>
                      `
                      : `
                        <p>
                          No evidence attached.
                        </p>
                      `
                  }

                </div>
              `;

            })
            .join("")
        }

      </div>

      <div class="promotion-review-actions">

        <button
          class="confirm-promotion"
          data-skill="${skill.id}"
        >
          Confirm Promotion
        </button>

        <button
          class="cancel-review-promotion"
          data-skill="${skill.id}"
        >
          Cancel
        </button>

      </div>

    </div>
  `;
}


/* =========================================================
   LEVEL HISTORY
   ========================================================= */

function renderLevelHistory(skill) {

  if (
    !Array.isArray(skill.levelHistory) ||
    skill.levelHistory.length === 0
  ) {

    return `
      <p>
        No level changes recorded yet.
      </p>
    `;
  }

  const history =
    [...skill.levelHistory]
      .sort(
        (a, b) =>
          b.changedAt - a.changedAt
      );

  return `
    <div class="skill-level-history">

      ${
        history
          .map(entry => `
            <div class="level-history-item">

              <p>

                <strong>
                  ${getLevelName(entry.fromLevel)}
                </strong>

                →

                <strong>
                  ${getLevelName(entry.toLevel)}
                </strong>

              </p>

              <p>
                ${new Date(
                  entry.changedAt
                ).toLocaleString()}
              </p>

            </div>
          `)
          .join("")
      }

    </div>
  `;
}


/* =========================================================
   RELATED PROJECTS
   ========================================================= */

function renderRelatedProjects(skill) {

  if (
    !Array.isArray(skill.relatedProjects) ||
    skill.relatedProjects.length === 0
  ) {

    return `
      <p>
        No related projects.
      </p>
    `;
  }

  const projects =
    skill.relatedProjects
      .map(projectId =>
        state.projects.find(
          project =>
            project.id === projectId
        )
      )
      .filter(Boolean);

  if (projects.length === 0) {

    return `
      <p>
        No related projects.
      </p>
    `;
  }

  return `
    <ul class="skill-related-projects">

      ${
        projects
          .map(project => `
            <li>
              ${renderLinkChip("project", project.id, project.name)}
            </li>
          `)
          .join("")
      }

    </ul>
  `;
}


/* =========================================================
   SKILL EVENTS
   ========================================================= */

function attachSkillEvents() {

  const app =
    document.getElementById("app");

  if (!app) return;


  /*
   * ADD SKILL
   */

  const addButton =
    document.getElementById("addSkillBtn");

  if (addButton) {

    addButton.addEventListener(
      "click",
      openAddSkillForm
    );
  }


  /*
   * CATEGORY FILTERS
   */

  document
    .querySelectorAll(".skill-filter")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(".skill-filter")
            .forEach(btn =>
              btn.classList.remove("active")
            );

          button.classList.add("active");

          openedSkill = null;

          renderSkillList(
            button.dataset.filter
          );
        }
      );
    });


  /*
   * SKILL LIST EVENT DELEGATION
   *
   * One listener handles every dynamically
   * generated skill/capability/evidence action.
   */

  const skillList =
    document.getElementById("skillList");

  if (!skillList) return;

  skillList.onclick =
    handleSkillListClick;
}


/* =========================================================
   SKILL LIST CLICK HANDLER
   ========================================================= */

function handleSkillListClick(event) {

  const target =
    event.target instanceof Element
      ? event.target
      : event.target.parentElement;

  if (!target) return;


  /*
   * SKILL HEADER
   */

  const header =
    target.closest(".skill-header");

  if (
    header &&
    !target.closest("button")
  ) {

    const id =
      header.dataset.id;

    openedSkill =
      openedSkill === id
        ? null
        : id;

    const activeFilter =
      document.querySelector(
        ".skill-filter.active"
      );

    renderSkillList(
      activeFilter
        ? activeFilter.dataset.filter
        : "All"
    );

    return;
  }


  /*
   * FIND ACTION BUTTON
   */

  const button =
    target.closest("button");

  if (!button) return;

  event.stopPropagation();


  /*
   * SKILL TAB SWITCH
   */

  if (button.dataset.action === "toggle-status") {

    const skill = findSkill(button.dataset.skill);

    if (!skill) return;

    skill.status = skill.status === "Active" ? "Paused" : "Active";

    saveData(state);

    openedSkill = skill.id;

    renderSkills(document.getElementById("app"));

    return;

  }

  if (
    button.classList.contains(
      "tab-btn"
    )
  ) {

    const skillId =
      button.dataset.skill;

    const tabName =
      button.dataset.tab;

    activeSkillTab[skillId] =
      tabName;

    const activeFilter =
      document.querySelector(".skill-filter.active");

    renderSkillList(
      activeFilter
        ? activeFilter.dataset.filter
        : "All"
    );

    return;

  }


  /*
   * ADD CAPABILITY
   */

  if (
    button.classList.contains(
      "add-capability"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (skill) {
      addCapability(skill);
    }

    return;
  }


  /*
   * EDIT CAPABILITY
   */

  if (
    button.classList.contains(
      "edit-capability"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (!skill) return;

    const capability =
      findCapability(
        skill,
        button.dataset.capability
      );

    if (capability) {
      editCapability(
        skill,
        capability
      );
    }

    return;
  }


  /*
   * DELETE CAPABILITY
   */

  if (
    button.classList.contains(
      "delete-capability"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (!skill) return;

    const capability =
      findCapability(
        skill,
        button.dataset.capability
      );

    if (capability) {
      deleteCapability(
        skill,
        capability
      );
    }

    return;
  }


  /*
   * MOVE CAPABILITY UP
   */

  if (
    button.classList.contains(
      "move-capability-up"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (!skill) return;

    const capability =
      findCapability(
        skill,
        button.dataset.capability
      );

    if (capability) {
      moveCapability(
        skill,
        capability,
        -1
      );
    }

    return;
  }


  /*
   * MOVE CAPABILITY DOWN
   */

  if (
    button.classList.contains(
      "move-capability-down"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (!skill) return;

    const capability =
      findCapability(
        skill,
        button.dataset.capability
      );

    if (capability) {
      moveCapability(
        skill,
        capability,
        1
      );
    }

    return;
  }


  /*
   * TOGGLE DEMONSTRATED
   */

  if (
    button.classList.contains(
      "capability-demonstrated"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (!skill) return;

    const capability =
      findCapability(
        skill,
        button.dataset.capability
      );

    if (capability) {
      toggleCapabilityDemonstrated(
        skill,
        capability
      );
    }

    return;
  }


  /*
   * ADD EVIDENCE
   */

  if (
    button.classList.contains(
      "add-evidence"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (!skill) return;

    const capability =
      findCapability(
        skill,
        button.dataset.capability
      );

    if (capability) {
      addEvidence(
        skill,
        capability
      );
    }

    return;
  }


  /*
   * EDIT EVIDENCE
   */

  if (
    button.classList.contains(
      "edit-evidence"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (!skill) return;

    const evidence =
      findEvidence(
        skill,
        button.dataset.evidence
      );

    if (evidence) {
      editEvidence(
        skill,
        evidence
      );
    }

    return;
  }


  /*
   * DELETE EVIDENCE
   */

  if (
    button.classList.contains(
      "delete-evidence"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (!skill) return;

    const evidence =
      findEvidence(
        skill,
        button.dataset.evidence
      );

    if (evidence) {
      deleteEvidence(
        skill,
        evidence
      );
    }

    return;
  }


    /*
   * REVIEW & PROMOTE (open review)
   */

  if (
    button.classList.contains(
      "review-promotion"
    )
  ) {

    reviewingPromotion =
      button.dataset.skill;

    openedSkill =
      button.dataset.skill;

    renderSkills(
      document.getElementById("app")
    );

    return;
  }


  /*
   * CANCEL REVIEW
   */

  if (
    button.classList.contains(
      "cancel-review-promotion"
    )
  ) {

    reviewingPromotion = null;

    renderSkills(
      document.getElementById("app")
    );

    return;
  }


  /*
   * CONFIRM PROMOTION (after review)
   */

  if (
    button.classList.contains(
      "confirm-promotion"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (skill) {
      promoteSkill(skill);
    }

    reviewingPromotion = null;

    return;
  }


  /*
   * EDIT SKILL
   */

  if (
    button.classList.contains(
      "edit-skill"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (skill) {
      editSkill(skill);
    }

    return;
  }


  /*
   * DELETE SKILL
   */

  if (
    button.classList.contains(
      "delete-skill"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (skill) {
      deleteSkill(skill);
    }
  }
}


/* =========================================================
   ADD SKILL
   ========================================================= */

function openAddSkillForm() {

  const categoryOptions =
    `<option value="" disabled selected>Select a category...</option>` +
    state.skillCategories
      .map(category => `
        <option value="${escapeHTML(category)}">${escapeHTML(category)}</option>
      `)
      .join("");

  const levelOptions =
    `<option value="" disabled selected>Select a level...</option>` +
    LEVELS
      .map((levelName, index) => `
        <option value="${index + 1}">${levelName}</option>
      `)
      .join("");

  const activeProjects =
    state.projects.filter(project => !project.archived);

  const projectCheckboxes =
    activeProjects
      .map(project => `
        <label class="modal-checkbox-row">
          <input type="checkbox" value="${project.id}" class="add-skill-project-checkbox">
          ${escapeHTML(project.name)}
        </label>
      `)
      .join("");

  openModal(`

    <h3>Add Skill</h3>

    <div id="addSkillError" class="auth-error"></div>

    <div class="modal-field">
      <label>Name</label>
      <input type="text" id="addSkillName" placeholder="e.g. React">
    </div>

    <div class="modal-field">
      <label>Category</label>
      <select id="addSkillCategory">${categoryOptions}</select>
    </div>

    <div class="modal-field">
      <label>Current Level</label>
      <select id="addSkillLevel">${levelOptions}</select>
    </div>

    <div class="modal-field">
      <label>Target Level</label>
      <select id="addSkillTargetLevel">${levelOptions}</select>
    </div>

    <div class="modal-field">
      <label>Status</label>
      <select id="addSkillStatus">
        <option value="" disabled selected>Select a status...</option>
        <option value="Active">Active</option>
        <option value="Paused">Paused</option>
      </select>
    </div>

    <div class="modal-field">
      <label>Description (optional)</label>
      <textarea id="addSkillDescription"></textarea>
    </div>

    ${
      activeProjects.length > 0
        ? `
          <div class="modal-field">
            <label>Related Projects (optional)</label>
            <div class="modal-checkbox-list">${projectCheckboxes}</div>
          </div>
        `
        : ""
    }

    <div class="modal-actions">
      <button class="modal-save" id="addSkillSave">Create Skill</button>
      <button class="modal-cancel" id="addSkillCancel">Cancel</button>
    </div>

  `);

  document
    .getElementById("addSkillCancel")
    .addEventListener("click", closeModal);

  document
    .getElementById("addSkillSave")
    .addEventListener("click", () => {

      const errorBox =
        document.getElementById("addSkillError");

      const name =
        document.getElementById("addSkillName").value.trim();

      if (!name) {

        showModalError(errorBox, "Skill name cannot be empty.");

        return;

      }

      const nameExists =
        state.skills.some(
          skill =>
            skill.name.toLowerCase() === name.toLowerCase()
        );

      if (nameExists) {

        showModalError(errorBox, "A skill with this name already exists.");

        return;

      }

      const category =
        document.getElementById("addSkillCategory").value;

      if (!category) {

        showModalError(errorBox, "Choose a category.");

        return;

      }

      const levelValue =
        document.getElementById("addSkillLevel").value;

      if (!levelValue) {

        showModalError(errorBox, "Choose a current level.");

        return;

      }

      const level = Number(levelValue);

      const targetLevelValue =
        document.getElementById("addSkillTargetLevel").value;

      if (!targetLevelValue) {

        showModalError(errorBox, "Choose a target level.");

        return;

      }

      const targetLevel = Number(targetLevelValue);

      if (targetLevel < level) {

        showModalError(errorBox, "Target level cannot be below current level.");

        return;

      }

      const status =
        document.getElementById("addSkillStatus").value;

      if (!status) {

        showModalError(errorBox, "Choose a status.");

        return;

      }

      const description =
        document.getElementById("addSkillDescription").value.trim();

      const relatedProjects =
        Array.from(
          document.querySelectorAll(".add-skill-project-checkbox:checked")
        ).map(checkbox => checkbox.value);

      state.skills.push({

        id: crypto.randomUUID(),
        name,
        category,
        level,
        targetLevel,
        status,
        description,
        capabilities: [],
        lastPracticed: null,
        relatedProjects,
        evidence: [],
        levelHistory: []

      });

      saveData(state);

      closeModal();

      openedSkill =
        state.skills[state.skills.length - 1].id;

      renderSkills(
        document.getElementById("app")
      );

    });

}


/* =========================================================
   EDIT SKILL
   ========================================================= */

function editSkill(skill) {

  const categoryOptions =
    state.skillCategories
      .map(category => `
        <option value="${escapeHTML(category)}" ${category === skill.category ? "selected" : ""}>
          ${escapeHTML(category)}
        </option>
      `)
      .join("");

  const levelOptions =
    LEVELS
      .map((levelName, index) => {

        const levelNum = index + 1;

        if (levelNum < skill.level) return "";

        return `
          <option value="${levelNum}" ${levelNum === skill.targetLevel ? "selected" : ""}>
            ${levelName}
          </option>
        `;

      })
      .join("");

  const isMastered =
    getDisplayStatus(skill) === "Mastered";

  const statusOptions =
    Object.values(STATUS_MAP)
      .map(name => `
        <option value="${name}" ${name === skill.status ? "selected" : ""}>
          ${name}
        </option>
      `)
      .join("");

  openModal(`

    <h3>Edit Skill</h3>

    <div id="editSkillError" class="auth-error"></div>

    <div class="modal-field">
      <label>Name</label>
      <input type="text" id="editSkillName" value="${escapeHTML(skill.name)}">
    </div>

    <div class="modal-field">
      <label>Category</label>
      <select id="editSkillCategory">${categoryOptions}</select>
    </div>

    <div class="modal-field">
      <label>Target Level (current: ${getLevelName(skill.level)}, locked — change via promotion)</label>
      <select id="editSkillTargetLevel">${levelOptions}</select>
    </div>

    <div class="modal-field">
      <label>Description</label>
      <textarea id="editSkillDescription">${escapeHTML(skill.description || "")}</textarea>
    </div>

    <div class="modal-actions">
      <button class="modal-save" id="editSkillSave">Save</button>
      <button class="modal-cancel" id="editSkillCancel">Cancel</button>
    </div>

  `);

  document
    .getElementById("editSkillCancel")
    .addEventListener("click", closeModal);

  document
    .getElementById("editSkillSave")
    .addEventListener("click", () => {

      const errorBox =
        document.getElementById("editSkillError");

      const newName =
        document.getElementById("editSkillName").value.trim();

      if (!newName) {

        showModalError(errorBox, "Skill name cannot be empty.");

        return;

      }

      const nameExists =
        state.skills.some(
          existingSkill =>
            existingSkill.id !== skill.id &&
            existingSkill.name.toLowerCase() ===
            newName.toLowerCase()
        );

      if (nameExists) {

        showModalError(errorBox, "A skill with this name already exists.");

        return;

      }

      const newCategory =
        document.getElementById("editSkillCategory").value;

      const newTargetLevel =
        Number(document.getElementById("editSkillTargetLevel").value);

      const newStatus =
        isMastered
          ? skill.status
          : document.getElementById("editSkillStatus").value;

      const newDescription =
        document.getElementById("editSkillDescription").value.trim();

      const wasMastered =
        getDisplayStatus(skill) === "Mastered";

      skill.name = newName;
      skill.category = newCategory;
      skill.targetLevel = newTargetLevel;
      skill.description = newDescription;

      const nowMastered =
        skill.level >= newTargetLevel || skill.level >= 5;

      if (wasMastered && !nowMastered) {

        skill.status = "Active";

      } else if (!isMastered) {

        skill.status = newStatus;

      }

      saveData(state);

      closeModal();

      openedSkill = skill.id;

      renderSkills(
        document.getElementById("app")
      );

    });

}


/* =========================================================
   PROMOTION
   ========================================================= */

function promoteSkill(skill) {

  const readiness =
    getNextLevelReadiness(skill);

  /*
   * HARD SAFETY CHECK
   *
   * The review screen is the confirmation
   * step now, so this is a last-line guard,
   * not the primary check.
   */

  if (!readiness.ready) {

    alert(
      "This skill is not ready for promotion."
    );

    return;
  }

  const fromLevel =
    skill.level;

  const toLevel =
    readiness.nextLevel;


  /*
   * ENSURE HISTORY
   */

  if (
    !Array.isArray(
      skill.levelHistory
    )
  ) {

    skill.levelHistory =
      [];
  }


  /*
   * CHANGE LEVEL
   */

  skill.level =
    toLevel;


  /*
   * RECORD HISTORY
   */

  skill.levelHistory.push({

    id:
      crypto.randomUUID(),

    fromLevel:
      fromLevel,

    toLevel:
      toLevel,

    changedAt:
      Date.now()

  });


  saveData(state);

  openedSkill =
    skill.id;

  renderSkills(
    document.getElementById("app")
  );
}


/* =========================================================
   DELETE SKILL
   ========================================================= */

function deleteSkill(skill) {

  confirmDelete({

    title: "Delete Skill",

    message: `This permanently removes "${skill.name}" and all its capabilities, evidence, and history.`,

    confirmText: skill.name,

    onConfirm: () => {

      state.skills =
        state.skills.filter(
          existingSkill => existingSkill.id !== skill.id
        );

      saveData(state);

      openedSkill = null;

      renderSkills(
        document.getElementById("app")
      );

    }

  });

}


/* =========================================================
   LEVEL HELPERS
   ========================================================= */


function askTargetLevel(
  currentLevel
) {

  const availableLevels =
    LEVELS
      .slice(currentLevel - 1)
      .map(
        (level, index) =>
          `${currentLevel + index}. ${level}`
      )
      .join("\n");

  const choice =
    prompt(
      "Target level:\n\n" +
      availableLevels +
      "\n\nEnter a number:"
    );

  if (choice === null) {
    return null;
  }

  const targetLevel =
    Number(
      choice.trim()
    );

  if (
    !Number.isInteger(targetLevel) ||
    targetLevel < currentLevel ||
    targetLevel > 5
  ) {

    alert(
      "Invalid target level.\n\n" +
      "Target level cannot be below " +
      "your current level."
    );

    return null;
  }

  return targetLevel;
}


function askTargetLevelWithDefault(
  currentLevel,
  currentTarget
) {

  let defaultValue =
    currentTarget;

  if (
    !Number.isInteger(defaultValue) ||
    defaultValue < currentLevel
  ) {

    defaultValue =
      currentLevel;
  }

  const availableLevels =
    LEVELS
      .slice(currentLevel - 1)
      .map(
        (level, index) =>
          `${currentLevel + index}. ${level}`
      )
      .join("\n");

  const choice =
    prompt(
      "Target level:\n\n" +
      availableLevels +
      "\n\nEnter a number:",
      String(defaultValue)
    );

  if (choice === null) {
    return null;
  }

  const targetLevel =
    Number(
      choice.trim()
    );

  if (
    !Number.isInteger(targetLevel) ||
    targetLevel < currentLevel ||
    targetLevel > 5
  ) {

    alert(
      "Invalid target level.\n\n" +
      "Target level cannot be below " +
      "your current level."
    );

    return null;
  }

  return targetLevel;
}


export function getLevelName(level) {

  return (
    LEVELS[level - 1] ||
    "Unknown"
  );
}


/* =========================================================
   CAPABILITY FRAMEWORK
   ========================================================= */

function renderCapabilities(skill) {

  const levels = [
    1,
    2,
    3,
    4,
    5
  ];

  return `
    <div class="capability-framework">

      ${
        levels
          .map(level =>
            renderCapabilityLevel(
              skill,
              level
            )
          )
          .join("")
      }

      <button
        class="add-capability"
        data-skill="${skill.id}"
      >
        + Add Capability
      </button>

    </div>
  `;
}


function renderCapabilityLevel(
  skill,
  level
) {

  const capabilities =
    skill.capabilities
      .filter(
        capability =>
          capability.level === level
      )
      .sort(
        (a, b) =>
          (a.order || 0) -
          (b.order || 0)
      );

  const progress =
    getCapabilityProgress(
      skill,
      level
    );

  return `
    <div class="capability-level">

      <div class="capability-level-header">

        <h5>
          ${getLevelName(level)}
        </h5>

        ${
          progress.total > 0
            ? `
              <span class="capability-progress">
                ${progress.demonstrated}
                /
                ${progress.total}
                demonstrated
              </span>
            `
            : ""
        }

      </div>

      ${
        capabilities.length === 0
          ? `
            <p class="capability-empty">
              No capabilities defined yet.
            </p>
          `
          : `
            <div class="capability-list">

              ${
                capabilities
                  .map(
                    (capability, index) =>
                      renderCapability(
                        skill,
                        capability,
                        index,
                        capabilities.length
                      )
                  )
                  .join("")
              }

            </div>
          `
      }

    </div>
  `;
}


function renderCapability(
  skill,
  capability,
  index,
  total
) {

  return `
    <div
      class="capability-item"
      data-capability="${capability.id}"
    >

      <div class="capability-content">

        <button
          class="capability-demonstrated"
          data-skill="${skill.id}"
          data-capability="${capability.id}"
          title="${
            capability.demonstrated
              ? "Mark as not demonstrated"
              : "Mark as demonstrated"
          }"
        >

          <span class="capability-check">
            ${
              capability.demonstrated
                ? "☑"
                : "☐"
            }
          </span>

          <strong
            class="${
              capability.demonstrated
                ? "capability-demonstrated-text"
                : ""
            }"
          >
            ${escapeHTML(
              capability.title
            )}
          </strong>

        </button>

      </div>

      <div class="capability-actions">

        <button
          class="move-capability-up"
          data-skill="${skill.id}"
          data-capability="${capability.id}"
          ${index === 0 ? "disabled" : ""}
          title="Move up"
        >
          ↑
        </button>

        <button
          class="move-capability-down"
          data-skill="${skill.id}"
          data-capability="${capability.id}"
          ${index === total - 1 ? "disabled" : ""}
          title="Move down"
        >
          ↓
        </button>

        <button
          class="edit-capability"
          data-skill="${skill.id}"
          data-capability="${capability.id}"
        >
          Edit
        </button>

        <button
          class="delete-capability"
          data-skill="${skill.id}"
          data-capability="${capability.id}"
        >
          Delete
        </button>

      </div>

    </div>
  `;
}


/* =========================================================
   CAPABILITY ACTIONS
   ========================================================= */

function addCapability(skill) {

  const levelOptions =
    LEVELS
      .map((levelName, index) => `
        <option value="${index + 1}" ${index + 1 === skill.level ? "selected" : ""}>${levelName}</option>
      `)
      .join("");

  const validLevelOptions =
    LEVELS
      .map((levelName, index) => {

        const levelNum = index + 1;

        if (levelNum < skill.level) return "";

        return `<option value="${levelNum}" ${levelNum === skill.level ? "selected" : ""}>${levelName}</option>`;

      })
      .join("");

  openModal(`

    <h3>Add Capability</h3>

    <div id="addCapabilityError" class="auth-error"></div>

    <div class="modal-field">
      <label>Capability (something you should be able to do at this level)</label>
      <input type="text" id="addCapabilityTitle">
    </div>

    <div class="modal-field">
      <label>Level (current level or above — past levels are locked)</label>
      <select id="addCapabilityLevel">${validLevelOptions}</select>
    </div>

    <div class="modal-actions">
      <button class="modal-save" id="addCapabilitySave">Add</button>
      <button class="modal-cancel" id="addCapabilityCancel">Cancel</button>
    </div>

  `);

  document
    .getElementById("addCapabilityCancel")
    .addEventListener("click", closeModal);

  document
    .getElementById("addCapabilitySave")
    .addEventListener("click", () => {

      const errorBox =
        document.getElementById("addCapabilityError");

      const trimmedTitle =
        document.getElementById("addCapabilityTitle").value.trim();

      if (!trimmedTitle) {

        showModalError(errorBox, "Capability cannot be empty.");

        return;

      }

      const level =
        Number(document.getElementById("addCapabilityLevel").value);

      const levelCapabilities =
        skill.capabilities.filter(c => c.level === level);

      const titleExists =
        levelCapabilities.some(
          c => c.title.toLowerCase() === trimmedTitle.toLowerCase()
        );

      if (titleExists) {

        showModalError(errorBox, "A capability with this name already exists at this level.");

        return;

      }

      skill.capabilities.push({
        id: crypto.randomUUID(),
        title: trimmedTitle,
        level,
        order: levelCapabilities.length + 1,
        demonstrated: false
      });

      normalizeCapabilityOrder(skill);

      saveData(state);

      closeModal();

      openedSkill = skill.id;

      renderSkills(
        document.getElementById("app")
      );

    });

}


function editCapability(
  skill,
  capability
) {

  const levelOptions =
    LEVELS
      .map((levelName, index) => {

        const levelNum = index + 1;

        if (levelNum < skill.level) return "";

        return `<option value="${levelNum}" ${levelNum === capability.level ? "selected" : ""}>${levelName}</option>`;

      })
      .join("");

  openModal(`

    <h3>Edit Capability</h3>

    <div id="editCapabilityError" class="auth-error"></div>

    <div class="modal-field">
      <label>Capability</label>
      <input type="text" id="editCapabilityTitle" value="${capability.title}">
    </div>

    <div class="modal-field">
      <label>Level</label>
      <select id="editCapabilityLevel">${levelOptions}</select>
    </div>

    <div class="modal-actions">
      <button class="modal-save" id="editCapabilitySave">Save</button>
      <button class="modal-cancel" id="editCapabilityCancel">Cancel</button>
    </div>

  `);

  document
    .getElementById("editCapabilityCancel")
    .addEventListener("click", closeModal);

  document
    .getElementById("editCapabilitySave")
    .addEventListener("click", () => {

      const errorBox =
        document.getElementById("editCapabilityError");

      const trimmedTitle =
        document.getElementById("editCapabilityTitle").value.trim();

      if (!trimmedTitle) {

        showModalError(errorBox, "Capability cannot be empty.");

        return;

      }

      const oldLevel = capability.level;

      const level =
        Number(document.getElementById("editCapabilityLevel").value);

      capability.title = trimmedTitle;

      capability.level = level;

      if (oldLevel !== level) {

        normalizeCapabilityOrder(skill);

      }

      saveData(state);

      closeModal();

      openedSkill = skill.id;

      renderSkills(
        document.getElementById("app")
      );

    });

}


function deleteCapability(
  skill,
  capability
) {

  confirmSimple({

    title: "Delete Capability",

    message: `Delete "${capability.title}"? Any evidence attached to it will also be removed.`,

    onConfirm: () => {

      skill.capabilities =
        skill.capabilities.filter(
          c => c.id !== capability.id
        );

      skill.evidence =
        skill.evidence.filter(
          e => e.capabilityId !== capability.id
        );

      normalizeCapabilityOrder(skill);

      saveData(state);

      openedSkill = skill.id;

      renderSkills(
        document.getElementById("app")
      );

    }

  });

}


function moveCapability(
  skill,
  capability,
  direction
) {

  const sameLevel =
    skill.capabilities
      .filter(
        item =>
          item.level === capability.level
      )
      .sort(
        (a, b) =>
          (a.order || 0) -
          (b.order || 0)
      );

  const currentIndex =
    sameLevel.findIndex(
      item =>
        item.id === capability.id
    );

  if (currentIndex === -1) {
    return;
  }

  const newIndex =
    currentIndex + direction;

  if (
    newIndex < 0 ||
    newIndex >= sameLevel.length
  ) {
    return;
  }

  [
    sameLevel[currentIndex],
    sameLevel[newIndex]
  ] = [
    sameLevel[newIndex],
    sameLevel[currentIndex]
  ];

  sameLevel.forEach(
    (item, index) => {
      item.order =
        index + 1;
    }
  );

  saveData(state);

  openedSkill =
    skill.id;

  renderSkills(
    document.getElementById("app")
  );
}


function normalizeCapabilityOrder(skill) {

  if (
    !Array.isArray(
      skill.capabilities
    )
  ) {
    return;
  }

  for (
    let level = 1;
    level <= 5;
    level++
  ) {

    const capabilities =
      skill.capabilities
        .filter(
          capability =>
            capability.level === level
        )
        .sort(
          (a, b) =>
            (a.order || 0) -
            (b.order || 0)
        );

    capabilities.forEach(
      (capability, index) => {

        capability.order =
          index + 1;

      }
    );
  }
}


function toggleCapabilityDemonstrated(
  skill,
  capability
) {

  capability.demonstrated =
    !capability.demonstrated;

  capability.demonstratedAt =
    capability.demonstrated
      ? Date.now()
      : null;

  saveData(state);

  openedSkill =
    skill.id;

  renderSkills(
    document.getElementById("app")
  );
}


/* =========================================================
   EVIDENCE
   ========================================================= */

function renderSkillEvidence(skill) {

  if (
    !Array.isArray(skill.evidence)
  ) {
    skill.evidence = [];
  }

  if (
    !Array.isArray(skill.capabilities) ||
    skill.capabilities.length === 0
  ) {

    return `
      <p>
        Add capabilities first to attach evidence.
      </p>
    `;
  }

  return `
    <div class="evidence-list">

      ${
        skill.capabilities
          .map(capability => {

            const evidence =
              skill.evidence.find(
                item =>
                  item.capabilityId ===
                  capability.id
              );

            return renderCapabilityEvidence(
              skill,
              capability,
              evidence
            );

          })
          .join("")
      }

    </div>
  `;
}


function renderCapabilityEvidence(
  skill,
  capability,
  evidence
) {

  if (!evidence) {

    return `
      <div class="evidence-item">

        <p>
          <strong>
            ${escapeHTML(
              capability.title
            )}
          </strong>
        </p>

        <p>
          No evidence recorded.
        </p>

        <button
          class="add-evidence"
          data-skill="${skill.id}"
          data-capability="${capability.id}"
        >
          + Add Evidence
        </button>

      </div>
    `;
  }

  return `
    <div class="evidence-item">

      <p>
        <strong>
          ${escapeHTML(
            capability.title
          )}
        </strong>
      </p>

      <p>
        Type:
        <strong>
          ${escapeHTML(
            evidence.type
          )}
        </strong>
      </p>

      <p>
        <strong>
          ${escapeHTML(
            evidence.title
          )}
        </strong>
      </p>

      <p>
        ${escapeHTML(
          evidence.description
        )}
      </p>

      ${
        evidence.projectId
          ? renderEvidenceProject(
              evidence.projectId
            )
          : ""
      }

      ${
        evidence.url
          ? `
            <p>
              Link:
              <a
                href="${escapeHTML(
                  evidence.url
                )}"
                target="_blank"
                rel="noopener noreferrer"
              >
                ${escapeHTML(
                  evidence.url
                )}
              </a>
            </p>
          `
          : ""
      }

      <div class="evidence-actions">

        <button
          class="edit-evidence"
          data-skill="${skill.id}"
          data-capability="${capability.id}"
          data-evidence="${evidence.id}"
        >
          Edit
        </button>

        <button
          class="delete-evidence"
          data-skill="${skill.id}"
          data-capability="${capability.id}"
          data-evidence="${evidence.id}"
        >
          Delete
        </button>

      </div>

    </div>
  `;
}


function renderEvidenceProject(
  projectId
) {

  const project =
    state.projects.find(
      project =>
        project.id === projectId
    );

  if (!project) {

    return `
      <p>
        Project: Unknown project
      </p>
    `;
  }

  return `
    <p>
      Project:
      <strong>
        ${escapeHTML(
          project.name
        )}
      </strong>
    </p>
  `;
}


function addEvidence(
  skill,
  capability
) {

  if (!Array.isArray(skill.evidence)) {
    skill.evidence = [];
  }

  const existingEvidence =
    skill.evidence.find(
      e => e.capabilityId === capability.id
    );

  if (existingEvidence) {

    openModal(`
      <h3>Evidence Already Exists</h3>
      <p>This capability already has evidence. Edit or delete the existing evidence first.</p>
      <div class="modal-actions">
        <button class="modal-cancel" id="evidenceExistsClose">Close</button>
      </div>
    `);

    document
      .getElementById("evidenceExistsClose")
      .addEventListener("click", closeModal);

    return;

  }

  const availableProjects =
    state.projects.filter(p => !p.archived);

  const projectOptions =
    availableProjects
      .map(p => `<option value="${p.id}">${escapeHTML(p.name)}</option>`)
      .join("");

  openModal(`

    <h3>Add Evidence</h3>

    <div id="addEvidenceError" class="auth-error"></div>

    <div class="modal-field">
      <label>Type</label>
      <select id="evidenceType">
        <option value="" disabled selected>Select a type...</option>
        <option value="Project">Project</option>
        <option value="Link">Link</option>
        <option value="Document">Document</option>
        <option value="Achievement">Achievement</option>
        <option value="Note">Note</option>
        <option value="Artifact">Artifact</option>
      </select>
    </div>

    <div class="modal-field">
      <label>Title</label>
      <input type="text" id="evidenceTitle">
    </div>

    <div class="modal-field">
      <label>Description</label>
      <input type="text" id="evidenceDescription">
    </div>

    <div class="modal-field" id="evidenceProjectField" style="display:none">
      <label>Project</label>
      <select id="evidenceProject">
        <option value="" disabled selected>Select a project...</option>
        ${projectOptions}
      </select>
    </div>

    <div class="modal-field" id="evidenceUrlField" style="display:none">
      <label>URL (optional)</label>
      <input type="text" id="evidenceUrl" placeholder="https://...">
    </div>

    <div class="modal-actions">
      <button class="modal-save" id="addEvidenceSave">Add Evidence</button>
      <button class="modal-cancel" id="addEvidenceCancel">Cancel</button>
    </div>

  `);

  document
    .getElementById("evidenceType")
    .addEventListener("change", event => {

      const type = event.target.value;

      document.getElementById("evidenceProjectField").style.display =
        type === "Project" ? "" : "none";

      document.getElementById("evidenceUrlField").style.display =
        (type === "Link" || type === "Document" || type === "Artifact") ? "" : "none";

    });

  document
    .getElementById("addEvidenceCancel")
    .addEventListener("click", closeModal);

  document
    .getElementById("addEvidenceSave")
    .addEventListener("click", () => {

      const errorBox =
        document.getElementById("addEvidenceError");

      const type =
        document.getElementById("evidenceType").value;

      if (!type) {

        showModalError(errorBox, "Choose an evidence type.");

        return;

      }

      const title =
        document.getElementById("evidenceTitle").value.trim();

      if (!title) {

        showModalError(errorBox, "Evidence title cannot be empty.");

        return;

      }

      const description =
        document.getElementById("evidenceDescription").value.trim();

      if (!description) {

        showModalError(errorBox, "Evidence description cannot be empty.");

        return;

      }

      let projectId = null;

      if (type === "Project") {

        projectId =
          document.getElementById("evidenceProject").value;

        if (!projectId) {

          showModalError(errorBox, "Choose a project.");

          return;

        }

      }

      let url = null;

      if (type === "Link" || type === "Document" || type === "Artifact") {

        const rawUrl =
          document.getElementById("evidenceUrl").value.trim();

        if (rawUrl) {

          if (!/^https?:\/\/.+\..+/.test(rawUrl)) {

            showModalError(errorBox, "Enter a valid URL starting with http:// or https://");

            return;

          }

          url = rawUrl;

        }

      }

      skill.evidence.push({
        id: crypto.randomUUID(),
        capabilityId: capability.id,
        type,
        title,
        description,
        projectId,
        url,
        createdAt: Date.now()
      });

      saveData(state);

      closeModal();

      openedSkill = skill.id;

      renderSkills(
        document.getElementById("app")
      );

    });

}


function editEvidence(
  skill,
  evidence
) {

  const showUrl =
    evidence.type === "Link" ||
    evidence.type === "Document" ||
    evidence.type === "Artifact";

  openModal(`

    <h3>Edit Evidence</h3>

    <div id="editEvidenceError" class="auth-error"></div>

    <div class="modal-field">
      <label>Title</label>
      <input type="text" id="editEvidenceTitle" value="${evidence.title}">
    </div>

    <div class="modal-field">
      <label>Description</label>
      <input type="text" id="editEvidenceDescription" value="${evidence.description}">
    </div>

    ${
      showUrl
        ? `
          <div class="modal-field">
            <label>URL (optional)</label>
            <input type="text" id="editEvidenceUrl" value="${evidence.url || ""}">
          </div>
        `
        : ""
    }

    <div class="modal-actions">
      <button class="modal-save" id="editEvidenceSave">Save</button>
      <button class="modal-cancel" id="editEvidenceCancel">Cancel</button>
    </div>

  `);

  document
    .getElementById("editEvidenceCancel")
    .addEventListener("click", closeModal);

  document
    .getElementById("editEvidenceSave")
    .addEventListener("click", () => {

      const errorBox =
        document.getElementById("editEvidenceError");

      const title =
        document.getElementById("editEvidenceTitle").value.trim();

      if (!title) {

        showModalError(errorBox, "Evidence title cannot be empty.");

        return;

      }

      const description =
        document.getElementById("editEvidenceDescription").value.trim();

      if (!description) {

        showModalError(errorBox, "Evidence description cannot be empty.");

        return;

      }

      evidence.title = title;

      evidence.description = description;

      if (showUrl) {

        const rawUrl =
          document.getElementById("editEvidenceUrl").value.trim();

        if (rawUrl && !/^https?:\/\/.+\..+/.test(rawUrl)) {

          showModalError(errorBox, "Enter a valid URL starting with http:// or https://");

          return;

        }

        evidence.url = rawUrl || null;

      }

      saveData(state);

      closeModal();

      openedSkill = skill.id;

      renderSkills(
        document.getElementById("app")
      );

    });

}


function deleteEvidence(
  skill,
  evidence
) {

  confirmSimple({

    title: "Delete Evidence",

    message: `Delete evidence "${evidence.title}"?`,

    onConfirm: () => {

      skill.evidence =
        skill.evidence.filter(
          e => e.id !== evidence.id
        );

      saveData(state);

      openedSkill = skill.id;

      renderSkills(
        document.getElementById("app")
      );

    }

  });

}

/* =========================================================
   PROMOTION
   ========================================================= */


function finishPromotion(skill, fromLevel, toLevel) {

  if (!Array.isArray(skill.levelHistory)) {

    skill.levelHistory = [];

  }

  skill.level =
    toLevel;

  skill.levelHistory.push({

    id: crypto.randomUUID(),
    fromLevel: fromLevel,
    toLevel: toLevel,
    changedAt: Date.now()

  });

  saveData(state);

  openedSkill =
    skill.id;

  renderSkills(
    document.getElementById("app")
  );

}


/* =========================================================
   PRACTICE
   ========================================================= */

function getSkillSessions(
  skillId
) {

  return (
    Array.isArray(state.sessions)
      ? state.sessions
      : []
  ).filter(
    session =>
      session.skillId === skillId
  );
}


function getSkillPracticeTime(
  skillId
) {

  return getSkillSessions(
    skillId
  ).reduce(
    (total, session) =>
      total +
      (
        Number(
          session.duration
        ) || 0
      ),
    0
  );
}


function getSkillSessionCount(
  skillId
) {

  return getSkillSessions(
    skillId
  ).length;
}


function getSkillLastPracticed(
  skillId
) {

  const sessions =
    getSkillSessions(
      skillId
    );

  if (
    sessions.length === 0
  ) {
    return null;
  }

  const latest =
    sessions.reduce(
      (latest, session) => {

        if (
          !latest ||
          (
            Number(session.end) >
            Number(latest.end)
          )
        ) {
          return session;
        }

        return latest;
      },
      null
    );

  return latest
    ? latest.end
    : null;
}

function getWeekRangeHours(
  skillId,
  weeksAgo
) {

  const sessions =
    getSkillSessions(skillId);

  const now = new Date();

  const day = now.getDay();

  const mondayOffset =
    day === 0 ? -6 : 1 - day;

  const currentMonday =
    new Date(now);

  currentMonday.setDate(
    now.getDate() + mondayOffset
  );

  currentMonday.setHours(0, 0, 0, 0);

  const rangeStart =
    new Date(currentMonday);

  rangeStart.setDate(
    currentMonday.getDate() - (7 * weeksAgo)
  );

  const rangeEnd =
    new Date(rangeStart);

  rangeEnd.setDate(
    rangeStart.getDate() + 7
  );

  const total =
    sessions
      .filter(session => {

        const end =
          new Date(session.end);

        return (
          end >= rangeStart &&
          end < rangeEnd
        );

      })
      .reduce(
        (sum, session) =>
          sum + (Number(session.duration) || 0),
        0
      );

  return total / 3600000;

}


function getConsistencyDays(
  skillId
) {

  const sessions =
    getSkillSessions(skillId);

  const now = new Date();

  const cutoff =
    new Date(now);

  cutoff.setDate(
    now.getDate() - 6
  );

  cutoff.setHours(0, 0, 0, 0);

  const days = new Set();

  sessions.forEach(session => {

    const end =
      new Date(session.end);

    if (end >= cutoff) {

      days.add(
        end.toDateString()
      );

    }

  });

  return days.size;

}


function getStaleLevel(skill) {

  if (getDisplayStatus(skill) !== "Active") {
    return "none";
  }

  const lastPracticed =
    getSkillLastPracticed(skill.id);

  if (!lastPracticed) {
    return "none";
  }

  const daysSince =
    Math.floor(
      (Date.now() - lastPracticed) /
      (1000 * 60 * 60 * 24)
    );

  if (daysSince >= 30) {
    return "red";
  }

  if (daysSince >= 14) {
    return "yellow-strong";
  }

  if (daysSince >= 7) {
    return "yellow-soft";
  }

  return "none";

}


function getStaleGlowClass(skill) {

  const level =
    getStaleLevel(skill);

  if (level === "none") return "";

  return `stale-glow-${level}`;

}


function renderPracticeTrend(skill) {

  const thisWeek =
    getWeekRangeHours(skill.id, 0);

  const lastWeek =
    getWeekRangeHours(skill.id, 1);

  const consistency =
    getConsistencyDays(skill.id);

  let direction = "flat";

  if (thisWeek > lastWeek) {
    direction = "up";
  } else if (thisWeek < lastWeek) {
    direction = "down";
  }

  const arrow =
    direction === "up"
      ? "↑"
      : direction === "down"
        ? "↓"
        : "→";

  return `
    <p>
      This week vs last week:
      <strong>
        ${thisWeek.toFixed(1)}h
        ${arrow}
        ${lastWeek.toFixed(1)}h
      </strong>
    </p>

    <p>
      Consistency:
      <strong>
        ${consistency} of last 7 days
      </strong>
    </p>
  `;

}


function renderStaleMessage(skill) {

  const level =
    getStaleLevel(skill);

  if (level === "none") {
    return "";
  }

  const lastPracticed =
    getSkillLastPracticed(skill.id);

  const daysSince =
    Math.floor(
      (Date.now() - lastPracticed) /
      (1000 * 60 * 60 * 24)
    );

  return `
    <p class="stale-message stale-${level}">
      Not practiced in ${daysSince} days.
    </p>
  `;

}

function formatSkillPracticeTime(
  ms
) {

  const totalSeconds =
    Math.floor(
      ms / 1000
    );

  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    );

  if (hours > 0) {

    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {

    return `${minutes}m`;
  }

  return "0m";
}


/* =========================================================
   CAPABILITY PROGRESS / READINESS
   ========================================================= */

export function getCapabilityProgress(
  skill,
  level
) {

  const capabilities =
    (
      Array.isArray(
        skill.capabilities
      )
        ? skill.capabilities
        : []
    ).filter(
      capability =>
        capability.level === level
    );

  const demonstrated =
    capabilities.filter(
      capability =>
        capability.demonstrated === true
    );

  return {

    total:
      capabilities.length,

    demonstrated:
      demonstrated.length

  };
}


function getNextLevelReadiness(
  skill
) {

  const currentLevel =
    Number(skill.level);

  const targetLevel =
    Number(skill.targetLevel);

  const nextLevel =
    currentLevel + 1;


  /*
   * MAX LEVEL
   */

  if (
    nextLevel > 5
  ) {

    return {

      nextLevel:
        null,

      total:
        0,

      demonstrated:
        0,

      ready:
        false,

      reason:
        "max-level"

    };
  }


  /*
   * TARGET REACHED
   */

  if (
    targetLevel <= currentLevel
  ) {

    return {

      nextLevel:
        nextLevel,

      total:
        0,

      demonstrated:
        0,

      ready:
        false,

      reason:
        "target-reached"

    };
  }


  /*
   * NEXT LEVEL CAPABILITIES
   */

  const progress =
    getCapabilityProgress(
      skill,
      nextLevel
    );


  /*
   * NO CAPABILITIES
   */

  if (
    progress.total === 0
  ) {

    return {

      nextLevel:
        nextLevel,

      total:
        0,

      demonstrated:
        0,

      ready:
        false,

      reason:
        "no-capabilities"

    };
  }


  /*
   * FULL READINESS
   */

  const ready =
    progress.demonstrated ===
    progress.total;

  return {

    nextLevel:
      nextLevel,

    total:
      progress.total,

    demonstrated:
      progress.demonstrated,

    ready:
      ready,

    reason:
      ready
        ? "ready"
        : "capabilities-incomplete"

  };
}


/* =========================================================
   DATA SAFETY
   ========================================================= */

function ensureSkillData(
  skill
) {

  if (
    !Array.isArray(
      skill.capabilities
    )
  ) {

    skill.capabilities = [];
  }

  if (
    !Array.isArray(
      skill.evidence
    )
  ) {

    skill.evidence = [];
  }

  if (
    !Array.isArray(
      skill.levelHistory
    )
  ) {

    skill.levelHistory = [];
  }

  if (
    !Array.isArray(
      skill.relatedProjects
    )
  ) {

    skill.relatedProjects = [];
  }
}


/* =========================================================
   LOOKUP HELPERS
   ========================================================= */

function findSkill(
  skillId
) {

  return state.skills.find(
    skill =>
      skill.id === skillId
  );
}


function findCapability(
  skill,
  capabilityId
) {

  return (
    skill.capabilities || []
  ).find(
    capability =>
      capability.id ===
      capabilityId
  );
}


function findEvidence(
  skill,
  evidenceId
) {

  return (
    skill.evidence || []
  ).find(
    evidence =>
      evidence.id ===
      evidenceId
  );
}


/* =========================================================
   HTML SAFETY
   ========================================================= */

function escapeHTML(
  value
) {

  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}
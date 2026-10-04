import { saveData, loadUserData } from "./storage.js";

/*
 * ============================================================
 * CAREER OS — GLOBAL STATE
 * ============================================================
 *
 * state starts empty. initState(uid) populates it once a
 * user's Firestore document has loaded, then runs the same
 * migrations that used to run synchronously at import time.
 *
 * state is mutated in place (never reassigned), so every
 * module that already did `import { state } from "./state.js"`
 * keeps working exactly as before once initState resolves.
 * ============================================================
 */

export const state = {};


export async function initState(uid) {

  const loaded =
    await loadUserData(uid);

  Object.assign(
    state,
    loaded || {}
  );

  runMigrations();

  saveData(state);

  return state;
}


export function clearState() {

  Object.keys(state).forEach(
    key => delete state[key]
  );

}


function runMigrations() {

  /* ============================================================
     BASE STATE INITIALIZATION
     ============================================================ */

  if (!Array.isArray(state.skills)) {
    state.skills = [];
  }

  if (!Array.isArray(state.skillCategories)) {
    state.skillCategories = [
      "Technical",
      "Creative",
      "Business",
      "Other"
    ];
  }

  if (!Array.isArray(state.tasks)) {
    state.tasks = [];
  }

  if (!Array.isArray(state.projects)) {
    state.projects = [];
  }

  if (!Array.isArray(state.careerGoals)) {
    state.careerGoals = [];
  }

  if (!Array.isArray(state.categories)) {

    state.categories = [
      { id: crypto.randomUUID(), name: "Deep Work", group: "Focus", builtIn: true },
      { id: crypto.randomUUID(), name: "Study", group: "Focus", builtIn: true },
      { id: crypto.randomUUID(), name: "Scrolling", group: "Distraction", builtIn: true },
      { id: crypto.randomUUID(), name: "Gaming", group: "Distraction", builtIn: true },
      { id: crypto.randomUUID(), name: "Exercise", group: "Neutral", builtIn: true }
    ];

  }

  if (
    !state.settings ||
    typeof state.settings !== "object"
  ) {

    state.settings = {
      weeklyTarget: 20,
      distractionLimit: 3
    };

  }

  if (!Array.isArray(state.sessions)) {
    state.sessions = [];
  }

  if (!Array.isArray(state.captures)) {
    state.captures = [];
  }

  if (!("activeTimer" in state)) {
    state.activeTimer = null;
  }


  /* ============================================================
     SKILLS OS — CAPABILITY + EVIDENCE MIGRATION
     ============================================================ */

  state.skills.forEach(skill => {

    if (!Array.isArray(skill.capabilities)) {
      skill.capabilities = [];
    }

    if (!Array.isArray(skill.evidence)) {
      skill.evidence = [];
    }

    if (!Array.isArray(skill.levelHistory)) {
      skill.levelHistory = [];
    }

    if (!Array.isArray(skill.relatedProjects)) {
      skill.relatedProjects = [];
    }

    skill.capabilities.forEach(capability => {

      if (typeof capability.demonstrated !== "boolean") {
        capability.demonstrated = false;
      }

      if (!("demonstratedAt" in capability)) {
        capability.demonstratedAt = null;
      }

    });

  });


  /* ============================================================
     CAREER GOALS MIGRATION
     ============================================================ */

  state.careerGoals.forEach(goal => {

    if (!Array.isArray(goal.requiredSkillIds)) {
      goal.requiredSkillIds = [];
    }

    if (!Array.isArray(goal.roadmap)) {
      goal.roadmap = [];
    }

    if (!Array.isArray(goal.relatedProjects)) {
      goal.relatedProjects = [];
    }

    goal.roadmap.forEach(stage => {

      if (!("completedAt" in stage)) {
        stage.completedAt = null;
      }

    });

  });


  /* ============================================================
     PROJECT ID MIGRATION
     ============================================================ */

  state.projects.forEach(project => {

    if (typeof project.id === "number") {
      project.id = crypto.randomUUID();
    }

  });


  /* ============================================================
     PROJECT MILESTONES
     ============================================================ */

  state.projects.forEach(project => {

    if (!Array.isArray(project.milestones)) {
      project.milestones = [];
    }

    project.milestones.forEach(milestone => {

      if (!("completedAt" in milestone)) {
        milestone.completedAt = null;
      }

    });

  });

}
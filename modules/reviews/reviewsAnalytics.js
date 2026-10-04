/*
 * REVIEWS ANALYTICS
 *
 * Pure computation over state.sessions / state.projects.
 * No rendering, no charts — just correct period math.
 *
 * Week definition: Monday-start, used consistently
 * across all Reviews calculations.
 */


/* =========================================================
   PERIOD RANGES
   ========================================================= */

export function getPeriodRange(periodType, offset = 0) {

  const now = new Date();

  if (periodType === "week") {

    const weekStart =
      state.settings?.weekStart || "monday";

    const baseStart =
      getWeekStartDate(now, weekStart);

    const start = new Date(baseStart);

    start.setDate(start.getDate() + (offset * 7));

    const end = new Date(start);

    end.setDate(start.getDate() + 7);

    return { start, end };

  }

  if (periodType === "month") {

    const start =
      new Date(
        now.getFullYear(),
        now.getMonth() + offset,
        1
      );

    start.setHours(0, 0, 0, 0);

    const end =
      new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        1
      );

    return { start, end };

  }

  if (periodType === "year") {

    const start =
      new Date(
        now.getFullYear() + offset,
        0,
        1
      );

    start.setHours(0, 0, 0, 0);

    const end =
      new Date(
        start.getFullYear() + 1,
        0,
        1
      );

    return { start, end };

  }

    /*
   * ALL-TIME
   *
   * IMPORTANT: end must be "now", not the
   * theoretical JS max date — using the max
   * date causes trend-bucket generation to loop
   * for millions of iterations and freeze the tab.
   */

  return {
    start: new Date(0),
    end: new Date()
  };

}


export function getPreviousPeriodRange(periodType, offset) {

  return getPeriodRange(periodType, offset - 1);

}


/* =========================================================
   SESSION FILTERING
   ========================================================= */

export function getSessionsInRange(sessions, range) {

  return sessions.filter(session => {

    const start = new Date(session.start);

    return (
      start >= range.start &&
      start < range.end
    );

  });

}


/* =========================================================
   CATEGORY BREAKDOWN
   ========================================================= */

import { state } from "../../core/state.js";
import { getWeekStartDate } from "../../core/utils.js";

export function getCategoryTotals(sessions) {

  const totals = {};

  state.categories.forEach(category => {
    totals[category.name] = 0;
  });
  sessions.forEach(session => {

    if (totals[session.category] !== undefined) {

      totals[session.category] +=
        Number(session.duration) || 0;

    }

  });

  return totals;

}


export function getTotalTrackedTime(sessions) {

  return sessions.reduce(
    (sum, session) =>
      sum + (Number(session.duration) || 0),
    0
  );

}


/* =========================================================
   PROJECT BREAKDOWN
   ========================================================= */

export function getProjectTotals(sessions, projects) {

  const totals = {};

  sessions.forEach(session => {

    if (!session.projectId) return;

    totals[session.projectId] =
      (totals[session.projectId] || 0) +
      (Number(session.duration) || 0);

  });

  return Object.entries(totals)
    .map(([projectId, duration]) => {

      const project =
        projects.find(p => p.id === projectId);

      return {
        name: project?.name || "Unknown",
        duration
      };

    })
    .sort((a, b) => b.duration - a.duration);

}

export function getSkillTotals(sessions, skills) {

  const totals = {};

  sessions.forEach(session => {

    if (!session.skillId) return;

    totals[session.skillId] =
      (totals[session.skillId] || 0) +
      (Number(session.duration) || 0);

  });

  return Object.entries(totals)
    .map(([skillId, duration]) => {

      const skill =
        skills.find(s => s.id === skillId);

      return {
        name: skill?.name || "Unknown",
        duration
      };

    })
    .sort((a, b) => b.duration - a.duration);

}


/* =========================================================
   SUB-PERIOD TREND (for Deep Work trend chart)
   ========================================================= */

export function getSubPeriodTrend(
  sessions,
  periodType,
  range
) {

  /*
   * Bucket granularity scales with the range
   * being viewed, so charts stay readable
   * regardless of how much history exists:
   *
   * Week  → daily buckets   (7 bars)
   * Month → weekly buckets  (~4-5 bars)
   * Year  → monthly buckets (12 bars)
   * All-Time → monthly buckets if under ~3 years,
   *            otherwise yearly buckets
   */

  if (periodType === "week") {

    return buildDailyBuckets(sessions, range);

  }

  if (periodType === "month") {

    return buildWeeklyBuckets(sessions, range);

  }

  if (periodType === "year") {

    return buildMonthlyBuckets(sessions, range);

  }

  /*
   * ALL-TIME
   */

  const earliest =
    getEarliestSessionDate(sessions) ||
    new Date();

  const spanMs =
    range.end.getTime() - earliest.getTime();

  const spanYears =
    spanMs / (1000 * 60 * 60 * 24 * 365);

  const effectiveRange = {
    start: earliest,
    end: range.end
  };

  if (spanYears > 3) {

    return buildYearlyBuckets(
      sessions,
      effectiveRange
    );

  }

  return buildMonthlyBuckets(
    sessions,
    effectiveRange
  );

}


function buildDailyBuckets(sessions, range) {

  const buckets = [];

  for (let i = 0; i < 7; i++) {

    const dayStart = new Date(range.start);

    dayStart.setDate(range.start.getDate() + i);

    const dayEnd = new Date(dayStart);

    dayEnd.setDate(dayStart.getDate() + 1);

    buckets.push({
      label:
        dayStart.toLocaleDateString(
          undefined,
          { weekday: "short" }
        ),
      start: dayStart,
      end: dayEnd
    });

  }

  return summarizeBuckets(sessions, buckets);

}


function buildWeeklyBuckets(sessions, range) {

  const buckets = [];

  let cursor = new Date(range.start);

  let index = 1;

  const safetyLimit = 60;

  while (
    cursor < range.end &&
    index <= safetyLimit
  ) {

    const bucketEnd = new Date(cursor);

    bucketEnd.setDate(cursor.getDate() + 7);

    buckets.push({
      label: `Week ${index}`,
      start: new Date(cursor),
      end: bucketEnd
    });

    cursor = bucketEnd;

    index++;

  }

  return summarizeBuckets(sessions, buckets);

}


function buildMonthlyBuckets(sessions, range) {

  const buckets = [];

  let cursor =
    new Date(
      range.start.getFullYear(),
      range.start.getMonth(),
      1
    );

  const safetyLimit = 60;

  let count = 0;

  while (
    cursor < range.end &&
    count <= safetyLimit
  ) {

    const bucketEnd =
      new Date(
        cursor.getFullYear(),
        cursor.getMonth() + 1,
        1
      );

    buckets.push({
      label:
        cursor.toLocaleDateString(
          undefined,
          { month: "short", year: "2-digit" }
        ),
      start: new Date(cursor),
      end: bucketEnd
    });

    cursor = bucketEnd;

    count++;

  }

  return summarizeBuckets(sessions, buckets);

}


function buildYearlyBuckets(sessions, range) {

  const buckets = [];

  let year = range.start.getFullYear();

  const endYear = range.end.getFullYear();

  const safetyLimit = 100;

  let count = 0;

  while (
    year <= endYear &&
    count <= safetyLimit
  ) {

    const bucketStart =
      new Date(year, 0, 1);

    const bucketEnd =
      new Date(year + 1, 0, 1);

    buckets.push({
      label: String(year),
      start: bucketStart,
      end: bucketEnd
    });

    year++;

    count++;

  }

  return summarizeBuckets(sessions, buckets);

}


function summarizeBuckets(sessions, buckets) {

  const focusCategories =
    state.categories
      .filter(c => c.group === "Focus")
      .map(c => c.name);

  const distractionCategories =
    state.categories
      .filter(c => c.group === "Distraction")
      .map(c => c.name);

  return buckets.map(bucket => {

    const bucketSessions =
      getSessionsInRange(sessions, bucket);

    const focusTime =
      bucketSessions
        .filter(s =>
          focusCategories.includes(s.category)
        )
        .reduce(
          (sum, s) => sum + (Number(s.duration) || 0),
          0
        );

    const distraction =
      bucketSessions
        .filter(s =>
          distractionCategories.includes(s.category)
        )
        .reduce(
          (sum, s) => sum + (Number(s.duration) || 0),
          0
        );

    return {
      label: bucket.label,
      focusTimeHours: focusTime / 3600000,
      distractionHours: distraction / 3600000
    };

  });

}


function getEarliestSessionDate(sessions) {

  if (sessions.length === 0) {
    return null;
  }

  const earliest =
    sessions.reduce(
      (min, session) =>
        session.start < min
          ? session.start
          : min,
      sessions[0].start
    );

  return new Date(earliest);

}


/* =========================================================
   MILESTONE REFLECTION
   ========================================================= */

export function getMilestonesCompletedInRange(
  projects,
  range
) {

  /*
   * Accurate for milestones completed after this
   * migration shipped. Milestones that were already
   * marked done before this migration have
   * completedAt = null and are excluded here —
   * their true completion date is unknown, so we
   * don't guess.
   */

  let count = 0;

  projects.forEach(project => {

    project.milestones.forEach(milestone => {

      if (
        milestone.completedAt &&
        milestone.completedAt >= range.start.getTime() &&
        milestone.completedAt < range.end.getTime()
      ) {
        count++;
      }

    });

  });

  return count;

}

export function getRoadmapStagesCompletedInRange(
  careerGoals,
  range
) {

  let count = 0;

  careerGoals.forEach(goal => {

    goal.roadmap.forEach(stage => {

      if (
        stage.completedAt &&
        stage.completedAt >= range.start.getTime() &&
        stage.completedAt < range.end.getTime()
      ) {
        count++;
      }

    });

  });

  return count;

}

export function getCapabilitiesDemonstratedInRange(
  skills,
  range
) {

  let count = 0;

  skills.forEach(skill => {

    (skill.capabilities || []).forEach(capability => {

      if (
        capability.demonstratedAt &&
        capability.demonstratedAt >= range.start.getTime() &&
        capability.demonstratedAt < range.end.getTime()
      ) {
        count++;
      }

    });

  });

  return count;

}


export function getMostActiveDay(sessions, range) {

  const inRange =
    getSessionsInRange(sessions, range);

  if (inRange.length === 0) {
    return null;
  }

  const dayTotals = {};

  inRange.forEach(session => {

    const day =
      new Date(session.start);

    day.setHours(0, 0, 0, 0);

    const key = day.getTime();

    dayTotals[key] =
      (dayTotals[key] || 0) +
      (Number(session.duration) || 0);

  });

  const bestKey =
    Object.keys(dayTotals)
      .reduce((best, key) =>
        dayTotals[key] > dayTotals[best]
          ? key
          : best
      );

  return {
    date: new Date(Number(bestKey)),
    duration: dayTotals[bestKey]
  };

}
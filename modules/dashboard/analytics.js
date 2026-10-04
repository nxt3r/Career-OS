import { state } from "../../core/state.js";
import { getCategoryNamesByGroup } from "../../core/categories.js";
import { getWeekStartDate } from "../../core/utils.js";


/*
 * TOTAL FOCUS TIME
 *
 * Focus Time = sum of all sessions whose
 * category belongs to the "Focus" group,
 * as defined in Settings.
 */
export function getTotalFocusHours() {

  const focusCategories =
    getCategoryNamesByGroup("Focus");


  const total =
    state.sessions

      .filter(
        session =>
          focusCategories.includes(
            session.category
          )
      )

      .reduce(
        (sum, session) =>
          sum + session.duration,
        0
      );


  return total / 3600000;

}


/*
 * TOTAL NEUTRAL TIME
 *
 * Tracked, but counted as neither Focus
 * nor Distraction.
 */
export function getTotalNeutralHours() {

  const neutralCategories =
    getCategoryNamesByGroup("Neutral");


  const total =
    state.sessions

      .filter(
        session =>
          neutralCategories.includes(
            session.category
          )
      )

      .reduce(
        (sum, session) =>
          sum + session.duration,
        0
      );


  return total / 3600000;

}


/*
 * TODAY'S DISTRACTION TIME
 *
 * Scrolling + Gaming
 */
export function getTodayDistractionHours() {

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );


  const distractionCategories =
    getCategoryNamesByGroup("Distraction");


  const total =
    state.sessions

      .filter(
        session => {

          const date =
            new Date(
              session.start
            );

          date.setHours(
            0,
            0,
            0,
            0
          );


          return (
            date.getTime() ===
              today.getTime() &&

            distractionCategories.includes(
              session.category
            )
          );

        }
      )

      .reduce(
        (sum, session) =>
          sum + session.duration,
        0
      );


  return total / 3600000;

}


/*
 * ACTIVE PROJECT COUNT
 */
export function getActiveProjects() {

  return state.projects.filter(
    project =>
      !project.archived &&
      project.status === "Active"
  ).length;

}


/*
 * FORMAT HOURS
 *
 * Example:
 * 14.53 → "14.5h"
 */
export function formatHours(hours) {

  return `${hours.toFixed(1)}h`;

}

/*
 * WEEKLY DEEP WORK
 */

export function getWeeklyFocusHours() {

  const focusCategories =
    getCategoryNamesByGroup("Focus");

  const weekStart =
    state.settings?.weekStart || "monday";

  const start =
    getWeekStartDate(new Date(), weekStart);

  const total =
    state.sessions

      .filter(session => {

        const date =
          new Date(session.start);

        return (
          date >= start &&
          focusCategories.includes(session.category)
        );

      })

      .reduce(
        (sum,session)=>
          sum + session.duration,
        0
      );

  return total/3600000;

}
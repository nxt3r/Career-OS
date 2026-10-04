import { state } from "../../core/state.js";
import { replayFadeIn } from "../../core/utils.js";
import {
  getPeriodRange,
  getPreviousPeriodRange,
  getSessionsInRange,
  getCategoryTotals,
  getTotalTrackedTime,
  getProjectTotals,
  getSkillTotals,
  getSubPeriodTrend,
  getMilestonesCompletedInRange,
  getRoadmapStagesCompletedInRange,
  getCapabilitiesDemonstratedInRange,
  getMostActiveDay
} from "./reviewsAnalytics.js";

let periodType = "week";
let periodOffset = 0;

let charts = {
  distribution: null,
  trend: null,
  projects: null,
  skills: null,
  comparison: null
};


/* =========================================================
   MAIN REVIEWS VIEW
   ========================================================= */

export function renderReviews(app) {

  if (!app) return;

  destroyCharts();

  app.innerHTML = `
    <section>

      <h2>Reviews</h2>

      <div class="review-period-controls">

        <div class="review-period-tabs">

          <button
            class="period-tab ${periodType === "week" ? "active" : ""}"
            data-period="week"
          >
            Week
          </button>

          <button
            class="period-tab ${periodType === "month" ? "active" : ""}"
            data-period="month"
          >
            Month
          </button>

          <button
            class="period-tab ${periodType === "year" ? "active" : ""}"
            data-period="year"
          >
            Year
          </button>

          <button
            class="period-tab ${periodType === "all" ? "active" : ""}"
            data-period="all"
          >
            All-Time
          </button>

        </div>

        ${
          periodType !== "all"
            ? `
              <div class="review-period-nav">

                <button id="periodPrev">
                  ← Previous
                </button>

                <span id="periodLabel"></span>

                <button
                  id="periodNext"
                  ${periodOffset === 0 ? "disabled" : ""}
                >
                  Next →
                </button>

              </div>
            `
            : ""
        }

      </div>

      <div id="reviewContent"></div>

    </section>
  `;

  renderContent();

  attachReviewEvents();

}


/* =========================================================
   CONTENT
   ========================================================= */

function renderContent() {

  const container =
    document.getElementById("reviewContent");

  if (!container) return;

  const range =
    getPeriodRange(periodType, periodOffset);

  const label =
    document.getElementById("periodLabel");

  if (label) {
    label.textContent = formatRangeLabel(range);
  }

  const sessions =
    getSessionsInRange(state.sessions, range);

  const categoryTotals =
    getCategoryTotals(sessions);

  const totalTracked =
    getTotalTrackedTime(sessions);

  const projectTotals =
    getProjectTotals(sessions, state.projects);

  const trend =
    getSubPeriodTrend(
      state.sessions,
      periodType,
      range
    );

    const milestonesCompleted =
    getMilestonesCompletedInRange(
      state.projects,
      range
    );

    const roadmapStagesCompleted =
    getRoadmapStagesCompletedInRange(
      state.careerGoals,
      range
    );

  const capabilitiesDemonstrated =
    getCapabilitiesDemonstratedInRange(
      state.skills,
      range
    );

  const skillTotals =
    getSkillTotals(sessions, state.skills);

  const mostActiveDay =
    getMostActiveDay(state.sessions, range);

  let comparison = null;

  if (periodType !== "all") {

    const prevRange =
      getPreviousPeriodRange(periodType, periodOffset);

    const prevSessions =
      getSessionsInRange(state.sessions, prevRange);

    comparison = {
      current: categoryTotals,
      previous: getCategoryTotals(prevSessions)
    };

  }

    const focusCategoryNames =
    state.categories
      .filter(c => c.group === "Focus")
      .map(c => c.name);

  const distractionCategoryNames =
    state.categories
      .filter(c => c.group === "Distraction")
      .map(c => c.name);

  const focusTime =
    focusCategoryNames.reduce(
      (sum, name) => sum + (categoryTotals[name] || 0),
      0
    );

  const distraction =
    distractionCategoryNames.reduce(
      (sum, name) => sum + (categoryTotals[name] || 0),
      0
    );

  container.innerHTML = `

    <div class="grid">

      <div class="card stat-card">
        <p>Total Tracked</p>
        <h2>${formatHours(totalTracked)}</h2>
      </div>

      <div class="card stat-card">
        <p>Focus Time</p>
        <h2>${formatHours(focusTime)}</h2>
      </div>

      <div class="card stat-card">
        <p>Distraction</p>
        <h2>${formatHours(distraction)}</h2>
      </div>

            <div class="card stat-card">
        <p>Most Active Day</p>
        <h2>${
          mostActiveDay
            ? formatHours(mostActiveDay.duration)
            : "—"
        }</h2>
        <small>${
          mostActiveDay
            ? mostActiveDay.date.toLocaleDateString(
                undefined,
                { weekday: "long", month: "short", day: "numeric" }
              )
            : "No sessions in this period"
        }</small>
      </div>

    </div>


    <div class="card">

      <h3>Progress</h3>

      <div class="grid">

        <div class="overview-box">
          <small>Milestones Completed</small>
          <h3>${milestonesCompleted}</h3>
        </div>

        <div class="overview-box">
          <small>Roadmap Stages Completed</small>
          <h3>${roadmapStagesCompleted}</h3>
        </div>

        <div class="overview-box">
          <small>Capabilities Demonstrated</small>
          <h3>${capabilitiesDemonstrated}</h3>
        </div>

      </div>

    </div>

    <div class="card">
      <h3>Time Distribution</h3>
      <div class="chart-box">
        <canvas id="distributionChart"></canvas>
      </div>
    </div>


    <div class="card">
      <h3>Focus Time vs Distraction Trend</h3>
      <div class="chart-box">
        <canvas id="trendChart"></canvas>
      </div>
    </div>


        <div class="card">
      <h3>Project Time Distribution</h3>
      ${
        projectTotals.length === 0
          ? "<p>No project sessions in this period.</p>"
          : `
            <div class="chart-box">
              <canvas id="projectsChart"></canvas>
            </div>
          `
      }
    </div>


    <div class="card">
      <h3>Skill Time Distribution</h3>
      ${
        skillTotals.length === 0
          ? "<p>No skill sessions in this period.</p>"
          : `
            <div class="chart-box">
              <canvas id="skillsChart"></canvas>
            </div>
          `
      }
    </div>


    ${
      comparison
        ? `
          <div class="card">
            <h3>This Period vs Previous</h3>
            <div class="chart-box">
              <canvas id="comparisonChart"></canvas>
            </div>
          </div>
        `
        : ""
    }

  `;

  replayFadeIn(container);

  renderCharts(
    categoryTotals,
    trend,
    projectTotals,
    skillTotals,
    comparison
  );

}


/* =========================================================
   CHARTS
   ========================================================= */

function destroyCharts() {

  Object.keys(charts).forEach(key => {

    if (charts[key]) {

      charts[key].destroy();

      charts[key] = null;

    }

  });

}


function renderCharts(
  categoryTotals,
  trend,
  projectTotals,
  skillTotals,
  comparison
) {

  destroyCharts();

  const textColor = "#F8FAFC";
  const gridColor = "#334155";

  const hourTooltip = {
    callbacks: {
      label: context => {

        const value =
          context.parsed.y !== undefined
            ? context.parsed.y
            : context.parsed;

        const label =
          context.dataset.label
            ? `${context.dataset.label}: `
            : `${context.label}: `;

        return `${label}${value}h`;

      }
    }
  };


  /*
   * TIME DISTRIBUTION
   */

  const distributionCanvas =
    document.getElementById("distributionChart");

  if (distributionCanvas) {

    const categoryLabels =
      Object.keys(categoryTotals);

    charts.distribution = new Chart(
      distributionCanvas,
      {
        type: "doughnut",
        data: {
          labels: categoryLabels,
          datasets: [{
            data:
              Object.values(categoryTotals)
                .map(ms => +(ms / 3600000).toFixed(2)),
             backgroundColor:
              getCategoryColors(categoryLabels)
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: textColor }
            },
            tooltip: hourTooltip
          }
        }
      }
    );

  }


  /*
   * FOCUS TIME VS DISTRACTION TREND
   */

  const trendCanvas =
    document.getElementById("trendChart");

  if (trendCanvas) {

    charts.trend = new Chart(
      trendCanvas,
      {
        type: "line",
        data: {
          labels: trend.map(point => point.label),
          datasets: [
                        {
              label: "Focus Time",
              data: trend.map(point =>
                +(point.focusTimeHours || 0).toFixed(2)
              ),
              borderColor: "#3B82F6",
              backgroundColor: "#3B82F6",
              fill: false,
              tension: 0.3
            },
            {
              label: "Distraction",
              data: trend.map(point =>
                +(point.distractionHours || 0).toFixed(2)
              ),
              borderColor: "#EF4444",
              backgroundColor: "#EF4444",
              fill: false,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: textColor }
            },
            tooltip: hourTooltip
          },
          scales: {
            x: {
              ticks: { color: textColor },
              grid: { color: gridColor }
            },
            y: {
              ticks: { color: textColor },
              grid: { color: gridColor },
              beginAtZero: true,
              title: {
                display: true,
                text: "Hours",
                color: textColor
              }
            }
          }
        }
      }
    );

  }


  /*
   * PROJECT TIME DISTRIBUTION
   */

  const projectsCanvas =
    document.getElementById("projectsChart");

  if (projectsCanvas && projectTotals.length > 0) {

    charts.projects = new Chart(
      projectsCanvas,
      {
        type: "bar",
        data: {
          labels: projectTotals.map(p => p.name),
          datasets: [{
            label: "Hours",
            data:
              projectTotals.map(p =>
                +(p.duration / 3600000).toFixed(2)
              ),
            backgroundColor: "#3B82F6"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: hourTooltip
          },
          scales: {
            x: {
              ticks: { color: textColor },
              grid: { color: gridColor }
            },
            y: {
              ticks: { color: textColor },
              grid: { color: gridColor },
              beginAtZero: true,
              title: {
                display: true,
                text: "Hours",
                color: textColor
              }
            }
          }
        }
      }
    );

  }


    /*
   * SKILL TIME DISTRIBUTION
   */

  const skillsCanvas =
    document.getElementById("skillsChart");

  if (skillsCanvas && skillTotals.length > 0) {

    charts.skills = new Chart(
      skillsCanvas,
      {
        type: "bar",
        data: {
          labels: skillTotals.map(s => s.name),
          datasets: [{
            label: "Hours",
            data:
              skillTotals.map(s =>
                +(s.duration / 3600000).toFixed(2)
              ),
            backgroundColor: "#A855F7"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: hourTooltip
          },
          scales: {
            x: {
              ticks: { color: textColor },
              grid: { color: gridColor }
            },
            y: {
              ticks: { color: textColor },
              grid: { color: gridColor },
              beginAtZero: true,
              title: {
                display: true,
                text: "Hours",
                color: textColor
              }
            }
          }
        }
      }
    );

  }


  /*
   * PERIOD COMPARISON
   */

  const comparisonCanvas =
    document.getElementById("comparisonChart");

  if (comparisonCanvas && comparison) {

    const categories =
      Object.keys(comparison.current);

    const categoryColors =
      getCategoryColors(categories);

    const categoryGroupColors =
      categories.map(name => getGroupColor(name));

    charts.comparison = new Chart(
      comparisonCanvas,
      {
        type: "bar",
        data: {
          labels: categories,
          datasets: [
            {
              label: "This Period",
              data:
                categories.map(category =>
                  +(comparison.current[category] / 3600000).toFixed(2)
                ),
              backgroundColor: categoryGroupColors
            },
            {
              label: "Previous Period",
              data:
                categories.map(category =>
                  +(comparison.previous[category] / 3600000).toFixed(2)
                ),
              backgroundColor: categoryGroupColors.map(color => fadeColor(color, 0.4))
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: textColor }
            },
            tooltip: hourTooltip
          },
          scales: {
            x: {
              ticks: { color: textColor },
              grid: { color: gridColor }
            },
            y: {
              ticks: { color: textColor },
              grid: { color: gridColor },
              beginAtZero: true,
              title: {
                display: true,
                text: "Hours",
                color: textColor
              }
            }
          }
        }
      }
    );

  }

}


/* =========================================================
   EVENTS
   ========================================================= */

function attachReviewEvents() {

  document
    .querySelectorAll(".period-tab")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          periodType =
            button.dataset.period;

          periodOffset = 0;

          renderReviews(
            document.getElementById("app")
          );

        }
      );

    });

  const prevButton =
    document.getElementById("periodPrev");

  if (prevButton) {

    prevButton.addEventListener(
      "click",
      () => {

        periodOffset -= 1;

        renderReviews(
          document.getElementById("app")
        );

      }
    );

  }

  const nextButton =
    document.getElementById("periodNext");

  if (nextButton) {

    nextButton.addEventListener(
      "click",
      () => {

        if (periodOffset < 0) {

          periodOffset += 1;

          renderReviews(
            document.getElementById("app")
          );

        }

      }
    );

  }

}


/* =========================================================
   HELPERS
   ========================================================= */



const BUILT_IN_COLORS = {
  "Deep Work": "#3B82F6",
  "Study": "#A855F7",
  "Scrolling": "#EF4444",
  "Gaming": "#F97316",
  "Exercise": "#22C55E"
};


function getCategoryColors(categoryNames) {

  return categoryNames.map(name => {

    if (name in BUILT_IN_COLORS) {

      return BUILT_IN_COLORS[name];

    }

    return hashNameToColor(name);

  });

}


function getGroupColor(categoryName) {

  const categoryObj =
    state.categories.find(c => c.name === categoryName);

  const group =
    categoryObj?.group || "Neutral";

  if (group === "Focus") return "#3B82F6";
  if (group === "Distraction") return "#EF4444";
  return "#22C55E";

}


function fadeColor(hex, alpha) {

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;

}


function hashNameToColor(name) {

  /*
   * Deterministic per-name color.
   *
   * Same category name always produces the
   * same hue, regardless of how many other
   * categories exist or in what order — fixes
   * the earlier bug where adding a new custom
   * category shifted the colors of existing ones.
   */

  let hash = 0;

  for (let i = 0; i < name.length; i++) {

    hash =
      name.charCodeAt(i) +
      ((hash << 5) - hash);

    hash |= 0;

  }

  const hue =
    Math.abs(hash) % 360;

  return `hsl(${hue}, 70%, 55%)`;

}


function formatHours(ms) {

  return `${(ms / 3600000).toFixed(1)}h`;

}


function formatRangeLabel(range) {

  const options =
    { year: "numeric", month: "short", day: "numeric" };

  const start =
    range.start.toLocaleDateString(undefined, options);

  const end =
    new Date(range.end.getTime() - 1)
      .toLocaleDateString(undefined, options);

  return `${start} – ${end}`;

}
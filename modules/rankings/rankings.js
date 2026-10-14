import { state } from "../../core/state.js";
import { auth } from "../../core/firebase.js";
import { getUserProfile } from "../../core/username.js";
import {
  publishMyRanking,
  fetchRankings,
  getMyAnonymous,
  computeRankingStats,
  getWeekKey
} from "../../core/rankings.js";
import { getAvatarDisplay } from "../profile/avatars.js";

const METRIC_FIELD = {
  total: "Total",
  focus: "Focus",
  distraction: "Distraction"
};

let period = "week";
let metric = "total";
let rows = [];
let myProfile = null;
let ready = false;


export async function renderRankings(app) {

  period = "week";
  metric = "total";
  rows = [];
  myProfile = null;
  ready = false;

  app.innerHTML = `
    <section class="rk-page">

      <h2>Rankings</h2>
      <p class="rk-sub" id="rkSub"></p>

      <div class="rk-controls">

        <select class="rk-select" id="rkPeriod">
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>

        <select class="rk-select" id="rkMetric">
          <option value="total">Total time</option>
          <option value="focus">Focus time</option>
          <option value="distraction">Distraction time</option>
        </select>

        <label class="rk-switch">
          <input type="checkbox" id="rkAnon">
          <span class="rk-track"></span>
          <span>Anonymous</span>
        </label>

      </div>

      <div class="rk-board" id="rkBoard" data-metric="total">
        <p class="rk-msg">Loading...</p>
      </div>

    </section>
  `;

  const periodSelect = document.getElementById("rkPeriod");
  const metricSelect = document.getElementById("rkMetric");
  const anonBox = document.getElementById("rkAnon");

  periodSelect.addEventListener("change", async () => {

    if (!ready) return;

    period = periodSelect.value;

    showMessage("Loading...");

    try {

      await loadRows();

    } catch (error) {

      console.error("Rankings error:", error);

      showMessage("Could not load rankings.");

    }

  });

  metricSelect.addEventListener("change", () => {

    if (!ready) return;

    metric = metricSelect.value;

    draw();

  });

  const user = auth.currentUser;

  if (!user) return;

  try {

    myProfile = await getUserProfile(user.uid);

    await publishMyRanking(state);

    anonBox.checked = await getMyAnonymous();

    anonBox.addEventListener("change", async () => {

      try {

        await publishMyRanking(state, anonBox.checked);

        await loadRows();

      } catch (error) {

        console.error("Anonymous toggle error:", error);

        anonBox.checked = !anonBox.checked;

      }

    });

    ready = true;

    await loadRows();

  } catch (error) {

    console.error("Rankings error:", error);

    showMessage("Could not load rankings.");

  }

}


async function loadRows() {

  rows = await fetchRankings(period);

  draw();

}


function showMessage(text) {

  const board = document.getElementById("rkBoard");

  if (board) board.innerHTML = `<p class="rk-msg">${text}</p>`;

}


function periodLabel() {

  if (period === "month") {

    const month = new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });

    return `${month} · resets on the 1st`;

  }

  const start = new Date(`${getWeekKey()}T00:00:00`);

  const label = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return `Week of ${label} · resets every Monday`;

}


function draw() {

  const board = document.getElementById("rkBoard");
  const sub = document.getElementById("rkSub");

  if (!board) return;

  const field = `${period}${METRIC_FIELD[metric]}Ms`;
  const myUid = auth.currentUser?.uid;

  board.dataset.metric = metric;

  if (sub) sub.textContent = periodLabel();

  const sorted = rows
    .filter(r => (r[field] || 0) > 0)
    .sort((a, b) => b[field] - a[field]);

  const top = sorted.slice(0, 50);
  const leader = top[0]?.[field] || 1;

  const podium = top.slice(0, 3);
  const rest = top.slice(3);

  // Podium order: 2nd, 1st, 3rd
  const podiumHTML =
    podium.length === 0
      ? ""
      : `<div class="rk-podium">${
          [1, 0, 2].map(i =>
            podium[i]
              ? renderPod(i, podium[i], podium[i][field], podium[i].uid === myUid)
              : "<div></div>"
          ).join("")
        }</div>`;

  const listHTML =
    rest.length === 0
      ? ""
      : `<div class="rk-list">${
          rest.map((r, i) =>
            renderRow(i + 4, r, r[field], leader, r.uid === myUid)
          ).join("")
        }</div>`;

  const emptyHTML =
    top.length === 0
      ? `<p class="rk-msg">No one has logged time this period yet.</p>`
      : "";

  const myStats = computeRankingStats(state.sessions, state.categories)[period];
  const myValue = myStats[metric];
  const myIndex = sorted.findIndex(r => r.uid === myUid);

  const youHTML = `
    <div class="rk-youbar">
      <span class="rk-rank">${myIndex >= 0 ? `#${myIndex + 1}` : "—"}</span>
      ${avatarHTML({ ...myProfile, anonymous: false })}
      <span class="rk-name">You</span>
      <span class="rk-value">${formatTime(myValue)}</span>
    </div>
  `;

  board.innerHTML = podiumHTML + listHTML + emptyHTML + youHTML;

}


function renderPod(index, entry, ms, isMe) {

  const medal = ["🥇", "🥈", "🥉"][index];

  return `
    <div class="rk-pod ${index === 0 ? "first" : ""} ${isMe ? "me" : ""}">
      <span class="rk-medal">${medal}</span>
      <div class="rk-pod-avatar">${avatarHTML(entry)}</div>
      <div class="rk-pod-name">${escapeHTML(displayNameOf(entry))}${isMe ? " (you)" : ""}</div>
      <div class="rk-pod-value">${formatTime(ms)}</div>
    </div>
  `;

}


function renderRow(rank, entry, ms, leader, isMe) {

  const percent = Math.max(3, Math.round((ms / leader) * 100));

  return `
    <div class="rk-row ${isMe ? "me" : ""}">
      <span class="rk-rank">${rank}</span>
      ${avatarHTML(entry)}
      <div class="rk-row-main">
        <div class="rk-name">${escapeHTML(displayNameOf(entry))}${isMe ? " (you)" : ""}</div>
        <div class="rk-bar"><span style="width:${percent}%"></span></div>
      </div>
      <span class="rk-value">${formatTime(ms)}</span>
    </div>
  `;

}


function displayNameOf(entry) {

  if (entry.anonymous) return "Anonymous";

  return entry.displayName || entry.username || "User";

}


function avatarHTML(entry) {

  const avatar =
    entry.anonymous
      ? { type: "emoji", emoji: "👤", color: "#334155" }
      : getAvatarDisplay(entry);

  return avatar.type === "image"
    ? `<img src="${escapeHTML(avatar.url)}" class="profile-avatar-img">`
    : `<span class="profile-avatar-emoji" style="background:${avatar.color}">${avatar.emoji}</span>`;

}


function formatTime(ms) {

  const value = Number(ms) || 0;

  if (value < 3600000) return `${Math.round(value / 60000)}m`;

  return `${(value / 3600000).toFixed(1)}h`;

}


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}
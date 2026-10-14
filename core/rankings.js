import { auth } from "./firebase.js";
import { db } from "./firestore.js";
import { getUserProfile } from "./username.js";
import {
  doc, getDoc, setDoc, collection, query, where, limit, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


function pad(n) {
  return String(n).padStart(2, "0");
}


function getWeekStart(date) {

  const d = new Date(date);

  d.setHours(0, 0, 0, 0);

  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));

  return d;

}


export function getWeekKey(now = new Date()) {

  const w = getWeekStart(now);

  return `${w.getFullYear()}-${pad(w.getMonth() + 1)}-${pad(w.getDate())}`;

}


export function getMonthKey(now = new Date()) {

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

}


/*
 * Weekly and monthly totals, computed from sessions.
 * Focus / Distraction come from the category's group.
 */
export function computeRankingStats(sessions, categories, now = new Date()) {

  const weekStart = getWeekStart(now).getTime();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const groupOf = {};

  (categories || []).forEach(c => { groupOf[c.name] = c.group; });

  const blank = () => ({ total: 0, focus: 0, distraction: 0 });

  const week = blank();
  const month = blank();

  (sessions || []).forEach(session => {

    const ms = Number(session.duration) || 0;
    const group = groupOf[session.category];

    [[week, weekStart], [month, monthStart]].forEach(([bucket, from]) => {

      if (session.start >= from) {

        bucket.total += ms;

        if (group === "Focus") bucket.focus += ms;
        if (group === "Distraction") bucket.distraction += ms;

      }

    });

  });

  return { week, month };

}


/*
 * The Anonymous choice lives in the user's own rankings doc.
 * Cached per uid so publishing doesn't re-read it every time.
 * If the read fails we throw instead of guessing, so a failed
 * read can never accidentally un-anonymize someone.
 */
let anonCache = { uid: null, value: false };


async function loadAnonymous(uid) {

  if (anonCache.uid === uid) return anonCache.value;

  const snap = await getDoc(doc(db, "rankings", uid));

  anonCache = { uid, value: snap.exists() && snap.data().anonymous === true };

  return anonCache.value;

}


export async function getMyAnonymous() {

  const user = auth.currentUser;

  if (!user) return false;

  return loadAnonymous(user.uid);

}


/*
 * Publishes the user's snapshot to rankings/{uid}.
 * setDoc replaces the whole doc, so choosing Anonymous
 * removes the stored name and avatar instead of leaving them.
 */
export async function publishMyRanking(state, anonymousOverride) {

  const user = auth.currentUser;

  if (!user) return;

  if (typeof anonymousOverride === "boolean") {
    anonCache = { uid: user.uid, value: anonymousOverride };
  }

  const anonymous = await loadAnonymous(user.uid);

  const profile = await getUserProfile(user.uid);

  const { week, month } = computeRankingStats(state.sessions, state.categories);

  const data = {
    uid: user.uid,
    anonymous,
    weekKey: getWeekKey(),
    monthKey: getMonthKey(),
    weekTotalMs: week.total,
    weekFocusMs: week.focus,
    weekDistractionMs: week.distraction,
    monthTotalMs: month.total,
    monthFocusMs: month.focus,
    monthDistractionMs: month.distraction,
    updatedAt: Date.now()
  };

  if (!anonymous) {

    data.displayName = profile?.displayName || profile?.username || "User";
    data.avatarEmoji = profile?.avatarEmoji ?? null;
    data.avatarColor = profile?.avatarColor ?? null;
    data.avatarUrl = profile?.avatarUrl ?? null;

  }

  await setDoc(doc(db, "rankings", user.uid), data);

}


export async function fetchRankings(period) {

  const field = period === "month" ? "monthKey" : "weekKey";
  const key = period === "month" ? getMonthKey() : getWeekKey();

  const snapshot = await getDocs(
    query(collection(db, "rankings"), where(field, "==", key), limit(200))
  );

  return snapshot.docs.map(d => d.data());

}

/*
 * Used when the user resets their data or schedules account
 * deletion. Zeroes the public totals and drops the name and
 * avatar, but keeps the Anonymous choice so it isn't lost.
 */
export async function clearMyRanking() {

  const user = auth.currentUser;

  if (!user) return;

  const anonymous = await loadAnonymous(user.uid);

  await setDoc(doc(db, "rankings", user.uid), {
    uid: user.uid,
    anonymous,
    weekKey: getWeekKey(),
    monthKey: getMonthKey(),
    weekTotalMs: 0,
    weekFocusMs: 0,
    weekDistractionMs: 0,
    monthTotalMs: 0,
    monthFocusMs: 0,
    monthDistractionMs: 0,
    updatedAt: Date.now()
  });

}
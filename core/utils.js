export function replayFadeIn(element) {

  if (!element) return;

  element.classList.remove("fade-in");

  void element.offsetWidth; // force reflow

  element.classList.add("fade-in");

}


const DAY_INDEX = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6
};


export function getWeekStartDate(referenceDate, weekStartSetting) {

  const targetDay =
    DAY_INDEX[weekStartSetting] ?? 1;

  const date =
    new Date(referenceDate);

  const currentDay =
    date.getDay();

  let diff =
    currentDay - targetDay;

  if (diff < 0) diff += 7;

  date.setDate(date.getDate() - diff);

  date.setHours(0, 0, 0, 0);

  return date;

}


export function getWeekSessions(sessions, stateRef){

  const weekStart =
    stateRef?.settings?.weekStart || "monday";

  const start =
    getWeekStartDate(new Date(), weekStart);

  return sessions.filter(session => session.start >= start.getTime());

}

export function hoursByCategory(sessions, category){

  const total = sessions
    .filter(s => s.category === category)
    .reduce((sum,s)=> sum + s.duration,0);

  return +(total / 3600000).toFixed(1);

}

export function totalHours(sessions){

  const total = sessions.reduce((sum,s)=> sum+s.duration,0);

  return +(total/3600000).toFixed(1);

}
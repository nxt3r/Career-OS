let timeoutId = null;

function playPageEnter() {

  const app = document.getElementById("app");

  if (!app) return;

  app.classList.remove("page-enter");

  void app.offsetWidth;

  app.classList.add("page-enter");

  clearTimeout(timeoutId);

  timeoutId = setTimeout(() => {
    app.classList.remove("page-enter");
  }, 900);

}

export function initMotion() {

  window.addEventListener("hashchange", playPageEnter);

  playPageEnter();

}
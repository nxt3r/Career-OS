const CONFETTI_COLORS = [
  "#A855F7", "#3B82F6", "#22C55E", "#F59E0B",
  "#EC4899", "#06B6D4", "#FACC15"
];

const GOLD_COLORS = [
  "#FACC15", "#FDE047", "#F59E0B", "#FFFFFF", "#FBBF24"
];

const rand = (min, max) => Math.random() * (max - min) + min;

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;


function spawnConfetti(container, count, colors) {

  if (reducedMotion()) return;

  for (let i = 0; i < count; i++) {

    const piece = document.createElement("i");

    piece.className = "confetti-piece";

    piece.style.setProperty("--x", `${rand(0, 100)}%`);
    piece.style.setProperty("--w", `${rand(6, 11).toFixed(1)}px`);
    piece.style.setProperty("--c", colors[Math.floor(Math.random() * colors.length)]);
    piece.style.setProperty("--dur", `${rand(2.4, 4.2).toFixed(2)}s`);
    piece.style.setProperty("--delay", `${rand(0, 0.9).toFixed(2)}s`);
    piece.style.setProperty("--drift", `${rand(-160, 160).toFixed(0)}px`);
    piece.style.setProperty("--rot", `${rand(360, 1080).toFixed(0)}deg`);

    container.appendChild(piece);

  }

}


/* Standalone confetti burst (reusable, e.g. for milestones later) */

export function launchConfetti({ count = 80, colors = CONFETTI_COLORS } = {}) {

  const layer = document.createElement("div");

  layer.className = "confetti-layer";

  document.body.appendChild(layer);

  spawnConfetti(layer, count, colors);

  setTimeout(() => layer.remove(), 6000);

}


export function celebrateLevelUp({
  skillName,
  fromName,
  toName,
  toLevel,
  maxLevel = 5,
  mastered = false
}) {

  document.getElementById("celebrateOverlay")?.remove();

  const overlay = document.createElement("div");

  overlay.id = "celebrateOverlay";

  overlay.className =
    "celebrate-overlay" + (mastered ? " celebrate-mastered" : "");

  overlay.innerHTML = `
    <div class="celebrate-rays"></div>
    <div class="celebrate-card" role="dialog" aria-live="polite">
      <div class="celebrate-badge"></div>
      <p class="celebrate-kicker"></p>
      <h2 class="celebrate-title"></h2>
      <div class="celebrate-levels">
        <span class="celebrate-from"></span>
        <span class="celebrate-arrow">→</span>
        <span class="celebrate-to"></span>
      </div>
      <div class="celebrate-pips"></div>
      <p class="celebrate-hint">Click anywhere to continue</p>
    </div>
  `;

  /* text is set with textContent so skill names can never break the page */

  overlay.querySelector(".celebrate-badge").textContent =
    mastered ? "👑" : "⭐";

  overlay.querySelector(".celebrate-kicker").textContent =
    mastered ? "MASTERED" : "LEVEL UP";

  overlay.querySelector(".celebrate-title").textContent = skillName;
  overlay.querySelector(".celebrate-from").textContent = fromName;
  overlay.querySelector(".celebrate-to").textContent = toName;

  const pips = overlay.querySelector(".celebrate-pips");

  for (let i = 1; i <= maxLevel; i++) {

    const pip = document.createElement("span");

    pip.className =
      "celebrate-pip" +
      (i <= toLevel ? " on" : "") +
      (i === toLevel ? " new" : "");

    pips.appendChild(pip);

  }

  document.body.appendChild(overlay);

  spawnConfetti(
    overlay,
    mastered ? 140 : 90,
    mastered ? GOLD_COLORS : CONFETTI_COLORS
  );

  let closed = false;

  function close() {

    if (closed) return;

    closed = true;

    document.removeEventListener("keydown", onKey, true);

    overlay.classList.add("celebrate-out");

    setTimeout(() => overlay.remove(), 350);

  }

  function onKey(event) {

    if (["Escape", "Enter", " "].includes(event.key)) {

      event.preventDefault();
      event.stopImmediatePropagation();

      close();

    }

  }

  overlay.addEventListener("click", close);

  document.addEventListener("keydown", onKey, true);

  setTimeout(close, 8000);

}
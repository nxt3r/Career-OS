/*
 * THEMED LINK CHIP
 *
 * A small, accent-colored pill used everywhere one module
 * references an item from another (a project mentioned in
 * Skills, a skill mentioned in Career, etc.) instead of a
 * plain underlined blue link.
 */

const ICONS = {
  project: "📁",
  skill: "🧩",
  career: "🧭"
};


export function renderLinkChip(type, id, label) {

  const icon =
    ICONS[type] || "";

  return `
    <button
      class="link-chip link-chip-${type}"
      data-link-type="${type}"
      data-link-id="${id}"
    >
      <span class="link-chip-icon">${icon}</span>
      ${escapeHTML(label)}
    </button>
  `;

}


export function attachLinkChipEvents(container) {

  container.querySelectorAll(".link-chip").forEach(chip => {

    chip.addEventListener("click", async event => {

      event.stopPropagation();

      const type = chip.dataset.linkType;
      const id = chip.dataset.linkId;

      const pageMap = {
        project: "projects",
        skill: "skills",
        career: "career"
      };

      const { goToItem } =
        await import("./router.js");

      goToItem(pageMap[type], id);

    });

  });

}


function escapeHTML(value) {

  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}
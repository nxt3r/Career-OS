import { goTo } from "../core/router.js";

const NAV_ITEMS = [
  { page: "dashboard", id: "navDashboard", icon: "📊", label: "Dashboard" },
  { page: "timer",     id: "navTimer",     icon: "⏱️", label: "Time OS" },
  { page: "projects",  id: "navProjects",  icon: "📁", label: "Projects" },
  { page: "skills",    id: "navSkills",    icon: "🧩", label: "Skills" },
  { page: "career",    id: "navCareer",    icon: "🧭", label: "Career" },
  { page: "reviews",   id: "navReviews",   icon: "📈", label: "Reviews" },
  { page: "rankings",  id: "navRankings",  icon: "🏆", label: "Rankings" },
  { page: "settings",  id: "navSettings",  icon: "⚙️", label: "Settings" }
];

export function createSidebar() {

  const sidebar =
    document.getElementById("sidebar");

  sidebar.innerHTML = `
    <h1>
      <a class="sidebar-brand" href="#dashboard">
        <span class="brand-mark">C</span>
        <span class="brand-text">Career <span class="brand-os">OS</span></span>
      </a>
    </h1>

    ${NAV_ITEMS.map((item, index) => `
      <button id="${item.id}" data-page="${item.page}">
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
        <span class="nav-key">${index + 1}</span>
      </button>
    `).join("")}
  `;

  highlightActiveNav();

  NAV_ITEMS.forEach(item => {

    document
      .getElementById(item.id)
      .addEventListener("click", () => goTo(item.page));

  });

}


export function highlightActiveNav() {

  const currentPage =
    document.body.dataset.module;

  document
    .querySelectorAll("#sidebar button[data-page]")
    .forEach(button => {

      button.classList.toggle(
        "nav-active",
        button.dataset.page === currentPage
      );

    });

}
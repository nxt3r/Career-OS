import { goTo } from "../core/router.js";

export function createSidebar() {

  const sidebar =
    document.getElementById("sidebar");

  sidebar.innerHTML = `
    <h1>Career OS</h1>

    <button id="navDashboard" data-page="dashboard">
      Dashboard
    </button>

    <button id="navTimer" data-page="timer">
      Time OS
    </button>

    <button id="navProjects" data-page="projects">
      Projects
    </button>

    <button id="navSkills" data-page="skills">
      Skills
    </button>

    <button id="navCareer" data-page="career">
      Career
    </button>

    <button id="navReviews" data-page="reviews">
      Reviews
    </button>

    <button id="navSettings" data-page="settings">
      Settings
    </button>
  `;

  highlightActiveNav();


  document
    .getElementById("navDashboard")
    .addEventListener(
      "click",
      () => goTo("dashboard")
    );


  document
    .getElementById("navTimer")
    .addEventListener(
      "click",
      () => goTo("timer")
    );


  document
    .getElementById("navProjects")
    .addEventListener(
      "click",
      () => goTo("projects")
    );


    document
    .getElementById("navSkills")
    .addEventListener(
      "click",
      () => goTo("skills")
    );


    document
    .getElementById("navCareer")
    .addEventListener(
      "click",
      () => goTo("career")
    );


    document
    .getElementById("navReviews")
    .addEventListener(
      "click",
      () => goTo("reviews")
    );


  document
    .getElementById("navSettings")
    .addEventListener(
      "click",
      () => goTo("settings")
    );

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
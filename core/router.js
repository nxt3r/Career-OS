import { renderDashboard } from "../modules/dashboard/dashboard.js";
import { highlightActiveNav } from "../components/sidebar.js";
import { renderTimer } from "../modules/timer/timer.js";
import { renderProjects } from "../modules/projects/projects.js";
import { renderSkills } from "../modules/skills/skills.js";
import { renderCareer } from "../modules/career/career.js";
import { renderReviews } from "../modules/reviews/reviews.js";
import { renderSettings } from "../modules/settings/settings.js";
import { renderAccountPanel } from "../modules/profile/accountPanel.js";


export function navigate(page, targetId = null) {

    const app = document.getElementById("app");

    app.innerHTML = "";

    document.body.dataset.module = page;

    highlightActiveNav();

    switch (page) {

        case "dashboard":
            renderDashboard(app);
            break;

        case "timer":
            renderTimer(app);
            break;

        case "projects":
            renderProjects(app, targetId);
            break;

        case "skills":
            renderSkills(app, targetId);
            break;    

        case "career":
            renderCareer(app, targetId);
            break;

        case "reviews":
            renderReviews(app);
            break;

        case "settings":
            renderSettings(app);
            break;

        case "account":
            renderAccountPanelRoute(app);
            break;

        default:
            renderDashboard(app);

    }

}


export function goToItem(page, targetId) {

    window.location.hash = page;

    /*
     * Setting the hash alone won't re-trigger navigate()
     * if we're already on that page's hash (hashchange
     * only fires on an actual change) — so call navigate
     * directly as well, which is idempotent and safe.
     */

    navigate(page, targetId);

}


/*
 * Navigate using the URL hash
 */

export function goTo(page) {

    window.location.hash = page;

}


/*
 * Load the page represented by the URL
 */

export function loadRoute() {

    const hash =
        window.location.hash.replace("#", "");

    const page =
        hash || "dashboard";

    navigate(page);

}


async function renderAccountPanelRoute(app) {

    const { auth } = await import("./firebase.js");
    const { getUserProfile } = await import("./username.js");

    const user = auth.currentUser;

    if (!user) return;

    const profile = await getUserProfile(user.uid);

    renderAccountPanel(app, user, profile);

}
import { auth } from "../../core/firebase.js";
import { logOutUser } from "../../core/auth.js";
import { getUserProfile } from "../../core/username.js";
import { getAvatarDisplay } from "./avatars.js";
import { goTo } from "../../core/router.js";

let menuOpen = false;


let outsideClickBound = false;
let scrollListenerBound = false;
let lastScrollY = 0;
let scrollHideTimeout = null;


export async function renderProfileCorner(container, user) {

  if (!container) return;

  if (!scrollListenerBound) {

    scrollListenerBound = true;

    lastScrollY = window.scrollY;

    window.addEventListener("scroll", () => {

      const corner =
        document.getElementById("profileCorner");

      if (!corner) return;

      const currentScrollY = window.scrollY;

      const scrollingDown =
        currentScrollY > lastScrollY && currentScrollY > 40;

      corner.classList.toggle("profile-corner-hidden", scrollingDown);

      lastScrollY = currentScrollY;

      if (scrollHideTimeout) clearTimeout(scrollHideTimeout);

      scrollHideTimeout = setTimeout(() => {

        corner.classList.remove("profile-corner-hidden");

      }, 1200);

    }, { passive: true });

  }

  if (!outsideClickBound) {

    outsideClickBound = true;

    document.addEventListener("click", event => {

      if (!menuOpen) return;

      const corner =
        document.getElementById("profileCorner");

      if (corner && !corner.contains(event.target)) {

        menuOpen = false;

        renderProfileCorner(container, user);

      }

    });

  }
  const profile =
    await getUserProfile(user.uid);

  const avatar =
    getAvatarDisplay(profile);

  container.innerHTML = `

    <div class="profile-corner">

      <button id="profileTrigger" class="profile-trigger">

        ${
          avatar.type === "image"
            ? `<img src="${escapeHTML(avatar.url)}" class="profile-avatar-img">`
            : `<span class="profile-avatar-emoji" style="background:${avatar.color}">${avatar.emoji}</span>`
        }

        <span class="profile-name">
          ${escapeHTML(profile?.displayName || "Account")}
        </span>

      </button>

      ${
        menuOpen
          ? `
            <div class="profile-menu">

              <button id="profileMenuAccount">
                Account Settings
              </button>

              <button id="profileMenuFAQ">FAQ</button>
              <button id="profileMenuPrivacy">Privacy Policy</button>
              <button id="profileMenuLicense">License</button>
              <button id="profileMenuBugReport">Report a Bug</button>
              <button id="profileMenuChat">Help / Chat</button>

              <button id="profileMenuLogout">
                Log Out
              </button>

            </div>
          `
          : ""
      }

    </div>

  `;

  document
    .getElementById("profileTrigger")
    .addEventListener("click", event => {

      event.stopPropagation();

      menuOpen = !menuOpen;

      renderProfileCorner(container, user);

    });

  if (menuOpen) {

    document
      .getElementById("profileMenuAccount")
      .addEventListener("click", event => {

        event.stopPropagation();

        menuOpen = false;

        renderProfileCorner(container, user);

        goTo("account");

      });

          document.getElementById("profileMenuFAQ").addEventListener("click", async e => {
      e.stopPropagation();
      menuOpen = false;
      renderProfileCorner(container, user);
      const { goTo } = await import("../../core/router.js");
      goTo("faq");
    });

    document.getElementById("profileMenuPrivacy").addEventListener("click", async e => {
      e.stopPropagation();
      menuOpen = false;
      renderProfileCorner(container, user);
      const { goTo } = await import("../../core/router.js");
      goTo("privacy");
    });

    document.getElementById("profileMenuLicense").addEventListener("click", async e => {
      e.stopPropagation();
      menuOpen = false;
      renderProfileCorner(container, user);
      const { goTo } = await import("../../core/router.js");
      goTo("license");
    });

    document.getElementById("profileMenuBugReport").addEventListener("click", async e => {
      e.stopPropagation();
      menuOpen = false;
      renderProfileCorner(container, user);
      const { openBugReportModal } = await import("../help/bugReport.js");
      openBugReportModal();
    });

    document.getElementById("profileMenuChat").addEventListener("click", e => {
      e.stopPropagation();
      menuOpen = false;
      renderProfileCorner(container, user);
      goTo("chat");
    });

    document
      .getElementById("profileMenuLogout")
      .addEventListener("click", event => {

        event.stopPropagation();

        logOutUser();

      });

  }

}


function escapeHTML(value) {

  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}
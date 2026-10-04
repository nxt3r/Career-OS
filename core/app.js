import { createSidebar } from "../components/sidebar.js";
import { loadRoute } from "./router.js";
import { initKeyboard } from "./keyboard.js";
import { onAuthChange, isPasswordAccount } from "./auth.js";
import "./passwordToggle.js";
import { renderAuthScreen, renderVerifyScreen } from "../modules/auth/auth.js";
import { renderUsernameScreen } from "../modules/auth/username.js";
import { getUserProfile } from "./username.js";
import { initState, clearState } from "./state.js";
import { setCurrentUid } from "./storage.js";

console.log("App booted");

let listenersAttached = false;


function showScreen(name) {

  const loadingScreen =
    document.getElementById("loadingScreen");

  const authScreen =
    document.getElementById("authScreen");

  const sidebar =
    document.getElementById("sidebar");

  const profileCorner =
    document.getElementById("profileCorner");

  const app =
    document.getElementById("app");

  loadingScreen.style.display =
    name === "loading" ? "" : "none";

  authScreen.style.display =
    name === "auth" ? "" : "none";

  sidebar.style.display =
    name === "app" ? "" : "none";

  profileCorner.style.display =
    name === "app" ? "" : "none";

  app.style.display =
    name === "app" ? "" : "none";

}


onAuthChange(async user => {

  if (!user) {

    clearState();

    setCurrentUid(null);

    showScreen("auth");

    renderAuthScreen(
      document.getElementById("authScreen")
    );

    return;

  }

  showScreen("loading");

  const profile =
    await getUserProfile(user.uid);

  const isTester =
    profile?.isTesterAccount === true;

  const needsVerification =
    isPasswordAccount(user) &&
    !user.emailVerified &&
    !isTester;

  if (needsVerification) {

    showScreen("auth");

    renderVerifyScreen(
      document.getElementById("authScreen"),
      user
    );

    return;

  }

  if (profile?.suspended) {

    showScreen("auth");

    document.getElementById("authScreen").innerHTML = `

      <div class="auth-wrapper">

        <div class="card auth-card">

          <h1>Career OS</h1>

          <h3>Account Suspended</h3>

          <p>
            This account has been suspended. Contact
            support if you believe this is a mistake.
          </p>

          <button id="suspendedLogout">
            Log Out
          </button>

        </div>

      </div>

    `;

    const { logOutUser } =
      await import("./auth.js");

    document
      .getElementById("suspendedLogout")
      .addEventListener("click", () => logOutUser());

    return;

  }

  if (profile?.pendingDeletion) {

    showScreen("auth");

    const { renderPendingDeletionScreen } =
      await import("../modules/auth/pendingDeletion.js");

    renderPendingDeletionScreen(
      document.getElementById("authScreen"),
      user,
      profile
    );

    return;

  }

  if (!profile || !profile.username) {

    showScreen("auth");

    renderUsernameScreen(
      document.getElementById("authScreen"),
      user,
      () => location.reload()
    );

    return;

  }

  setCurrentUid(user.uid);

  await initState(user.uid);

  showScreen("app");

  createSidebar();

  const { renderProfileCorner } =
    await import("../modules/profile/profileCorner.js");

  renderProfileCorner(
    document.getElementById("profileCorner"),
    user
  );

  if (!listenersAttached) {

    listenersAttached = true;

    initKeyboard();

    window.addEventListener(
      "hashchange",
      loadRoute
    );

  }

  loadRoute();

});
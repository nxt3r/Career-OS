/*
 * GLOBAL PASSWORD VISIBILITY TOGGLE
 *
 * Lives in its own file specifically so it survives
 * future full-file rewrites of app.js — it was lost
 * twice before by being embedded there directly.
 */

document.addEventListener("click", event => {

  const button =
    event.target.closest(".toggle-password");

  if (!button) return;

  const input =
    document.getElementById(button.dataset.target);

  if (!input) return;

  input.type =
    input.type === "password" ? "text" : "password";

  button.textContent =
    input.type === "password" ? "👁" : "🙈";

});
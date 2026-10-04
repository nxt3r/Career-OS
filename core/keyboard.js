import { goTo } from "./router.js";
import {
  startTimer,
  togglePause
} from "../modules/timer/timer.js";
import { state } from "./state.js";

export function initKeyboard() {

  document.addEventListener(
    "keydown",
    handleKeydown
  );

}

function handleKeydown(event) {

 const target = event.target;

/*
 * Special case:
 * Enter inside the Activity input
 * starts the timer.
 */

if (target.id === "activity") {

  if (
    event.key === "Enter" &&
    window.location.hash === "#timer"
  ) {

    event.preventDefault();
    startTimer();

  }

  return;
}

/*
 * Ignore other text inputs completely.
 */

if (
  target.tagName === "INPUT" ||
  target.tagName === "TEXTAREA" ||
  target.isContentEditable
) {
  return;
}

  if (window.location.hash === "#timer") {

    if (event.key === "Enter") {

      event.preventDefault();
      startTimer();
      return;

    }

    if (event.code === "Space") {

      event.preventDefault();
      togglePause();
      return;

    }

  }

  switch (event.key) {

    case "1":
      goTo("dashboard");
      break;

    case "2":
      goTo("timer");
      break;

    case "3":
      goTo("projects");
      break;

    case "4":
      goTo("skills");
      break;

    case "5":
      goTo("career");
      break;

    case "6":
      goTo("reviews");
      break;

    case "7":
      goTo("settings");
      break;


    case "f":
    case "F":
      if (state.activeTimer) {

        import("../modules/focus/focusMode.js").then(({ enterFocusMode, exitFocusMode, isFocusModeOpen }) => {

          if (isFocusModeOpen()) {
            exitFocusMode();
          } else {
            enterFocusMode();
          }

        });

      }
      break;

  }

}
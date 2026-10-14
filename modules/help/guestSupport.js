import { signInAsGuest } from "../../core/auth.js";
import { renderAuthScreen } from "../auth/auth.js";
import { renderChatPage, destroyChatPage } from "./chatPage.js";

let open = false;


export function isGuestSupportOpen() {

  return open;

}


export async function openGuestSupport(container) {

  /*
   * Set before signing in, so app.js knows not to redraw the
   * login screen when the anonymous session starts.
   */
  open = true;

  try {

    const credential = await signInAsGuest();

    renderChatPage(container, credential.user, null, {

      guest: true,

      onLeave: () => {

        open = false;

        destroyChatPage();

        renderAuthScreen(container);

      }

    });

  } catch (error) {

    open = false;

    throw error;

  }

}
import { db } from "../../core/firestore.js";
import {
  collection, query, where, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { mountChatThread } from "../../core/chatThread.js";
import { createChat, parseCommand, handleBotFollowUp, SLASH_COMMANDS, GUEST_SLASH_COMMANDS } from "./chat.js";
import { goTo, setPageTeardown } from "../../core/router.js";

let activeThread = null;
let listUnsub = null;


export function destroyChatPage() {

  if (activeThread) {
    activeThread.destroy();
    activeThread = null;
  }

  if (listUnsub) {
    listUnsub();
    listUnsub = null;
  }

}


export function renderChatPage(container, user, profile, { suspended = false, guest = false, onLeave = null } = {}) {

  const standalone = suspended || guest;

  destroyChatPage();

  setPageTeardown(destroyChatPage);

  let chats = [];
  let view = "loading";
  let loaded = false;

  container.innerHTML = `
    <div class="chat-page-outer ${standalone ? "chat-page-outer-standalone" : ""}">
      <div class="chat-page"><p style="padding:30px;">Loading…</p></div>
    </div>
  `;

  function leave() {

    if (onLeave) {
      onLeave();
      return;
    }

    if (suspended) {
      location.reload();
    } else {
      goTo("dashboard");
    }

  }

  function frame(subText, rightHtml) {

    container.innerHTML = `
      <div class="chat-page-outer ${standalone ? "chat-page-outer-standalone" : ""}">
        <div class="chat-page">

          <div class="chat-page-header">

            <div class="chat-header-left">
              <button class="chat-back-btn" id="chatBackBtn" aria-label="Back">‹</button>
            </div>

            <div class="chat-header-center">
              <strong>Support</strong>
              <small id="chatHeaderStatus">${subText}</small>
            </div>

            <div class="chat-header-right">${rightHtml}</div>

          </div>

          <div class="chat-page-thread" id="chatPageBody"></div>

        </div>
      </div>
    `;

  }

  function countText() {

    return `${chats.length} conversation${chats.length === 1 ? "" : "s"}`;

  }

  function showList() {

    view = "list";

    if (activeThread) {
      activeThread.destroy();
      activeThread = null;
    }

    frame(countText(), `<button class="chat-new-btn" id="chatNewBtn">New</button>`);

    document.getElementById("chatBackBtn").addEventListener("click", leave);
    document.getElementById("chatNewBtn").addEventListener("click", () => openThread(null));

    renderHistory();

  }

  function renderHistory() {

    const body = document.getElementById("chatPageBody");

    if (!body) return;

    const sub = document.getElementById("chatHeaderStatus");

    if (sub) sub.textContent = countText();

    if (chats.length === 0) {
      body.innerHTML = `<div class="chat-empty">No conversations yet</div>`;
      return;
    }

    body.innerHTML = `
      <div class="chat-history">
        ${
          chats.map(chat => {

            const needsRating = chat.status === "pending_satisfaction";

            return `
              <button class="chat-history-item ${needsRating ? "chat-history-item-rate" : ""}" data-chat="${chat.id}">
                <div class="chat-history-top">
                  <span class="slash-badge">${chat.slashCommand || "/other"}</span>
                  <span class="chat-history-time">${new Date(chat.lastMessageAt || chat.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p class="chat-history-preview">${escapeHTML(chat.preview || "Conversation")}</p>
                <div class="chat-history-status">${needsRating ? "Please rate this conversation" : statusText(chat)}</div>
              </button>
            `;

          }).join("")
        }
      </div>
    `;

    body.querySelectorAll(".chat-history-item").forEach(button => {
      button.addEventListener("click", () => openThread(button.dataset.chat));
    });

  }

  function openThread(id) {

    view = "thread";

    if (activeThread) {
      activeThread.destroy();
      activeThread = null;
    }

    const existing = id ? chats.find(c => c.id === id) : null;

    frame(statusText(existing), "");

    document.getElementById("chatBackBtn").addEventListener("click", () => {

      if (chats.length === 0) {
        leave();
      } else {
        showList();
      }

    });

    const hintCommands =
      guest
        ? GUEST_SLASH_COMMANDS
        : suspended
          ? [{ command: "/unban", label: "Explain why your account should be reinstated" }]
          : SLASH_COMMANDS.filter(c => c.command !== "/unban");

    activeThread = mountChatThread({

      container: document.getElementById("chatPageBody"),
      db,
      chatId: id,
      myUid: user.uid,
      myRoleLabel: "user",
      hintCommands,
      hintTitle:
        guest
          ? "Stuck logging in or signing up? Start with a command, or just describe the problem."
          : suspended
            ? "Explain your situation below — an admin will review your appeal."
            : "Start with a command, or just type — anything else is filed under /other.",

      onFirstSend: async text => {

        if (suspended) {

          const body = text.replace(/^\/unban\s*/i, "").trim() || text;

          return createChat(user, profile, "/unban", body);

        }

        if (guest) {

          const parsed = parseCommand(text, { guest: true });

          return createChat(user, null, parsed.command, parsed.text, { guest: true });

        }

        let { command, text: body } = parseCommand(text);

        if (command === "/unban") {
          command = "/other";
          body = text;
        }

        return createChat(user, profile, command, body);

      },

      onAfterSend: (text, chat) => handleBotFollowUp(chat, text),

      getReplyState: chat => {

        if (!chat) return { allowed: true };

        if (chat.status === "resolved") {
          return { allowed: false, placeholder: "This conversation is closed — start a new one" };
        }

        if (chat.status === "pending_satisfaction") {
          return { allowed: false, placeholder: "Please rate this conversation first" };
        }

        return { allowed: true };

      },

      onChatUpdate: chat => {

        const status = document.getElementById("chatHeaderStatus");

        if (status) status.textContent = statusText(chat);

      }

    });

  }

  listUnsub = onSnapshot(
    query(collection(db, "chats"), where("userUid", "==", user.uid)),
    snapshot => {

      chats =
        snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(c => !suspended || c.slashCommand === "/unban")
          .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));

      if (!loaded) {

        loaded = true;

        if (chats.length === 0) {
          openThread(null);
        } else {
          showList();
        }

        return;

      }

      if (view === "list") renderHistory();

    },
    error => {

      console.error("Chat list error:", error);

      container.innerHTML = `<p style="padding:30px;">Couldn't load your conversations. Please try again.</p>`;

    }
  );

}


function statusText(chat) {

  if (!chat) return "New conversation";

  const map = {
    waiting: "Waiting for a team member…",
    pending: "Waiting for a team member…",
    bot_resolved: "Answered by our assistant",
    claimed: "Connected to support",
    pending_satisfaction: "Marked resolved — please rate below",
    resolved: "Resolved",
    reopened: "Reopened — waiting for a team member"
  };

  return map[chat.status] || "";

}


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}
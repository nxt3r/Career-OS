import {
  collection, doc, addDoc, updateDoc, onSnapshot, query, orderBy, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export function mountChatThread({
  container,
  db,
  chatId = null,
  myUid,
  myRoleLabel,
  hintCommands = null,
  hintTitle = "Start with a command, or just type — anything else is filed under /other.",
  onFirstSend = null,
  onAfterSend = null,
  getReplyState = null,
  onChatUpdate = null
}) {

  let currentChatId = null;
  let chatData = null;
  let messagesCache = [];
  let unsubMessages = null;
  let unsubChat = null;
  let lastMessageCount = 0;

  container.innerHTML = `
    <div class="chat-thread">

      ${
        hintCommands && !chatId
          ? `
            <div class="chat-hints">
              <p class="chat-hints-title">${escapeHTML(hintTitle)}</p>
              ${
                hintCommands
                  .map(cmd => `<div class="chat-hint-line"><code>${cmd.command}</code> ${escapeHTML(cmd.label)}</div>`)
                  .join("")
              }
            </div>
          `
          : ""
      }

      <div class="chat-messages"></div>

      <div class="chat-error"></div>

      <div class="chat-inputbar">
        <input type="text" class="chat-input" placeholder="Message" autocomplete="off">
        <button class="chat-send-btn" aria-label="Send">↑</button>
      </div>

    </div>
  `;

  const messagesEl = container.querySelector(".chat-messages");
  const inputEl = container.querySelector(".chat-input");
  const sendBtn = container.querySelector(".chat-send-btn");
  const errorEl = container.querySelector(".chat-error");


  function applyReplyState() {

    const state =
      getReplyState
        ? getReplyState(chatData)
        : { allowed: true };

    inputEl.disabled = !state.allowed;
    sendBtn.disabled = !state.allowed;
    inputEl.placeholder = state.placeholder || "Message";

  }


  async function rate(result) {

    if (!currentChatId || !chatData) return;

    const entry = {
      staffUid: chatData.resolvedByUid || null,
      staffUsername: chatData.resolvedByUsername || null,
      staffRole: chatData.resolvedByRole || null,
      result,
      at: Date.now()
    };

    const updates =
      result === "satisfied"
        ? {
            status: "resolved",
            satisfaction: "satisfied",
            ratings: arrayUnion(entry)
          }
        : {
            status: "reopened",
            satisfaction: "not_satisfied",
            claimedByUid: null,
            claimedByUsername: null,
            claimedByRole: null,
            ratings: arrayUnion(entry)
          };

    try {

      await updateDoc(doc(db, "chats", currentChatId), updates);

    } catch (error) {

      console.error("Rating error:", error);

      errorEl.textContent = "Couldn't save your rating — try again.";

    }

  }


  function renderPrompt(msg, isLast) {

    let extra = "";

    if (isLast && myRoleLabel === "user") {

      if (chatData?.status === "pending_satisfaction") {

        extra = `
          <div class="chat-satisfaction-buttons">
            <button class="chat-sat-yes">✓ Satisfied</button>
            <button class="chat-sat-no">✕ Not satisfied</button>
          </div>
        `;

      } else if (chatData?.satisfaction === "satisfied") {

        extra = `<p class="chat-satisfaction-result">✓ You marked this as solved</p>`;

      } else if (chatData?.satisfaction === "not_satisfied") {

        extra = `<p class="chat-satisfaction-result">✕ You marked this as not solved</p>`;

      }

    }

    if (isLast && myRoleLabel === "staff") {

      if (chatData?.status === "pending_satisfaction") {
        extra = `<p class="chat-satisfaction-result">Waiting for the user's rating</p>`;
      } else if (chatData?.satisfaction === "satisfied") {
        extra = `<p class="chat-satisfaction-result">✓ User marked satisfied</p>`;
      } else if (chatData?.satisfaction === "not_satisfied") {
        extra = `<p class="chat-satisfaction-result">✕ User marked not satisfied</p>`;
      }

    }

    return `
      <div class="chat-system">
        <p>${escapeHTML(msg.text)}</p>
        ${extra}
      </div>
    `;

  }


  function renderMessages() {

    const lastPromptIndex =
      messagesCache.map(m => m.type).lastIndexOf("satisfaction_prompt");

    let previousSender = null;

    messagesEl.innerHTML =
      messagesCache.map((msg, index) => {

        if (msg.type === "satisfaction_prompt") {

          previousSender = null;

          return renderPrompt(msg, index === lastPromptIndex);

        }

        const isMine = msg.senderUid === myUid;
        const isBot = msg.senderRole === "bot";
        const senderKey = `${msg.senderUid}:${msg.senderRole}`;
        const showLabel = !isMine && senderKey !== previousSender;

        previousSender = senderKey;

        const label =
          isBot ? "Bot" :
          msg.senderRole === "staff" ? "Support" : "User";

        return `
          ${showLabel ? `<div class="chat-sender">${label}</div>` : ""}
          <div class="chat-bubble ${isMine ? "chat-bubble-mine" : "chat-bubble-theirs"} ${isBot ? "chat-bubble-bot" : ""}">
            <p>${escapeHTML(msg.text)}</p>
          </div>
        `;

      }).join("");

    const lockButtons = () =>
      messagesEl.querySelectorAll(".chat-satisfaction-buttons button")
        .forEach(b => b.disabled = true);

    messagesEl.querySelectorAll(".chat-sat-yes").forEach(button => {
      button.addEventListener("click", () => { lockButtons(); rate("satisfied"); });
    });

    messagesEl.querySelectorAll(".chat-sat-no").forEach(button => {
      button.addEventListener("click", () => { lockButtons(); rate("not_satisfied"); });
    });

    if (messagesCache.length !== lastMessageCount) {

      messagesEl.scrollTop = messagesEl.scrollHeight;

      lastMessageCount = messagesCache.length;

    }

  }


  function attachChat(id) {

    currentChatId = id;

    const hints = container.querySelector(".chat-hints");

    if (hints) hints.remove();

    if (unsubChat) unsubChat();
    if (unsubMessages) unsubMessages();

    unsubChat = onSnapshot(doc(db, "chats", id), snap => {

      chatData = snap.exists() ? { id: snap.id, ...snap.data() } : null;

      applyReplyState();

      renderMessages();

      if (onChatUpdate) onChatUpdate(chatData);

    });

    unsubMessages = onSnapshot(
      query(collection(db, "chats", id, "messages"), orderBy("timestamp")),
      snap => {

        messagesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        renderMessages();

      }
    );

  }


  async function send() {

    const text = inputEl.value.trim();

    if (!text || inputEl.disabled) return;

    errorEl.textContent = "";

    inputEl.value = "";

    try {

      if (!currentChatId) {

        if (!onFirstSend) return;

        inputEl.disabled = true;
        sendBtn.disabled = true;

        const newId = await onFirstSend(text);

        inputEl.disabled = false;
        sendBtn.disabled = false;

        if (newId) attachChat(newId);

        inputEl.focus();

        return;

      }

      await addDoc(collection(db, "chats", currentChatId, "messages"), {
        senderUid: myUid,
        senderRole: myRoleLabel,
        text,
        timestamp: Date.now()
      });

      await updateDoc(doc(db, "chats", currentChatId), { lastMessageAt: Date.now() });

      if (onAfterSend) {

        try {

          await onAfterSend(text, chatData);

        } catch (error) {

          console.error("Chat follow-up error:", error);

        }

      }

    } catch (error) {

      console.error("Chat send error:", error);

      inputEl.disabled = false;
      sendBtn.disabled = false;

      inputEl.value = text;

      errorEl.textContent =
        "Couldn't send that — check your connection and try again.";

    }

  }


  sendBtn.addEventListener("click", send);

  inputEl.addEventListener("keydown", event => {
    if (event.key === "Enter") send();
  });

  if (chatId) {

    attachChat(chatId);

  } else {

    applyReplyState();

  }

  inputEl.focus();

  return {

    destroy() {

      if (unsubMessages) unsubMessages();
      if (unsubChat) unsubChat();

      unsubMessages = null;
      unsubChat = null;

    }

  };

}


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}
import { db } from "../../core/firestore.js";
import {
  collection, addDoc, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const SLASH_COMMANDS = [
  { command: "/unban", label: "Appeal a suspension" },
  { command: "/bug", label: "Report a bug" },
  { command: "/billing", label: "Question about my account or data" },
  { command: "/account", label: "Help with login, password, or username" },
  { command: "/other", label: "Something else" }
];

/* Shown only to guests chatting from the login screen. */
export const GUEST_SLASH_COMMANDS = [
  { command: "/login", label: "Trouble logging in" },
  { command: "/signup", label: "Trouble signing up" },
  { command: "/verify", label: "Email verification problems" },
  { command: "/password", label: "Forgot or can't reset my password" },
  { command: "/staff", label: "Talk to a team member" }
];

/* Instant answers for the guest commands. */
const COMMAND_ANSWERS = {
  "/login": "Check that your email and password are right. If you signed up with Google or GitHub, use that button instead, because those accounts have no password. If you forgot your password, type your email on the login screen and click 'Forgot password?'. Still stuck? Describe what happens and I'll bring in a team member.",
  "/signup": "To sign up, enter your email and a password of at least 6 characters, then verify your email using the link we send. After that you'll pick a username (3 to 20 characters: letters, numbers and underscores). If it says the email already exists, you already have an account, so log in instead.",
  "/verify": "After signing up we email you a link. Click it, then press 'I've Verified — Continue' on the verify screen. No email? Check your spam folder, then press 'Resend Email'. Closed the screen? Log in again with the same email and password and you'll land back on the verify screen.",
  "/password": "On the login screen, type your email, then click 'Forgot password?' to get a reset link (check spam too). Passwords need at least 6 characters. Google and GitHub accounts don't have a password."
};

/* Valid when typed, but never shown in the hints. */
const HIDDEN_COMMANDS = ["/mods"];

const COMMAND_ALIASES = { "/mod": "/mods" };

/* These go straight to a human — the bot stays out of them. */
const NO_BOT_COMMANDS = ["/unban", "/mods", "/staff"];

const HUMAN_ACK = {
  "/unban": "Your appeal has been sent to the admin team. You'll hear back in this chat.",
  "/mods": "Your message has been sent to the admin team.",
  "/staff": "Your message has been sent to our team. Someone will reply here. You can close this page and come back later through 'Contact support' on the login screen, in the same browser."
};

const BUG_ACK = "Thanks — this has been logged as a bug report for our team to review.";

const ESCALATION = {
  "/billing": "Got it — a team member will join this chat shortly to look into your account question.",
  "/account": "Got it — a team member will join this chat shortly to help with your login or account issue.",
  "/other": "Thanks for reaching out — a team member will join this chat shortly."
};

const FOLLOW_UP_ESCALATION =
  "I couldn't find an answer for that — a team member will join this chat shortly.";

/*
 * Answer rules are listed first. `short` rules are chatter
 * (thanks / ok / hi) and only match short messages, so a real
 * question that merely contains "ok" still gets escalated.
 *
 * Keywords match whole words or phrases, so list the variants
 * people actually type. Specific rules come before general ones.
 */
const BOT_RULES = [

  {
    keywords: ["didn't get", "didnt get", "didn t get", "never got", "never received", "not received", "haven't received", "havent received", "no email", "not getting", "resend", "spam"],
    response: "Check your spam or junk folder first, and make sure your email address was typed correctly. For a verification email, press 'Resend Email' on the verify screen. For a password reset, click 'Forgot password?' on the login screen again."
  },

  {
    keywords: ["verify", "verified", "verifying", "verification", "backed out", "already exists", "already in use", "already registered"],
    response: "Your account is created as soon as you sign up, even if you leave the verify screen. Don't sign up again. Log in with the same email and password and you'll be taken back to the verify screen. Click the link in the email, then press 'I've Verified — Continue'. If the link expired, press 'Resend Email'."
  },

  {
    keywords: ["wrong password", "incorrect password", "incorrect email", "invalid credential", "can't log in", "cant log in", "can t log in", "cannot log in", "unable to log in", "can't login", "cant login", "can t login", "won't log in", "wont log in", "login not working", "login problem", "login issue"],
    response: "Check that your email and password are right. If you signed up with Google or GitHub, use the 'Continue with Google' or 'Continue with GitHub' button instead, because those accounts have no password. If you forgot your password, type your email on the login screen and click 'Forgot password?'."
  },

  {
    keywords: ["google login", "google sign in", "github login", "github sign in", "continue with google", "continue with github", "popup", "pop up", "sign in was cancelled"],
    response: "Allow pop-ups for this site, turn off ad blockers or privacy extensions for a moment, and try again. Closing the pop-up before it finishes cancels the sign-in."
  },

  {
    keywords: ["username taken", "invalid username", "choose a username", "pick a username", "username rules", "username requirements"],
    response: "A username is 3 to 20 characters: letters, numbers and underscores only. If it says it's taken, try another one or add a number."
  },

  {
    keywords: ["password requirements", "weak password", "password too short", "password rules", "password length", "at least 6"],
    response: "Passwords need at least 6 characters. Longer ones with capitals, numbers and symbols show as Strong or Perfect."
  },

  {
    keywords: ["pending deletion", "scheduled for deletion", "restore my account", "restore account", "undo delete", "cancel deletion", "cancel account deletion"],
    response: "If you scheduled your account for deletion, you have 30 days to restore it. Just log in again before then and follow the prompt."
  },

  {
    keywords: ["suspended", "banned", "account disabled", "locked out"],
    response: "Suspended accounts are reviewed by our team. Log in and press 'Contact Support' on the suspended-account screen to send an appeal. If you're chatting from the login screen, start a message with /staff and a team member will pick it up."
  },

  { keywords: ["password", "forgot", "reset"], response: "You can reset your password from the login screen using 'Forgot password?', or from Account Settings if you're logged in." },
  { keywords: ["delete my account", "delete account", "remove my account", "close my account"], response: "You can delete your account from Settings → Danger Zone. It gives you a 30-day window to restore it." },
  { keywords: ["export", "backup", "download my data"], response: "You can export all your data as a file from Settings → Data → Export Data." },
  { keywords: ["thanks", "thank you", "thx", "ty", "cheers", "appreciate it"], response: "You're welcome! Let us know if there's anything else.", short: true },
  { keywords: ["ok", "okay", "alright", "got it", "understood", "cool"], response: "👍 Anything else I can help with?", short: true },
  { keywords: ["hi", "hello", "hey"], response: "Hi! Tell me what you need help with and I'll do my best — or I'll bring in a team member.", short: true }
];


function normalize(text) {

  return " " + text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim() + " ";

}


export function getBotReply(message) {

  const normalized = normalize(message);

  const wordCount =
    normalized.trim().split(" ").filter(Boolean).length;

  const rule =
    BOT_RULES.find(candidate => {

      if (candidate.short && wordCount > 4) return false;

      return candidate.keywords.some(
        keyword => normalized.includes(" " + keyword + " ")
      );

    });

  return rule ? rule.response : null;

}


export function parseCommand(text, { guest = false } = {}) {

  const match = text.match(/^\/([a-zA-Z]+)\s*([\s\S]*)$/);

  if (match) {

    const typed = "/" + match[1].toLowerCase();

    const command = COMMAND_ALIASES[typed] || typed;

    const known =
      guest
        ? GUEST_SLASH_COMMANDS.some(c => c.command === command)
        : SLASH_COMMANDS.some(c => c.command === command) ||
          HIDDEN_COMMANDS.includes(command);

    if (known) {

      return { command, text: match[2].trim() || text };

    }

  }

  return { command: "/other", text };

}


export async function createChat(user, profile, slashCommand, firstMessage, { guest = false } = {}) {

  const command = slashCommand || "/other";

  const base = Date.now();

  const chatRef =
    await addDoc(collection(db, "chats"), {

      userUid: user.uid,
      username: guest ? "Guest" : (profile?.username || user.email),
      guest,
      status: "waiting",
      claimedByUid: null,
      claimedByUsername: null,
      claimedByRole: null,
      slashCommand: command,
      satisfaction: null,
      ratings: [],
      preview: firstMessage.slice(0, 80),
      createdAt: base,
      lastMessageAt: base

    });

  const messages =
    collection(db, "chats", chatRef.id, "messages");

  await addDoc(messages, {
    senderUid: user.uid,
    senderRole: "user",
    text: firstMessage,
    timestamp: base
  });

  const botSay = (text, offset) =>
    addDoc(messages, {
      senderUid: "bot",
      senderRole: "bot",
      text,
      timestamp: base + offset
    });

  if (NO_BOT_COMMANDS.includes(command)) {

    await botSay(HUMAN_ACK[command], 1);

    return chatRef.id;

  }

  let offset = 1;

  if (command === "/bug") {

    await botSay(BUG_ACK, offset++);

    await addDoc(collection(db, "bugReports"), {
      reporterUid: user.uid,
      reporterUsername: profile?.username || null,
      description: firstMessage,
      page: null,
      status: "open",
      createdAt: base,
      fromChat: chatRef.id
    });

  }

  const reply = COMMAND_ANSWERS[command] || getBotReply(firstMessage);

  if (reply) {

    await botSay(reply, offset);

    await updateDoc(doc(db, "chats", chatRef.id), { status: "bot_resolved" });

  } else {

    if (ESCALATION[command]) {
      await botSay(ESCALATION[command], offset);
    }

    await updateDoc(doc(db, "chats", chatRef.id), { status: "pending" });

  }

  return chatRef.id;

}


/*
 * Called after the user sends a later message in an existing chat.
 * The bot stays completely silent once a human is involved.
 */
export async function handleBotFollowUp(chat, text) {

  if (!chat) return;

  if (NO_BOT_COMMANDS.includes(chat.slashCommand)) return;

  if (["claimed", "pending_satisfaction", "resolved"].includes(chat.status)) return;

  const messages =
    collection(db, "chats", chat.id, "messages");

  if (/^\/[a-zA-Z]+/.test(text)) {

    await addDoc(messages, {
      senderUid: "bot",
      senderRole: "bot",
      text: "Commands only work at the start of a new conversation. Tap ‹ to go back, press New, and put the command first.",
      timestamp: Date.now() + 1
    });

    return;

  }

  const reply = getBotReply(text);

  if (reply) {

    await addDoc(messages, {
      senderUid: "bot",
      senderRole: "bot",
      text: reply,
      timestamp: Date.now() + 1
    });

    return;

  }

  if (chat.status === "bot_resolved") {

    await addDoc(messages, {
      senderUid: "bot",
      senderRole: "bot",
      text: FOLLOW_UP_ESCALATION,
      timestamp: Date.now() + 1
    });

    await updateDoc(doc(db, "chats", chat.id), { status: "pending" });

  }

}
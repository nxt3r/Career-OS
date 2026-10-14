import { state } from "../../core/state.js";
import { db } from "../../core/firestore.js";
import { auth } from "../../core/firebase.js";
import { getUserProfile } from "../../core/username.js";
import { openModal, closeModal, showModalError } from "../../core/modal.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function openBugReportModal() {

  const user = auth.currentUser;

  if (!user) return;

  const profile = await getUserProfile(user.uid);

  openModal(`
    <h3>Report a Bug</h3>
    <div id="bugReportError" class="auth-error"></div>
    <div class="modal-field">
      <label>What happened?</label>
      <textarea id="bugDescInput" placeholder="Describe the bug — what you did, what you expected, what happened instead"></textarea>
    </div>
    <div class="modal-field">
      <label>Which page were you on? (optional)</label>
      <input type="text" id="bugPageInput" value="${window.location.hash.replace("#", "") || "dashboard"}">
    </div>
    <div class="modal-actions">
      <button class="modal-save" id="bugReportSave">Submit</button>
      <button class="modal-cancel" id="bugReportCancel">Cancel</button>
    </div>
  `);

  document.getElementById("bugReportCancel").addEventListener("click", closeModal);

  document.getElementById("bugReportSave").addEventListener("click", async () => {

    const errorBox = document.getElementById("bugReportError");
    const description = document.getElementById("bugDescInput").value.trim();

    if (!description) {
      showModalError(errorBox, "Please describe the bug.");
      return;
    }

    const page = document.getElementById("bugPageInput").value.trim();

    try {

      await addDoc(collection(db, "bugReports"), {
        reporterUid: user.uid,
        reporterUsername: profile?.username || null,
        description,
        page: page || null,
        status: "open",
        createdAt: Date.now()
      });

      closeModal();

      openModal(`
        <h3>Thanks!</h3>
        <p>Your bug report has been submitted.</p>
        <div class="modal-actions"><button class="modal-cancel" id="closeBugThanks">Close</button></div>
      `);

      document.getElementById("closeBugThanks").addEventListener("click", closeModal);

    } catch (error) {

      console.error("Bug report error:", error);

      showModalError(errorBox, "Could not submit report. Try again.");

    }

  });

}
import { state } from "../../core/state.js";
import { saveData } from "../../core/storage.js";
import { openModal, closeModal, showModalError } from "../../core/modal.js";

export function openQuickCaptureModal() {

  const projectOptions =
    state.projects
      .filter(p => !p.archived)
      .map(p => `<option value="${p.id}">${p.name}</option>`)
      .join("");

  openModal(`
    <h3>Quick Capture</h3>
    <div id="qcError" class="auth-error"></div>
    <div class="modal-field">
      <label>What's on your mind?</label>
      <input type="text" id="qcInput">
    </div>
    <div class="modal-field">
      <label>Project (optional)</label>
      <select id="qcProject">
        <option value="">No project</option>
        ${projectOptions}
      </select>
    </div>
    <div class="modal-actions">
      <button class="modal-save" id="qcSave">Capture</button>
      <button class="modal-cancel" id="qcCancel">Cancel</button>
    </div>
  `);

  document.getElementById("qcCancel").addEventListener("click", closeModal);

  document.getElementById("qcInput").focus();

  document.getElementById("qcSave").addEventListener("click", () => {

    const errorBox = document.getElementById("qcError");
    const text = document.getElementById("qcInput").value.trim();

    if (!text) {
      showModalError(errorBox, "Capture cannot be empty.");
      return;
    }

    const projectId =
      document.getElementById("qcProject").value || null;

    state.captures.unshift({
      id: Date.now(),
      text,
      projectId,
      createdAt: Date.now()
    });

    saveData(state);

    closeModal();

  });

}
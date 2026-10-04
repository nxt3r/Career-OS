/*
 * REUSABLE MODAL SHELL
 *
 * Renders a centered overlay with the given HTML content.
 * Used for replacing prompt()/confirm() chains with real
 * forms across the app.
 */

let currentCloseHandler = null;


export function openModal(innerHTML, { onClose } = {}) {

  closeModal();

  const overlay =
    document.createElement("div");

  overlay.id = "modalOverlay";
  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div class="modal-box">
      ${innerHTML}
    </div>
  `;

  document.body.appendChild(overlay);

  const firstInput =
    overlay.querySelector("input[type='text'], input[type='email'], input[type='password']");

  if (firstInput) {

    firstInput.focus();

  }

  overlay.addEventListener("click", event => {

    if (event.target === overlay) {

      closeModal();

    }

  });

  const keyHandler = event => {

    if (event.key === "Escape") {

      closeModal();

      return;

    }

    if (event.key === "Enter") {

      const focused =
        document.activeElement;

      /*
       * Only trigger on text/number inputs — never
       * hijack Enter inside a <select> (browsers use
       * it to confirm the dropdown's own choice) or
       * a <textarea> (where Enter should insert a
       * newline, if one is ever added to a modal).
       */

      const isTextInput =
        focused &&
        focused.tagName === "INPUT" &&
        focused.type !== "checkbox" &&
        focused.type !== "radio";

      if (!isTextInput) return;

      const primaryButton =
        overlay.querySelector(".modal-save, .modal-danger");

      if (primaryButton) {

        event.preventDefault();

        primaryButton.click();

      }

    }

  };

  document.addEventListener("keydown", keyHandler);

  currentCloseHandler = () => {

    document.removeEventListener("keydown", keyHandler);

    if (onClose) onClose();

  };

  return overlay;

}


export function showModalError(errorElement, message) {

  errorElement.textContent = message;

  errorElement.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

}


export function confirmDelete({
  title,
  message,
  confirmText,
  onConfirm
}) {

  openModal(`

    <h3>${title}</h3>

    <p>${message}</p>

    <div id="deleteConfirmError" class="auth-error"></div>

    <div class="modal-field">
      <label>Type "${escapeModalHTML(confirmText)}" to confirm</label>
      <input type="text" id="deleteConfirmInput">
    </div>

    <div class="modal-actions">
      <button class="modal-danger" id="deleteConfirmSave">Delete</button>
      <button class="modal-cancel" id="deleteConfirmCancel">Cancel</button>
    </div>

  `);

  document
    .getElementById("deleteConfirmCancel")
    .addEventListener("click", closeModal);

  document
    .getElementById("deleteConfirmSave")
    .addEventListener("click", () => {

      const input =
        document.getElementById("deleteConfirmInput").value;

      const errorBox =
        document.getElementById("deleteConfirmError");

      if (input !== confirmText) {

        showModalError(errorBox, "Text does not match.");

        return;

      }

      closeModal();

      onConfirm();

    });

}


function escapeModalHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


export function closeModal() {

  const overlay =
    document.getElementById("modalOverlay");

  if (overlay) {

    overlay.remove();

  }

  if (currentCloseHandler) {

    currentCloseHandler();

    currentCloseHandler = null;

  }

}

export function confirmSimple({ title, message, onConfirm }) {

  openModal(`

    <h3>${title}</h3>

    <p>${message}</p>

    <div id="simpleConfirmError" class="auth-error"></div>

    <div class="modal-field">
      <label>Type "YES" to confirm</label>
      <input type="text" id="simpleConfirmInput">
    </div>

    <div class="modal-actions">
      <button class="modal-danger" id="simpleConfirmSave">Delete</button>
      <button class="modal-cancel" id="simpleConfirmCancel">Cancel</button>
    </div>

  `);

  document.getElementById("simpleConfirmCancel")
    .addEventListener("click", closeModal);

  document.getElementById("simpleConfirmSave")
    .addEventListener("click", () => {

      const input = document.getElementById("simpleConfirmInput").value.trim();
      const errorBox = document.getElementById("simpleConfirmError");

      if (input.toUpperCase() !== "YES") {

        showModalError(errorBox, 'Type "YES" to confirm.');
        return;

      }

      closeModal();
      onConfirm();

    });

}
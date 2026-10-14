import { state } from "../../core/state.js";
import { saveData, resetAllData } from "../../core/storage.js";
import { auth } from "../../core/firebase.js";
import { clearMyRanking } from "../../core/rankings.js";
import {
  getUserProfile,
  requestAccountDeletion
} from "../../core/username.js";
import {
  isPasswordAccount,
  reauthenticateWithPassword,
  reauthenticateWithGoogle,
  reauthenticateWithGithub,
  logOutUser,
  resetPassword
} from "../../core/auth.js";
import {
  openModal,
  closeModal,
  showModalError,
  confirmDelete,
  confirmSimple
} from "../../core/modal.js";

const GROUPS = ["Focus", "Distraction", "Neutral"];


/* =========================================================
   MAIN SETTINGS VIEW
   ========================================================= */

export async function renderSettings(app) {

  if (!app) return;

  const user =
    auth.currentUser;

  const profile =
    user
      ? await getUserProfile(user.uid)
      : null;

  app.innerHTML = `
    <section>

      <h2>Settings</h2>

      <div class="card">

        <h3>Goals</h3>

        <div class="setting-row">
          <div>
            <p class="setting-row-label">Weekly Focus Target</p>
            <p class="setting-row-value">${state.settings.weeklyTarget}h</p>
          </div>
          <button id="editWeeklyTarget" class="btn-compact">Edit</button>
        </div>

        <div class="setting-row">
          <div>
            <p class="setting-row-label">Weekly Distraction Limit</p>
            <p class="setting-row-value">${state.settings.distractionLimit}h</p>
          </div>
          <button id="editDistractionLimit" class="btn-compact">Edit</button>
        </div>

        <div class="setting-row">
          <div style="flex:1;">
            <label for="weekStartSelect" class="setting-row-label">Week starts on</label>
          <select id="weekStartSelect">
            <option value="monday" ${state.settings.weekStart !== "sunday" && state.settings.weekStart !== "saturday" && state.settings.weekStart !== "friday" && state.settings.weekStart !== "thursday" && state.settings.weekStart !== "wednesday" && state.settings.weekStart !== "tuesday" ? "selected" : ""}>Monday</option>
            <option value="tuesday" ${state.settings.weekStart === "tuesday" ? "selected" : ""}>Tuesday</option>
            <option value="wednesday" ${state.settings.weekStart === "wednesday" ? "selected" : ""}>Wednesday</option>
            <option value="thursday" ${state.settings.weekStart === "thursday" ? "selected" : ""}>Thursday</option>
            <option value="friday" ${state.settings.weekStart === "friday" ? "selected" : ""}>Friday</option>
            <option value="saturday" ${state.settings.weekStart === "saturday" ? "selected" : ""}>Saturday</option>
            <option value="sunday" ${state.settings.weekStart === "sunday" ? "selected" : ""}>Sunday</option>
          </select>
          </div>
          <button id="saveWeekStart" class="btn-compact">Save</button>
        </div>

      </div>


      <div class="card">

        <h3>Categories</h3>

        <p>
          Focus and Distraction totals across the app
          are based on which group each category belongs
          to. Neutral categories are tracked but not
          counted as either.
        </p>

        <div class="project-actions">
          <button id="addCategoryBtn">
            + Add Category
          </button>
        </div>

        <div id="categoryList"></div>

      </div>


      <div class="card">

        <h3>Skill Categories</h3>

        <div class="project-actions">
          <button id="addSkillCategoryBtn">
            + Add Skill Category
          </button>
        </div>

        <div id="skillCategoryList"></div>

      </div>


      <div class="card">

        <h3>Data</h3>

        <p>
          All data is stored in the cloud, tied to your account.
        </p>

        <div class="project-actions">

          <button id="exportDataBtn">
            Export Data
          </button>

          <button id="importDataBtn">
            Import Data
          </button>

          <button id="resetDataBtn">
            Reset All Data
          </button>

        </div>

        <input
          type="file"
          id="importFileInput"
          accept="application/json"
          style="display:none"
        >

      </div>


      <div class="card danger-zone">

        <h3>Delete a Project</h3>

        <p>
          Only archived projects can be permanently deleted.
          This requires re-verifying your identity and cannot
          be undone.
        </p>

        <button id="manageDeleteProjectsBtn">
          Manage Archived Projects
        </button>

      </div>


      <div class="card danger-zone">

        <h3>Danger Zone</h3>

        <p>
          Deleting your account logs you out immediately.
          You'll have 30 days to restore it by logging back
          in before it's permanently deleted.
        </p>

        <button id="deleteAccountBtn">
          Delete Account
        </button>

      </div>

    </section>
  `;

  renderCategoryList();

  renderSkillCategoryList();

  attachSettingsEvents();

}


/* =========================================================
   CATEGORY LIST
   ========================================================= */

function renderCategoryList() {

  const container =
    document.getElementById("categoryList");

  if (!container) return;

  container.innerHTML = `
    <ul class="milestone-list">

      ${
        state.categories
          .map(category => `
            <li class="milestone">

              <span>
                <strong>${escapeHTML(category.name)}</strong>
                —
                ${category.group}
                ${category.builtIn ? " (built-in)" : ""}
              </span>

              <div class="project-actions inline-actions">

                <button
                  class="edit-category"
                  data-category="${category.id}"
                >
                  Edit
                </button>

                ${
                  !category.builtIn
                    ? `<button class="delete-category" data-category="${category.id}">Delete</button>`
                    : ""
                }

              </div>

            </li>
          `)
          .join("")
      }

    </ul>
  `;

}


/* =========================================================
   SKILL CATEGORY LIST
   ========================================================= */

function renderSkillCategoryList() {

  const container =
    document.getElementById("skillCategoryList");

  if (!container) return;

  container.innerHTML = `
    <ul class="milestone-list">

      ${
        state.skillCategories
          .map(category => `
            <li class="milestone">

              <span><strong>${escapeHTML(category)}</strong></span>

              <div class="project-actions inline-actions">
                <button class="rename-skill-category" data-category="${escapeHTML(category)}">Rename</button>
                <button class="delete-skill-category" data-category="${escapeHTML(category)}">Delete</button>
              </div>

            </li>
          `)
          .join("")
      }

    </ul>
  `;

}


function handleSkillCategoryListClick(event) {

  const button =
    event.target.closest("button");

  if (!button) return;

  const categoryName =
    button.dataset.category;

  if (button.classList.contains("rename-skill-category")) {
    renameSkillCategory(categoryName);
    return;
  }

  if (button.classList.contains("delete-skill-category")) {
    deleteSkillCategory(categoryName);
    return;
  }

}


function addSkillCategory() {

  openModal(`
    <h3>Add Skill Category</h3>
    <div id="addSkillCatError" class="auth-error"></div>
    <div class="modal-field">
      <label>Name</label>
      <input type="text" id="addSkillCatInput">
    </div>
    <div class="modal-actions">
      <button class="modal-save" id="addSkillCatSave">Add</button>
      <button class="modal-cancel" id="addSkillCatCancel">Cancel</button>
    </div>
  `);

  document.getElementById("addSkillCatCancel")
    .addEventListener("click", closeModal);

  document.getElementById("addSkillCatSave")
    .addEventListener("click", () => {

      const errorBox = document.getElementById("addSkillCatError");
      const trimmedName = document.getElementById("addSkillCatInput").value.trim();

      if (!trimmedName) {
        showModalError(errorBox, "Category name cannot be empty.");
        return;
      }

      const exists = state.skillCategories.some(
        c => c.toLowerCase() === trimmedName.toLowerCase()
      );

      if (exists) {
        showModalError(errorBox, "A skill category with this name already exists.");
        return;
      }

      state.skillCategories.push(trimmedName);

      saveData(state);

      closeModal();

      renderSkillCategoryList();

    });

}


function renameSkillCategory(oldName) {

  openModal(`
    <h3>Rename Skill Category</h3>
    <div id="renameSkillCatError" class="auth-error"></div>
    <div class="modal-field">
      <label>Name</label>
      <input type="text" id="renameSkillCatInput" value="${escapeHTML(oldName)}">
    </div>
    <div class="modal-actions">
      <button class="modal-save" id="renameSkillCatSave">Save</button>
      <button class="modal-cancel" id="renameSkillCatCancel">Cancel</button>
    </div>
  `);

  document.getElementById("renameSkillCatCancel")
    .addEventListener("click", closeModal);

  document.getElementById("renameSkillCatSave")
    .addEventListener("click", () => {

      const errorBox = document.getElementById("renameSkillCatError");
      const trimmedNewName = document.getElementById("renameSkillCatInput").value.trim();

      if (!trimmedNewName) {
        showModalError(errorBox, "Category name cannot be empty.");
        return;
      }

      if (trimmedNewName === oldName) {
        closeModal();
        return;
      }

      const exists = state.skillCategories.some(
        c => c.toLowerCase() === trimmedNewName.toLowerCase()
      );

      if (exists) {
        showModalError(errorBox, "A skill category with this name already exists.");
        return;
      }

      const index = state.skillCategories.indexOf(oldName);

      if (index === -1) {
        closeModal();
        return;
      }

      state.skillCategories[index] = trimmedNewName;

      state.skills.forEach(skill => {

        if (skill.category === oldName) {
          skill.category = trimmedNewName;
        }

      });

      saveData(state);

      closeModal();

      renderSkillCategoryList();

    });

}


function deleteSkillCategory(name) {

  if (state.skillCategories.length <= 1) {

    openModal(`
      <h3>Cannot Delete</h3>
      <p>At least one skill category must remain.</p>
      <div class="modal-actions">
        <button class="modal-cancel" id="closeCantDelete">Close</button>
      </div>
    `);

    document.getElementById("closeCantDelete")
      .addEventListener("click", closeModal);

    return;

  }

  const skillsUsingIt =
    state.skills.filter(skill => skill.category === name).length;

  const warning =
    skillsUsingIt > 0
      ? ` ${skillsUsingIt} existing skill(s) use this category and will need to be re-categorized manually afterward.`
      : "";

  confirmDelete({

    title: "Delete Skill Category",

    message: `Delete "${name}"?${warning}`,

    confirmText: name,

    onConfirm: () => {

      state.skillCategories =
        state.skillCategories.filter(c => c !== name);

      saveData(state);

      renderSkillCategoryList();

    }

  });

}


/* =========================================================
   DATA
   ========================================================= */

function exportData() {

  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `career-os-backup-${new Date().toISOString().split("T")[0]}.json`;
  link.click();

  URL.revokeObjectURL(url);

}


function importData() {

  openModal(`
    <h3>Import Data</h3>
    <p>Importing will completely replace your current data with the contents of the file you select. This cannot be undone.</p>
    <div class="modal-actions">
      <button class="modal-danger" id="importConfirmSave">Choose File</button>
      <button class="modal-cancel" id="importConfirmCancel">Cancel</button>
    </div>
  `);

  document.getElementById("importConfirmCancel")
    .addEventListener("click", closeModal);

  document.getElementById("importConfirmSave")
    .addEventListener("click", () => {

      closeModal();

      document.getElementById("importFileInput").click();

    });

}


function handleImportFile(event) {

  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = async () => {

    let parsed;

    try {
      parsed = JSON.parse(reader.result);
    } catch (error) {

      openModal(`
        <h3>Invalid File</h3>
        <p>This file is not valid Career OS data.</p>
        <div class="modal-actions">
          <button class="modal-cancel" id="closeInvalidFile">Close</button>
        </div>
      `);

      document.getElementById("closeInvalidFile")
        .addEventListener("click", closeModal);

      return;

    }

    await saveData(parsed);

    location.reload();

  };

  reader.readAsText(file);

  event.target.value = "";

}


async function resetData() {

  confirmSimple({

    title: "Reset All Data",

    message: "This will permanently delete ALL Career OS data — projects, skills, career goals, sessions, everything. This cannot be undone.",

    onConfirm: async () => {

      await resetAllData();

      await clearMyRanking().catch(error =>
        console.error("Ranking clear error:", error)
      );

      location.reload();

    }

  });

}


/* =========================================================
   EVENTS
   ========================================================= */

function attachSettingsEvents() {

  document.getElementById("deleteAccountBtn")
    .addEventListener("click", showDeleteAccountConfirm);

  document.getElementById("editWeeklyTarget")
    .addEventListener("click", editWeeklyTarget);

  document.getElementById("editDistractionLimit")
    .addEventListener("click", editDistractionLimit);

  document.getElementById("saveWeekStart")
    .addEventListener("click", saveWeekStart);

  document.getElementById("addCategoryBtn")
    .addEventListener("click", addCategory);

  const list = document.getElementById("categoryList");

  if (list) list.onclick = handleCategoryListClick;

  document.getElementById("addSkillCategoryBtn")
    .addEventListener("click", addSkillCategory);

  const skillCategoryList = document.getElementById("skillCategoryList");

  if (skillCategoryList) skillCategoryList.onclick = handleSkillCategoryListClick;

  document.getElementById("exportDataBtn")
    .addEventListener("click", exportData);

  document.getElementById("importDataBtn")
    .addEventListener("click", importData);

  document.getElementById("importFileInput")
    .addEventListener("change", handleImportFile);

  document.getElementById("resetDataBtn")
    .addEventListener("click", resetData);

  document.getElementById("manageDeleteProjectsBtn")
    .addEventListener("click", showArchivedProjectsModal);

}


/* =========================================================
   DELETE PROJECT (archived only, re-authenticated)
   ========================================================= */

function showArchivedProjectsModal() {

  const archived =
    state.projects.filter(p => p.archived);

  if (archived.length === 0) {

    openModal(`
      <h3>No Archived Projects</h3>
      <p>Only archived projects can be permanently deleted. Archive a project first in Project Lab.</p>
      <div class="modal-actions"><button class="modal-cancel" id="closeNoArchived">Close</button></div>
    `);

    document.getElementById("closeNoArchived")
      .addEventListener("click", closeModal);

    return;

  }

  openModal(`
    <h3>Archived Projects</h3>
    <ul class="milestone-list">
      ${
        archived.map(project => `
          <li class="milestone">
            <span><strong>${escapeHTML(project.name)}</strong></span>
            <div class="project-actions inline-actions">
              <button class="delete-project-permanently" data-project="${project.id}">Delete Permanently</button>
            </div>
          </li>
        `).join("")
      }
    </ul>
    <div class="modal-actions">
      <button class="modal-cancel" id="closeArchivedList">Close</button>
    </div>
  `);

  document.getElementById("closeArchivedList")
    .addEventListener("click", closeModal);

  document.querySelectorAll(".delete-project-permanently").forEach(button => {

    button.addEventListener("click", () => {

      const project =
        state.projects.find(p => p.id === button.dataset.project);

      if (project) startProjectDeleteReauth(project);

    });

  });

}


function startProjectDeleteReauth(project) {

  const user = auth.currentUser;

  if (!user) return;

  const passwordAccount = isPasswordAccount(user);

  openModal(`
    <h3>Verify Your Identity</h3>
    <p>Permanently deleting "${escapeHTML(project.name)}" requires re-verifying your identity. This cannot be undone.</p>
    <div id="projDeleteError" class="auth-error"></div>
    ${
      passwordAccount
        ? `
          <div class="modal-field">
            <label>Confirm your password</label>
            <div class="password-field">
              <input type="password" id="projDeletePassword">
              <button type="button" class="toggle-password" data-target="projDeletePassword">👁</button>
            </div>
          </div>
        `
        : `<button id="projDeleteReauthProvider">Re-authenticate to Continue</button>`
    }
    <div class="modal-field">
      <label>Type the project name to confirm</label>
      <input type="text" id="projDeleteNameInput" placeholder="${escapeHTML(project.name)}">
    </div>
    <div class="modal-actions">
      <button class="modal-danger" id="projDeleteConfirm">Permanently Delete</button>
      <button class="modal-cancel" id="projDeleteCancel">Cancel</button>
    </div>
  `);

  let reauthed = !passwordAccount ? false : true;

  document.getElementById("projDeleteCancel")
    .addEventListener("click", closeModal);

  if (!passwordAccount) {

    document.getElementById("projDeleteReauthProvider")
      .addEventListener("click", async () => {

        const errorBox = document.getElementById("projDeleteError");

        try {

          const providerId = user.providerData[0]?.providerId;

          if (providerId === "google.com") {
            await reauthenticateWithGoogle(user);
          } else if (providerId === "github.com") {
            await reauthenticateWithGithub(user);
          } else {
            throw new Error("unsupported-provider");
          }

          reauthed = true;

          errorBox.textContent = "Identity confirmed. You can continue below.";

        } catch (error) {

          console.error("Reauth error:", error);

          errorBox.textContent = "Re-authentication failed. Try again.";

        }

      });

  }

  document.getElementById("projDeleteConfirm")
    .addEventListener("click", async () => {

      const errorBox = document.getElementById("projDeleteError");

      const nameInput =
        document.getElementById("projDeleteNameInput").value.trim();

      if (nameInput !== project.name) {
        showModalError(errorBox, "Project name does not match.");
        return;
      }

      try {

        if (passwordAccount) {

          const passwordInput =
            document.getElementById("projDeletePassword").value;

          await reauthenticateWithPassword(user, passwordInput);

        } else if (!reauthed) {

          showModalError(errorBox, "Please re-authenticate first.");
          return;

        }

        state.projects =
          state.projects.filter(p => p.id !== project.id);

        saveData(state);

        closeModal();

      } catch (error) {

        console.error("Project delete error:", error);

        showModalError(errorBox, "Could not verify your identity. Check your password and try again.");

      }

    });

}


function handleCategoryListClick(event) {

  const button = event.target.closest("button");

  if (!button) return;

  const category = state.categories.find(
    existing => existing.id === button.dataset.category
  );

  if (!category) return;

  if (button.classList.contains("edit-category")) {
    editCategory(category);
    return;
  }

  if (button.classList.contains("delete-category")) {
    deleteCategory(category);
    return;
  }

}


/* =========================================================
   ACCOUNT DELETION (unchanged — already its own full page)
   ========================================================= */

function showDeleteAccountConfirm() {

  const app = document.getElementById("app");
  const user = auth.currentUser;

  if (!user) return;

  const passwordAccount = isPasswordAccount(user);

  app.innerHTML = `
    <section>
      <h2>Delete Account</h2>
      <div class="card">
        <p>This will schedule your account for permanent deletion in 30 days. You can restore it any time before then by logging back in.</p>
        <div id="deleteAccountError" class="auth-error"></div>
        ${
          passwordAccount
            ? `
              <label>Confirm your password</label>
              <div class="password-field">
                <input type="password" id="deleteConfirmPassword" placeholder="••••••••">
                <button type="button" class="toggle-password" data-target="deleteConfirmPassword">👁</button>
              </div>
              <p class="auth-switch"><a href="#" id="deleteForgotPassword">Forgot password?</a></p>
            `
            : `
              <p>Click below to confirm your identity via the account you signed up with.</p>
              <button id="deleteReauthProvider">Re-authenticate to Continue</button>
            `
        }
        <label>Type your username to confirm</label>
        <input type="text" id="deleteConfirmUsername" placeholder="Your username">
        <br><br>
        <button id="deleteAccountConfirm">Permanently Schedule Deletion</button>
        <button id="deleteAccountCancel">Cancel</button>
      </div>
    </section>
  `;

  let reauthed = !passwordAccount ? false : true;

  document.getElementById("deleteAccountCancel")
    .addEventListener("click", () => renderSettings(app));

  const deleteForgotLink = document.getElementById("deleteForgotPassword");

  if (deleteForgotLink) {

    deleteForgotLink.addEventListener("click", async event => {

      event.preventDefault();

      const errorBox = document.getElementById("deleteAccountError");

      try {
        await resetPassword(user.email);
        errorBox.textContent = "Password reset email sent — check your inbox, then come back here to continue.";
      } catch (error) {
        console.error("Password reset error:", error);
        errorBox.textContent = "Something went wrong. Try again.";
      }

    });

  }

  if (!passwordAccount) {

    document.getElementById("deleteReauthProvider")
      .addEventListener("click", async () => {

        const errorBox = document.getElementById("deleteAccountError");

        try {

          const providerId = user.providerData[0]?.providerId;

          if (providerId === "google.com") {
            await reauthenticateWithGoogle(user);
          } else if (providerId === "github.com") {
            await reauthenticateWithGithub(user);
          } else {
            throw new Error("unsupported-provider");
          }

          reauthed = true;

          errorBox.textContent = "Identity confirmed. You can continue below.";

        } catch (error) {

          console.error("Reauth error:", error);

          errorBox.textContent = "Re-authentication failed. Try again.";

        }

      });

  }

  document.getElementById("deleteAccountConfirm")
    .addEventListener("click", async () => {

      const errorBox = document.getElementById("deleteAccountError");
      const usernameInput = document.getElementById("deleteConfirmUsername");

      errorBox.textContent = "";

      const profile = await getUserProfile(user.uid);

      if (usernameInput.value.trim() !== (profile?.username || "")) {
        errorBox.textContent = "Username does not match.";
        return;
      }

      try {

        if (passwordAccount) {

          const passwordInput = document.getElementById("deleteConfirmPassword");

          await reauthenticateWithPassword(user, passwordInput.value);

        } else if (!reauthed) {

          errorBox.textContent = "Please re-authenticate first.";
          return;

        }

        await clearMyRanking().catch(error =>
          console.error("Ranking clear error:", error)
        );

        await requestAccountDeletion(user.uid);

        await logOutUser();

      } catch (error) {

        console.error("Delete account error:", error);

        errorBox.textContent = "Could not verify your identity. Check your password and try again.";

      }

    });

}


/* =========================================================
   GOALS
   ========================================================= */

function editWeeklyTarget() {

  openModal(`
    <h3>Weekly Focus Target</h3>
    <div id="editTargetError" class="auth-error"></div>
    <div class="modal-field">
      <label>Hours per week</label>
      <input type="text" id="editTargetInput" value="${state.settings.weeklyTarget}">
    </div>
    <div class="modal-actions">
      <button class="modal-save" id="editTargetSave">Save</button>
      <button class="modal-cancel" id="editTargetCancel">Cancel</button>
    </div>
  `);

  document.getElementById("editTargetCancel")
    .addEventListener("click", closeModal);

  document.getElementById("editTargetSave")
    .addEventListener("click", () => {

      const errorBox = document.getElementById("editTargetError");
      const parsed = Number(document.getElementById("editTargetInput").value.trim());

      if (!Number.isFinite(parsed) || parsed <= 0) {
        showModalError(errorBox, "Enter a positive number of hours.");
        return;
      }

      state.settings.weeklyTarget = parsed;

      saveData(state);

      closeModal();

      renderSettings(document.getElementById("app"));

    });

}


function editDistractionLimit() {

  openModal(`
    <h3>Weekly Distraction Limit</h3>
    <div id="editLimitError" class="auth-error"></div>
    <div class="modal-field">
      <label>Hours per week</label>
      <input type="text" id="editLimitInput" value="${state.settings.distractionLimit}">
    </div>
    <div class="modal-actions">
      <button class="modal-save" id="editLimitSave">Save</button>
      <button class="modal-cancel" id="editLimitCancel">Cancel</button>
    </div>
  `);

  document.getElementById("editLimitCancel")
    .addEventListener("click", closeModal);

  document.getElementById("editLimitSave")
    .addEventListener("click", () => {

      const errorBox = document.getElementById("editLimitError");
      const parsed = Number(document.getElementById("editLimitInput").value.trim());

      if (!Number.isFinite(parsed) || parsed < 0) {
        showModalError(errorBox, "Enter a non-negative number of hours.");
        return;
      }

      state.settings.distractionLimit = parsed;

      saveData(state);

      closeModal();

      renderSettings(document.getElementById("app"));

    });

}


function saveWeekStart() {

  state.settings.weekStart =
    document.getElementById("weekStartSelect").value;

  saveData(state);

  renderSettings(document.getElementById("app"));

}


/* =========================================================
   CATEGORY MANAGEMENT
   ========================================================= */

function addCategory() {

  openCategoryGroupModal(null, (trimmedName, group) => {

    const exists = state.categories.some(
      c => c.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) return "A category with this name already exists.";

    state.categories.push({
      id: crypto.randomUUID(),
      name: trimmedName,
      group,
      builtIn: false
    });

    saveData(state);

    renderCategoryList();

    return null;

  });

}


function editCategory(category) {

  openCategoryGroupModal(category, (trimmedName, group) => {

    const exists = state.categories.some(
      existing => existing.id !== category.id &&
        existing.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) return "A category with this name already exists.";

    const oldName = category.name;

    category.name = trimmedName;
    category.group = group;

    state.sessions.forEach(session => {

      if (session.category === oldName) {
        session.category = trimmedName;
      }

    });

    saveData(state);

    renderCategoryList();

    return null;

  }, true);

}


function openCategoryGroupModal(category, onSave, nameEditable = true) {

  const groupOptions =
    GROUPS.map(g => `
      <option value="${g}" ${category && category.group === g ? "selected" : (!category && g === "Focus" ? "selected" : "")}>${g}</option>
    `).join("");

  openModal(`
    <h3>${category ? "Edit Category" : "Add Category"}</h3>
    <div id="catModalError" class="auth-error"></div>
    <div class="modal-field">
      <label>Name</label>
      <input type="text" id="catModalName" value="${category ? escapeHTML(category.name) : ""}">
    </div>
    <div class="modal-field">
      <label>Group</label>
      <select id="catModalGroup">${groupOptions}</select>
      <p style="font-size:.8rem;opacity:.7;margin-top:4px;">
        Focus = counted toward your weekly goal<br>
        Distraction = counted toward your distraction limit<br>
        Neutral = tracked, but not counted toward either
      </p>
    </div>
    <div class="modal-actions">
      <button class="modal-save" id="catModalSave">Save</button>
      <button class="modal-cancel" id="catModalCancel">Cancel</button>
    </div>
  `);

  document.getElementById("catModalCancel")
    .addEventListener("click", closeModal);

  document.getElementById("catModalSave")
    .addEventListener("click", () => {

      const errorBox = document.getElementById("catModalError");
      const trimmedName = document.getElementById("catModalName").value.trim();
      const group = document.getElementById("catModalGroup").value;

      if (!trimmedName) {
        showModalError(errorBox, "Category name cannot be empty.");
        return;
      }

      const error = onSave(trimmedName, group);

      if (error) {
        showModalError(errorBox, error);
        return;
      }

      closeModal();

    });

}



function deleteCategory(category) {

  if (category.builtIn) return;

  const sessionsUsingIt =
    state.sessions.filter(session => session.category === category.name).length;

  const warning =
    sessionsUsingIt > 0
      ? ` ${sessionsUsingIt} existing session(s) use this category — they'll remain in your data but will no longer be counted in Focus/Distraction/Neutral stats.`
      : "";

  confirmDelete({

    title: "Delete Category",

    message: `Delete "${category.name}"?${warning}`,

    confirmText: category.name,

    onConfirm: () => {

      state.categories =
        state.categories.filter(existing => existing.id !== category.id);

      saveData(state);

      renderCategoryList();

    }

  });

}


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}
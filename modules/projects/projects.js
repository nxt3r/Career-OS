import { state } from "../../core/state.js";
import { saveData } from "../../core/storage.js";
import { openModal, closeModal, showModalError, confirmDelete, confirmSimple } from "../../core/modal.js";
import { replayFadeIn } from "../../core/utils.js";
import { renderLinkChip, attachLinkChipEvents } from "../../core/linkChip.js";

let openedProject = null;
let projectFilter = "All";
let activeProjectTab = {};


/*
 * PROJECT LAB
 */

export function renderProjects(app, targetId) {

  if (targetId) {

    openedProject = targetId;

  }

  /*
   * DEVELOPMENT MIGRATION
   *
   * Projects created before the archived lifecycle
   * existed may have status === "Archived".
   *
   * Convert those safely.
   */

  state.projects.forEach(project => {

    if (typeof project.archived !== "boolean") {

      project.archived =
        project.status === "Archived";

    }

    /*
     * Archived is no longer a normal status.
     * Give old archived projects a sensible
     * workflow status while keeping them archived.
     */

    if (
      project.archived &&
      project.status === "Archived"
    ) {

      project.status = "Planning";

    }

  });

  saveData(state);


  app.innerHTML = `
    <section>

      <h2>Project Lab</h2>


      <!-- PROJECT FILTERS -->

      <div class="project-filters">

        <button
          id="addProjectBtn"
        >
          + New Project
        </button>


        <button
          class="project-filter ${
            projectFilter === "All"
              ? "active"
              : ""
          }"
          data-filter="All"
        >
          All
        </button>


        <button
          class="project-filter ${
            projectFilter === "Active"
              ? "active"
              : ""
          }"
          data-filter="Active"
        >
          Active
        </button>


        <button
          class="project-filter ${
            projectFilter === "Planning"
              ? "active"
              : ""
          }"
          data-filter="Planning"
        >
          Planning
        </button>


        <button
          class="project-filter ${
            projectFilter === "Paused"
              ? "active"
              : ""
          }"
          data-filter="Paused"
        >
          Paused
        </button>


        <button
          class="project-filter ${
            projectFilter === "Completed"
              ? "active"
              : ""
          }"
          data-filter="Completed"
        >
          Completed
        </button>


        <button
          class="project-filter ${
            projectFilter === "Archived"
              ? "active"
              : ""
          }"
          data-filter="Archived"
        >
          Archived
        </button>

      </div>


      <div id="projectList"></div>

    </section>
  `;


    renderList();

  attachProjectFilters();

}


/*
 * RENDER PROJECT LIST
 */

function renderList() {

  const container =
    document.getElementById("projectList");

  if (!container) return;


  /*
   * FILTER PROJECTS
   */

  const visibleProjects =
    projectFilter === "Archived"

      ? state.projects.filter(
          project =>
            project.archived === true
        )

      : projectFilter === "All"

        ? state.projects.filter(
            project =>
              project.archived !== true
          )

        : state.projects.filter(
            project =>
              project.archived !== true &&
              project.status === projectFilter
          );


  /*
   * EMPTY STATE
   */

  if (visibleProjects.length === 0) {

    container.innerHTML = `
      <div class="empty-state">
        <p>No projects yet.</p>
      </div>
    `;

    /*
     * IMPORTANT:
     * The empty state used to return before
     * the New Project button event was attached.
     */

    attachProjectManagementEvents();

    return;
  }


  /*
   * RENDER PROJECTS
   */

  container.innerHTML =
    visibleProjects
      .map(project => {

        const milestones =
          project.milestones || [];

        const completedMilestones =
          milestones.filter(
            milestone => milestone.done
          ).length;

        const progress =
          milestones.length === 0
            ? 0
            : Math.round(
                (completedMilestones /
                  milestones.length) *
                  100
              );

        return `
          <div
            class="project-card ${
              openedProject === project.id
                ? "open"
                : ""
            }"
          >

            <div
              class="project-header"
              data-id="${project.id}"
            >

              <div>
                <h3>
                  ${escapeHTML(project.name)}
                </h3>

                <span class="status ${project.archived ? "archived" : project.status.toLowerCase()}">
                  ${project.archived ? "Archived" : escapeHTML(project.status)}
                </span>
              </div>

              <span>
                ${progress}%
              </span>

            </div>


            ${
              openedProject === project.id
                ? `

                  <div class="project-body">

                    <div class="project-tabs">

                      <button
                        class="tab-btn ${
                          (activeProjectTab[project.id] || "overview") ===
                          "overview"
                            ? "active"
                            : ""
                        }"
                        data-project="${project.id}"
                        data-tab="overview"
                      >
                        Overview
                      </button>

                      <button
                        class="tab-btn ${
                          activeProjectTab[project.id] === "tasks"
                            ? "active"
                            : ""
                        }"
                        data-project="${project.id}"
                        data-tab="tasks"
                      >
                        Tasks
                      </button>

                      <button
                        class="tab-btn ${
                          activeProjectTab[project.id] === "inbox"
                            ? "active"
                            : ""
                        }"
                        data-project="${project.id}"
                        data-tab="inbox"
                      >
                        Inbox
                      </button>

                      <button
                        class="tab-btn ${
                          activeProjectTab[project.id] === "milestones"
                            ? "active"
                            : ""
                        }"
                        data-project="${project.id}"
                        data-tab="milestones"
                      >
                        Milestones
                      </button>

                    </div>


                    ${renderProjectTab(project, progress)}


                    <hr>


                    <!-- PROJECT MANAGEMENT -->

                    ${
                      project.archived

                        ? `

                          <div
                            class="
                              project-status-control
                              archived-status
                            "
                          >

                            <strong>
                              Status:
                            </strong>

                            <span class="status archived">
                              Archived
                            </span>

                          </div>


                          <div
                            class="project-actions"
                          >

                            <button
                              class="restore-project"
                              data-project="${project.id}"
                            >
                              Restore Project
                            </button>

                          </div>

                        `

                        : `

                          <div
                            class="project-status-control"
                          >

                            <label
                              for="status-${project.id}"
                            >
                              Project Status
                            </label>


                            <select
                              id="status-${project.id}"
                              class="project-status status-select status-${project.status.toLowerCase()}"
                              data-project="${project.id}"
                            >

                              <option
                                value="Planning"
                                ${
                                  project.status ===
                                  "Planning"
                                    ? "selected"
                                    : ""
                                }
                              >
                                Planning
                              </option>


                              <option
                                value="Active"
                                ${
                                  project.status ===
                                  "Active"
                                    ? "selected"
                                    : ""
                                }
                              >
                                Active
                              </option>


                              <option
                                value="Paused"
                                ${
                                  project.status ===
                                  "Paused"
                                    ? "selected"
                                    : ""
                                }
                              >
                                Paused
                              </option>


                              <option
                                value="Completed"
                                ${
                                  project.status ===
                                  "Completed"
                                    ? "selected"
                                    : ""
                                }
                              >
                                Completed
                              </option>

                            </select>

                          </div>


                          <div
                            class="project-actions"
                          >

                            <button
                              class="edit-project"
                              data-project="${project.id}"
                            >
                              Rename Project
                            </button>


                            <button
                              class="archive-project"
                              data-project="${project.id}"
                            >
                              Archive Project
                            </button>

                          </div>

                        `
                    }

                  </div>
                `
                : ""
            }

          </div>
        `;

      })
      .join("");


  replayFadeIn(container);

  attachLinkChipEvents(container);


  document
    .querySelectorAll(".project-header")
    .forEach(header => {

      header.addEventListener(
        "click",
        () => {

          const id =
            header.dataset.id;

          openedProject =
            openedProject === id
              ? null
              : id;

          renderList();

        }
      );

    });


  /*
   * EVENT HANDLERS
   */

  attachMilestoneEvents();

  attachTaskEvents();

  attachStatusEvents();

  attachMilestoneManagementEvents();

  attachProjectTabEvents();

  attachProjectManagementEvents();

}


function renderProjectTab(project, progress) {

  const tab =
    activeProjectTab[project.id] || "overview";


  if (tab === "tasks") {

    const tasks =
      project.tasks || [];

    return `
      <div class="project-tab-panel">

        <div class="project-actions">
          <button class="add-task" data-project="${project.id}">
            + Add Task
          </button>
        </div>

        ${
          tasks.length === 0
            ? `<p>No tasks yet.</p>`
            : `
              <ul class="milestone-list">
                ${
                  tasks.map(task => `
                    <li class="milestone">
                      <label>
                        <input
                          type="checkbox"
                          data-project="${project.id}"
                          data-task="${task.id}"
                          ${task.done ? "checked" : ""}
                        >
                        <span class="${task.done ? "task-done-text" : ""}">${escapeHTML(task.text)}</span>
                      </label>
                      <div class="project-actions inline-actions">
                        <button class="delete-task" data-project="${project.id}" data-task="${task.id}">Delete</button>
                      </div>
                    </li>
                  `).join("")
                }
              </ul>
            `
        }

      </div>
    `;

  }


  if (tab === "inbox") {

  const projectCaptures =
    (state.captures || [])
      .filter(
        capture =>
          capture.projectId === project.id
      );

  return `
    <div class="project-tab-panel">

      ${
        projectCaptures.length === 0

          ? `
            <p>
              Inbox is empty.
            </p>
          `

          : `
            <div class="project-inbox">

              ${projectCaptures
                .map(capture => `
                  <div class="capture">

                    <strong>
                      ${escapeHTML(capture.text)}
                    </strong>

                    <small>
                      ${new Date(
                        capture.createdAt
                      ).toLocaleString()}
                    </small>

                  </div>
                `)
                .join("")}

            </div>
          `
      }

    </div>
  `;

}


  if (tab === "milestones") {

    return `
      <div class="project-tab-panel">
        <div class="project-actions">
          <button
            class="add-milestone"
            data-project="${project.id}"
          >
            + Add Milestone
          </button>
        </div>

        ${project.milestones.length === 0
          ? `
            <p>
              No milestones yet.
            </p>
          `
          : `
            <ul class="milestone-list">
              ${project.milestones
                .map(milestone => `
                  <li class="milestone">
                    <label>
                      <input
                        type="checkbox"
                        data-project="${project.id}"
                        data-id="${milestone.id}"
                        ${milestone.done ? "checked" : ""}
                      >
                      <span>${milestone.title}</span>
                    </label>

                    <div class="project-actions inline-actions">
                      <button
                        class="edit-milestone"
                        data-project="${project.id}"
                        data-id="${milestone.id}"
                      >
                        Edit
                      </button>

                      <button
                        class="delete-milestone"
                        data-project="${project.id}"
                        data-id="${milestone.id}"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                `)
                .join("")}
            </ul>
          `}
      </div>
    `;

  }


  const relatedSkills =
  getRelatedSkills(project.id);

return `
  <div class="project-tab-panel">

    <p>
      ${project.description || "No description."}
    </p>


    <div class="project-overview-stats">

      <strong>
        ${project.milestones.length} milestones
      </strong>

      <br>

      <small>
        ${progress}% complete · ${getProjectHours(project.id).toFixed(1)}h logged
      </small>

    </div>


    <!-- RELATED SKILLS -->

    <div class="project-skills">

      <h4>
        Related Skills
      </h4>

      ${
        relatedSkills.length === 0

          ? `
            <p>
              No related skills yet.
            </p>
          `

          : `
            <ul class="skill-related-projects">

                  ${
                    relatedSkills
                      .map(skill => `
                        <li>
                          ${renderLinkChip("skill", skill.id, skill.name)}
                          <small>— ${getLevelName(skill.level)}</small>
                        </li>
                      `)
                      .join("")
                  }

            </ul>
          `
      }

    </div>

  </div>
`;

}


function attachProjectTabEvents() {

  document
    .querySelectorAll(".tab-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const projectId =
            button.dataset.project;

          const tab =
            button.dataset.tab;

          activeProjectTab[projectId] =
            tab;

          renderList();

        }
      );

    });

}


/*
 * PROJECT FILTERS
 */

function attachProjectFilters() {

  document
    .querySelectorAll(".project-filter")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          projectFilter =
            button.dataset.filter;

          openedProject = null;

          renderProjects(
            document.getElementById("app")
          );

        }
      );

    });

}


/*
 * PROJECT MANAGEMENT
 */

function attachProjectManagementEvents() {


  /*
   * NEW PROJECT
   */

  const addButton =
    document.getElementById(
      "addProjectBtn"
    );


  if (addButton) {

    addButton.addEventListener(
      "click",
      openAddProjectModal
    );

  }


  /*
   * RENAME PROJECT
   */

  document
    .querySelectorAll(".edit-project")
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          /*
           * Prevent the click from
           * affecting the project card.
           */

          event.stopPropagation();


          const project =
            state.projects.find(
              project =>
                project.id ===
                button.dataset.project
            );


          if (!project) return;


          /*
           * Archived projects are
           * always read-only.
           */

          if (project.archived) {

            return;

          }


          openModal(`

            <h3>Rename Project</h3>

            <div id="renameProjectError" class="auth-error"></div>

            <div class="modal-field">
              <label>Name</label>
              <input type="text" id="renameProjectInput" value="${project.name}">
            </div>

            <div class="modal-actions">
              <button class="modal-save" id="renameProjectSave">Save</button>
              <button class="modal-cancel" id="renameProjectCancel">Cancel</button>
            </div>

          `);

          document
            .getElementById("renameProjectCancel")
            .addEventListener("click", closeModal);

          document
            .getElementById("renameProjectSave")
            .addEventListener("click", () => {

              const errorBox =
                document.getElementById("renameProjectError");

              const trimmedNewName =
                document.getElementById("renameProjectInput").value.trim();

              if (!trimmedNewName) {

                showModalError(errorBox, "Project name cannot be empty.");

                return;

              }

              const nameExists =
                state.projects.some(
                  existingProject =>
                    existingProject.id !== project.id &&
                    existingProject.name.toLowerCase() ===
                    trimmedNewName.toLowerCase()
                );

              if (nameExists) {

                showModalError(errorBox, "A project with this name already exists.");

                return;

              }

              project.name = trimmedNewName;

              saveData(state);

              closeModal();

              renderProjects(
                document.getElementById("app")
              );

            });

        }
      );

    });


  /*
   * ARCHIVE PROJECT
   */

  document
    .querySelectorAll(".archive-project")
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();


          const project =
            state.projects.find(
              project =>
                project.id ===
                button.dataset.project
            );


          if (!project) return;


          if (project.archived) {

            return;

          }


          openModal(`

            <h3>Archive Project</h3>

            <p>
              Archive "${project.name}"? It will become
              read-only and its history will be preserved.
              You can restore it later.
            </p>

            <div class="modal-actions">
              <button class="modal-danger" id="archiveConfirmSave">Archive</button>
              <button class="modal-cancel" id="archiveConfirmCancel">Cancel</button>
            </div>

          `);

          document
            .getElementById("archiveConfirmCancel")
            .addEventListener("click", closeModal);

          document
            .getElementById("archiveConfirmSave")
            .addEventListener("click", () => {

              closeModal();

              project.archived = true;


              saveData(state);

              openedProject = null;

              projectFilter = "Archived";

              renderProjects(
                document.getElementById("app")
              );

            });

        }
      );

    });


  /*
   * RESTORE PROJECT
   */

  document
    .querySelectorAll(".restore-project")
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();


          const project =
            state.projects.find(
              project =>
                project.id ===
                button.dataset.project
            );


          if (!project) return;


          if (!project.archived) {

            return;

          }


          /*
           * Choose destination status.
           */

          openModal(`

            <h3>Restore Project</h3>

            <p>Restore "${project.name}" and choose its new status:</p>

            <div id="restoreProjectError" class="auth-error"></div>

            <div class="modal-field">
              <label>Status</label>
              <select id="restoreStatusSelect">
                <option value="" disabled selected>Select a status...</option>
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div class="modal-actions">
              <button class="modal-save" id="restoreProjectSave">Restore</button>
              <button class="modal-cancel" id="restoreProjectCancel">Cancel</button>
            </div>

          `);

          document
            .getElementById("restoreProjectCancel")
            .addEventListener("click", closeModal);

          document
            .getElementById("restoreProjectSave")
            .addEventListener("click", () => {

              const errorBox =
                document.getElementById("restoreProjectError");

              const formattedStatus =
                document.getElementById("restoreStatusSelect").value;

              if (!formattedStatus) {

                showModalError(errorBox, "Choose a status.");

                return;

              }

              project.archived = false;

              project.status = formattedStatus;

              saveData(state);

              closeModal();

              openedProject = null;

              projectFilter = formattedStatus;

              renderProjects(
                document.getElementById("app")
              );

            });

        }
      );

    });

}


/*
 * MILESTONE CHECKBOX EVENTS
 */

function openAddProjectModal() {

  openModal(`

    <h3>New Project</h3>

    <div id="addProjectError" class="auth-error"></div>

    <div class="modal-field">
      <label>Name</label>
      <input type="text" id="addProjectName" placeholder="e.g. Fixtional">
    </div>

    <div class="modal-field">
      <label>Description (optional)</label>
      <input type="text" id="addProjectDescription">
    </div>

    <div class="modal-actions">
      <button class="modal-save" id="addProjectSave">Create Project</button>
      <button class="modal-cancel" id="addProjectCancel">Cancel</button>
    </div>

  `);

  document
    .getElementById("addProjectCancel")
    .addEventListener("click", closeModal);

  document
    .getElementById("addProjectSave")
    .addEventListener("click", () => {

      const errorBox =
        document.getElementById("addProjectError");

      const name =
        document.getElementById("addProjectName").value.trim();

      if (!name) {

        showModalError(errorBox, "Project name cannot be empty.");

        return;

      }

      const nameExists =
        state.projects.some(
          project =>
            project.name.toLowerCase() === name.toLowerCase()
        );

      if (nameExists) {

        showModalError(errorBox, "A project with this name already exists.");

        return;

      }

      const description =
        document.getElementById("addProjectDescription").value.trim();

      state.projects.push({

        id: crypto.randomUUID(),
        name,
        description,
        status: "Planning",
        archived: false,
        milestones: []

      });

      saveData(state);

      closeModal();

      openedProject = null;

      renderProjects(
        document.getElementById("app")
      );

    });

}


function attachMilestoneEvents() {

  document
    .querySelectorAll(
      ".milestone input"
    )
    .forEach(box => {

      box.addEventListener(
        "change",
        () => {

          const project =
            state.projects.find(
              project =>
                project.id ===
                box.dataset.project
            );


          if (!project) return;


          /*
           * Archived projects are
           * read-only.
           */

          if (project.archived) {

            box.checked =
              box.defaultChecked;

            return;

          }


          const milestone =
            project.milestones.find(
              milestone =>
                milestone.id ===
                Number(
                  box.dataset.id
                )
            );


          if (!milestone) return;


                    milestone.done =
            box.checked;

           milestone.completedAt =
            box.checked
              ? Date.now()
              : null;


          saveData(state);


          renderList();

        }
      );

    });

}


/*
 * TASK EVENTS
 */

function attachTaskEvents() {

  document.querySelectorAll(".add-task").forEach(button => {

    button.addEventListener("click", () => {

      const project =
        state.projects.find(p => p.id === button.dataset.project);

      if (!project || project.archived) return;

      if (!Array.isArray(project.tasks)) project.tasks = [];

      openModal(`
        <h3>Add Task</h3>
        <div id="addTaskError" class="auth-error"></div>
        <div class="modal-field">
          <label>Task</label>
          <input type="text" id="addTaskInput">
        </div>
        <div class="modal-actions">
          <button class="modal-save" id="addTaskSave">Add</button>
          <button class="modal-cancel" id="addTaskCancel">Cancel</button>
        </div>
      `);

      document.getElementById("addTaskCancel").addEventListener("click", closeModal);

      document.getElementById("addTaskSave").addEventListener("click", () => {

        const errorBox = document.getElementById("addTaskError");
        const text = document.getElementById("addTaskInput").value.trim();

        if (!text) {
          showModalError(errorBox, "Task cannot be empty.");
          return;
        }

        project.tasks.push({ id: crypto.randomUUID(), text, done: false });

        saveData(state);

        closeModal();

        renderList();

      });

    });

  });

  document.querySelectorAll('.milestone input[data-task]').forEach(box => {

    box.addEventListener("change", () => {

      const project =
        state.projects.find(p => p.id === box.dataset.project);

      if (!project) return;

      const task =
        (project.tasks || []).find(t => t.id === box.dataset.task);

      if (!task) return;

      task.done = box.checked;

      saveData(state);

      renderList();

    });

  });

  document.querySelectorAll(".delete-task").forEach(button => {

    button.addEventListener("click", () => {

      const project =
        state.projects.find(p => p.id === button.dataset.project);

      if (!project) return;

      project.tasks =
        (project.tasks || []).filter(t => t.id !== button.dataset.task);

      saveData(state);

      renderList();

    });

  });

}


/*
 * PROJECT STATUS EVENTS
 */

function attachStatusEvents() {

  document
    .querySelectorAll(
      ".project-status"
    )
    .forEach(select => {

      select.addEventListener(
        "change",
        () => {

          const project =
            state.projects.find(
              project =>
                project.id ===
                select.dataset.project
            );


          if (!project) return;


          /*
           * Archived projects cannot
           * change status.
           */

          if (project.archived) {

            return;

          }


          project.status =
            select.value;


          saveData(state);


          renderList();

        }
      );

    });

}


/*
 * MILESTONE MANAGEMENT
 */

function attachMilestoneManagementEvents() {


  /*
   * ADD MILESTONE
   */

  document
    .querySelectorAll(
      ".add-milestone"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();


          const project =
            state.projects.find(
              project =>
                project.id ===
                button.dataset.project
            );


          if (!project) return;


          if (project.archived) {

            return;

          }


          openModal(`

            <h3>Add Milestone</h3>

            <div id="addMilestoneError" class="auth-error"></div>

            <div class="modal-field">
              <label>Milestone name</label>
              <input type="text" id="addMilestoneInput">
            </div>

            <div class="modal-actions">
              <button class="modal-save" id="addMilestoneSave">Add</button>
              <button class="modal-cancel" id="addMilestoneCancel">Cancel</button>
            </div>

          `);

          document
            .getElementById("addMilestoneCancel")
            .addEventListener("click", closeModal);

          document
            .getElementById("addMilestoneSave")
            .addEventListener("click", () => {

              const errorBox =
                document.getElementById("addMilestoneError");

              const trimmedTitle =
                document.getElementById("addMilestoneInput").value.trim();

              if (!trimmedTitle) {

                showModalError(errorBox, "Milestone name cannot be empty.");

                return;

              }

              const titleExists =
                project.milestones.some(
                  milestone =>
                    milestone.title.toLowerCase() ===
                    trimmedTitle.toLowerCase()
                );

              if (titleExists) {

                showModalError(errorBox, "A milestone with this name already exists.");

                return;

              }

              const nextId =
                project.milestones.length > 0
                  ? Math.max(...project.milestones.map(m => m.id)) + 1
                  : 1;

              project.milestones.push({
                id: nextId,
                title: trimmedTitle,
                done: false
              });

              saveData(state);

              closeModal();

              renderList();

            });

        }
      );

    });


  /*
   * EDIT MILESTONE
   */

  document
    .querySelectorAll(
      ".edit-milestone"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();


          const project =
            state.projects.find(
              project =>
                project.id ===
                button.dataset.project
            );


          if (!project) return;


          if (project.archived) {

            return;

          }


          const milestone =
            project.milestones.find(
              milestone =>
                milestone.id ===
                Number(
                  button.dataset.id
                )
            );


          if (!milestone) return;


          openModal(`

            <h3>Rename Milestone</h3>

            <div id="editMilestoneError" class="auth-error"></div>

            <div class="modal-field">
              <label>Milestone name</label>
              <input type="text" id="editMilestoneInput" value="${milestone.title}">
            </div>

            <div class="modal-actions">
              <button class="modal-save" id="editMilestoneSave">Save</button>
              <button class="modal-cancel" id="editMilestoneCancel">Cancel</button>
            </div>

          `);

          document
            .getElementById("editMilestoneCancel")
            .addEventListener("click", closeModal);

          document
            .getElementById("editMilestoneSave")
            .addEventListener("click", () => {

              const errorBox =
                document.getElementById("editMilestoneError");

              const trimmedNewTitle =
                document.getElementById("editMilestoneInput").value.trim();

              if (!trimmedNewTitle) {

                showModalError(errorBox, "Milestone name cannot be empty.");

                return;

              }

              const titleExists =
                project.milestones.some(
                  existingMilestone =>
                    existingMilestone.id !== milestone.id &&
                    existingMilestone.title.toLowerCase() ===
                    trimmedNewTitle.toLowerCase()
                );

              if (titleExists) {

                showModalError(errorBox, "A milestone with this name already exists.");

                return;

              }

              milestone.title = trimmedNewTitle;

              saveData(state);

              closeModal();

              renderList();

            });

        }
      );

    });


  /*
   * DELETE MILESTONE
   */

  document
    .querySelectorAll(
      ".delete-milestone"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();


          const project =
            state.projects.find(
              project =>
                project.id ===
                button.dataset.project
            );


          if (!project) return;


          if (project.archived) {

            return;

          }


          const milestoneId =
            Number(
              button.dataset.id
            );


          const milestone =
            project.milestones.find(
              milestone =>
                milestone.id ===
                milestoneId
            );


          if (!milestone) return;


confirmSimple({
  title: "Delete Milestone",
  message: `Delete "${milestone.title}"?`,
  onConfirm: () => {

              project.milestones =
                project.milestones.filter(
                  m => m.id !== milestoneId
                );

              saveData(state);

              renderList();

            }

          });

        }
      );

    });

}


/*
 * PROJECT HOURS
 */

function getProjectHours(projectId) {

  const project =
    state.projects.find(
      project =>
        project.id === projectId
    );


  if (!project) return 0;


  const total =
    state.sessions

      .filter(
        session =>
          session.projectId ===
          project.id
      )

      .reduce(
        (sum, session) =>
          sum + session.duration,
        0
      );


  return total / 3600000;

}


/*
 * MILESTONE PROGRESS
 */

export function getProgress(project) {

  const total =
    project.milestones.length;


  const completed =
    project.milestones.filter(
      milestone =>
        milestone.done
    ).length;


  if (total === 0) {

    return 0;

  }


  return Math.round(
    (completed / total) * 100
  );

}

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent =
    text;

  return div.innerHTML;

}

/*
 * RELATED SKILLS
 *
 * Derived from:
 * 1. Explicit skill → project relationships
 * 2. Time OS sessions linked to this project + skill
 *
 * No duplicate relationship data is stored on projects.
 */

function getRelatedSkills(projectId) {

  const skillIds = new Set();


  /*
   * EXPLICIT SKILL RELATIONSHIPS
   */

  state.skills.forEach(skill => {

    if (
      skill.relatedProjects &&
      skill.relatedProjects.includes(projectId)
    ) {

      skillIds.add(skill.id);

    }

  });


  /*
   * TIME OS RELATIONSHIPS
   */

  state.sessions.forEach(session => {

    if (
      session.projectId === projectId &&
      session.skillId
    ) {

      skillIds.add(session.skillId);

    }

  });


  /*
   * RESOLVE SKILL OBJECTS
   */

  return state.skills.filter(
    skill =>
      skillIds.has(skill.id)
  );

}

function getLevelName(level) {

  const levels = [
    "Beginner",
    "Elementary",
    "Intermediate",
    "Advanced",
    "Expert"
  ];

  return (
    levels[level - 1] ||
    "Unknown"
  );

}
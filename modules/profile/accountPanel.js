import {
  changeUsername,
  updateDisplayName,
  updateAvatar,
  isValidUsernameFormat
} from "../../core/username.js";

import {
  isPasswordAccount
} from "../../core/auth.js";

import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  AVATAR_SETS,
  AVATAR_SET_NAMES,
  AVATAR_COLOR_SETS,
  AVATAR_EMOJIS,
  AVATAR_COLORS,
  getAvatarDisplay
} from "./avatars.js";


// ============================================
// ACCOUNT PANEL
// ============================================

export async function renderAccountPanel(
  app,
  user,
  profile
) {

  if (!app) return;


  // ==========================================
  // CURRENT AVATAR
  // ==========================================

  const avatar =
    getAvatarDisplay(profile);


  const passwordAccount =
    isPasswordAccount(user);


  // ==========================================
  // RENDER ACCOUNT PAGE
  // ==========================================

  app.innerHTML = `

    <section>

      <h2>Account Settings</h2>


      <!-- =====================================
           AVATAR CARD
      ====================================== -->

      <div class="card">

        <h3>Avatar</h3>


        <!-- Avatar preview -->

        <div
          class="avatar-preview"
          id="avatarPreview"
          style="
            display:flex;
            justify-content:center;
            align-items:center;
            margin:8px 0 14px;
          "
        >

          ${
            avatar.type === "image"

              ? `
                <img
                  src="${escapeHTML(avatar.url)}"
                  class="profile-avatar-img large"
                >
              `

              : `
                <span
                  class="profile-avatar-emoji large"
                  style="background:${avatar.color}"
                >${avatar.emoji}</span>
              `
          }

        </div>


        <!-- ===================================
             AVATAR CATEGORY TABS
        ==================================== -->

        <div
          class="avatar-picker"
          id="avatarPicker"
          style="
            display:flex;
            flex-direction:column;
            gap:10px;
          "
        >

          <div
            class="avatar-category-tabs"
            id="avatarCategoryTabs"
            style="
              display:flex;
              gap:4px;
              padding:3px;
              background:rgba(255,255,255,0.035);
              border:1px solid rgba(255,255,255,0.06);
              border-radius:9px;
              width:fit-content;
              max-width:100%;
              overflow-x:auto;
            "
          >

            ${
              Object.entries(AVATAR_SETS)
                .map(
                  ([setKey], index) => `

                    <button
                      type="button"
                      class="avatar-category-tab ${
                        index === 0
                          ? "active"
                          : ""
                      }"
                      data-avatar-set="${setKey}"
                      style="
                        border:0;
                        border-radius:7px;
                        padding:6px 11px;
                        background:${
                          index === 0
                            ? "rgba(255,255,255,0.09)"
                            : "transparent"
                        };
                        color:inherit;
                        opacity:${
                          index === 0
                            ? "1"
                            : "0.55"
                        };
                        font-size:11px;
                        font-weight:600;
                        cursor:pointer;
                        white-space:nowrap;
                        transition:
                          background 0.15s ease,
                          opacity 0.15s ease;
                      "
                    >
                      ${AVATAR_SET_NAMES[setKey]}
                    </button>

                  `
                )
                .join("")
            }

          </div>


          <!-- Avatar options -->

          <div
            class="avatar-set-options"
            id="avatarSetOptions"
            style="
              display:flex;
              flex-wrap:wrap;
              gap:8px;
              min-height:44px;
            "
          ></div>

        </div>


        <!-- ===================================
             ACCENT COLOR
        ==================================== -->

        <label
          style="
            display:block;
            margin-top:16px;
          "
        >
          Accent
        </label>


        <div
          class="avatar-color-picker"
          id="avatarColorPicker"
          style="
            display:flex;
            align-items:center;
            flex-wrap:wrap;
            gap:7px;
            margin-top:7px;
          "
        >

          ${
            Object.entries(AVATAR_COLOR_SETS)
              .map(
                ([setKey, colors], groupIndex) => `

                  <div
                    class="avatar-color-group"
                    data-color-group="${setKey}"
                    style="
                      display:flex;
                      align-items:center;
                      gap:7px;

                      ${
                        groupIndex > 0
                          ? `
                            padding-left:9px;
                            border-left:
                              1px solid
                              rgba(255,255,255,0.08);
                          `
                          : ""
                      }
                    "
                  >

                    ${
                      colors
                        .map(
                          color => `

                            <button
                              type="button"
                              class="avatar-color-option ${
                                color === (
                                  profile?.avatarColor ||
                                  AVATAR_COLORS[0]
                                )
                                  ? "selected"
                                  : ""
                              }"
                              data-color="${color}"
                              title="${color}"
                              aria-label="Choose ${color}"
                              style="
                                background:${color};
                              "
                            ></button>

                          `
                        )
                        .join("")
                    }

                  </div>

                `
              )
              .join("")
          }

        </div>


        <!-- ===================================
             IMAGE URL
        ==================================== -->

        <label
          style="
            display:block;
            margin-top:16px;
          "
        >
          Or paste an image URL (optional)
        </label>


        <input
          type="text"
          id="avatarUrlInput"
          placeholder="https://..."
          value="${escapeHTML(
            profile?.avatarUrl || ""
          )}"
        >


        <button id="saveAvatar">
          Save Avatar
        </button>

      </div>


      <!-- =====================================
           PROFILE CARD
      ====================================== -->

      <div class="card">

        <h3>Profile</h3>


        <label>Username  </label>

        <input
          type="text"
          id="accountUsername"
          value="${escapeHTML(
            profile?.username || ""
          )}"
        >


        <button id="saveUsername" class="btn-compact">
          Save Username
        </button>
<br>

        <label>Display Name</label>

        <input
          type="text"
          id="accountDisplayName"
          value="${escapeHTML(
            profile?.displayName || ""
          )}"
        >


        <button id="saveDisplayName" class="btn-compact">
          Save Display Name
        </button>

      </div>


      <!-- =====================================
           PASSWORD CARD
      ====================================== -->

      ${
        passwordAccount

          ? `

            <div class="card">

              <h3>Change Password</h3>


              <div
                id="passwordError"
                class="auth-error"
              ></div>


              <label>
                Current Password
              </label>

              <div class="password-field">

                <input
                  type="password"
                  id="currentPassword"
                >

                <button
                  type="button"
                  class="toggle-password"
                  data-target="currentPassword"
                >👁</button>

              </div>


              <label>
                New Password
              </label>

              <div class="password-field">

                <input
                  type="password"
                  id="newPassword"
                >

                <button
                  type="button"
                  class="toggle-password"
                  data-target="newPassword"
                >👁</button>

              </div>


              <label>
                Confirm New Password
              </label>

              <div class="password-field">

                <input
                  type="password"
                  id="confirmNewPassword"
                >

                <button
                  type="button"
                  class="toggle-password"
                  data-target="confirmNewPassword"
                >👁</button>

              </div>


              <button id="savePassword">
                Change Password
              </button>

            </div>

          `

          : ""
      }


      <!-- =====================================
           BACK
      ====================================== -->

      <button id="backToApp">
        ← Back
      </button>

    </section>

  `;


  // ==========================================
  // SELECTED VALUES
  // ==========================================

  let selectedEmoji =
    profile?.avatarEmoji ||
    AVATAR_EMOJIS[0];


  let selectedColor =
    profile?.avatarColor ||
    AVATAR_COLORS[0];


  // ==========================================
  // FIND CURRENT AVATAR CATEGORY
  // ==========================================

  let activeAvatarSet =

    Object.entries(AVATAR_SETS)
      .find(
        ([, avatars]) =>
          avatars.includes(selectedEmoji)
      )?.[0]

    || "classic";


  // ==========================================
  // AVATAR PREVIEW
  // ==========================================

  function updateAvatarPreview() {

    const preview =
      document.getElementById(
        "avatarPreview"
      );


    const urlInput =
      document.getElementById(
        "avatarUrlInput"
      );


    const url =
      urlInput.value.trim();


    if (url) {

      preview.innerHTML = `

        <img
          src="${escapeHTML(url)}"
          class="profile-avatar-img large"
        >

      `;

    } else {

      preview.innerHTML = `

        <span
          class="profile-avatar-emoji large"
          style="
            background:${selectedColor};
          "
        >${selectedEmoji}</span>

      `;

    }

  }


  // ==========================================
  // RENDER AVATAR SET
  // ==========================================

  function renderAvatarSet(setKey) {

    activeAvatarSet = setKey;


    const container =
      document.getElementById(
        "avatarSetOptions"
      );


    if (!container) return;


    container.innerHTML =

      AVATAR_SETS[setKey]

        .map(
          emoji => `

            <button
              type="button"
              class="avatar-option ${
                emoji === selectedEmoji
                  ? "selected"
                  : ""
              }"
              data-emoji="${emoji}"
              aria-label="Choose ${emoji}"
            >
              ${emoji}
            </button>

          `
        )
        .join("");


    // Update category tab state

    document
      .querySelectorAll(
        ".avatar-category-tab"
      )
      .forEach(tab => {

        const active =
          tab.dataset.avatarSet === setKey;


        tab.style.background =
          active

            ? "rgba(255,255,255,0.09)"

            : "transparent";


        tab.style.opacity =
          active
            ? "1"
            : "0.55";

      });


    // Attach events to newly-rendered avatars

    container
      .querySelectorAll(
        ".avatar-option"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          handleAvatarSelection
        );

      });

  }


  // ==========================================
  // AVATAR SELECTION
  // ==========================================

  function handleAvatarSelection(event) {

    const button =
      event.currentTarget;


    selectedEmoji =
      button.dataset.emoji;


    document
      .getElementById(
        "avatarUrlInput"
      )
      .value = "";


    document
      .querySelectorAll(
        ".avatar-option"
      )
      .forEach(btn =>
        btn.classList.remove(
          "selected"
        )
      );


    button.classList.add(
      "selected"
    );


    updateAvatarPreview();

  }


  // ==========================================
  // AVATAR CATEGORY BUTTONS
  // ==========================================

  document
    .querySelectorAll(
      ".avatar-category-tab"
    )
    .forEach(tab => {

      tab.addEventListener(
        "click",
        () => {

          renderAvatarSet(
            tab.dataset.avatarSet
          );

        }
      );

    });


  // Open the category containing
  // the currently selected avatar

  renderAvatarSet(
    activeAvatarSet
  );


  // ==========================================
  // IMAGE URL
  // ==========================================

  document
    .getElementById(
      "avatarUrlInput"
    )
    .addEventListener(
      "input",
      updateAvatarPreview
    );


  // ==========================================
  // BACK BUTTON
  // ==========================================

  document
    .getElementById(
      "backToApp"
    )
    .addEventListener(
      "click",
      async () => {

        const { goTo } =
          await import(
            "../../core/router.js"
          );


        goTo("dashboard");

      }
    );


  // ==========================================
  // COLOR SELECTION
  // ==========================================

  document
    .querySelectorAll(
      ".avatar-color-option"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          selectedColor =
            button.dataset.color;


          document
            .getElementById(
              "avatarUrlInput"
            )
            .value = "";


          document
            .querySelectorAll(
              ".avatar-color-option"
            )
            .forEach(btn =>
              btn.classList.remove(
                "selected"
              )
            );


          button.classList.add(
            "selected"
          );


          updateAvatarPreview();

        }
      );

    });


  // ==========================================
  // SAVE AVATAR
  // ==========================================

  document
    .getElementById(
      "saveAvatar"
    )
    .addEventListener(
      "click",
      async () => {

        const urlInput =
          document.getElementById(
            "avatarUrlInput"
          );


        await updateAvatar(
          user.uid,
          {

            avatarEmoji:
              selectedEmoji,

            avatarColor:
              selectedColor,

            avatarUrl:
              urlInput.value.trim()
                || null

          }
        );


        location.reload();

      }
    );


  // ==========================================
  // SAVE USERNAME
  // ==========================================

  document
    .getElementById(
      "saveUsername"
    )
    .addEventListener(
      "click",
      async () => {

        const input =
          document.getElementById(
            "accountUsername"
          );


        const trimmed =
          input.value.trim();


        if (
          !isValidUsernameFormat(
            trimmed
          )
        ) {

          alert(
            "Username must be 3-20 characters: " +
            "letters, numbers, and underscores only."
          );


          return;

        }


        if (
          trimmed ===
          profile?.username
        ) {

          return;

        }


        try {

          await changeUsername(
            user.uid,
            profile?.username,
            trimmed
          );


          location.reload();

        } catch (error) {

          if (
            error.message ===
            "username-taken"
          ) {

            alert(
              "That username is already taken."
            );

          } else {

            console.error(
              "Username change error:",
              error
            );


            alert(
              "Something went wrong. Try again."
            );

          }

        }

      }
    );


  // ==========================================
  // SAVE DISPLAY NAME
  // ==========================================

  document
    .getElementById(
      "saveDisplayName"
    )
    .addEventListener(
      "click",
      async () => {

        const input =
          document.getElementById(
            "accountDisplayName"
          );


        const trimmed =
          input.value.trim();


        if (!trimmed) {

          alert(
            "Display name cannot be empty."
          );


          return;

        }


        await updateDisplayName(
          user.uid,
          trimmed
        );


        location.reload();

      }
    );


  // ==========================================
  // SAVE PASSWORD
  // ==========================================

  if (passwordAccount) {

    document
      .getElementById(
        "savePassword"
      )
      .addEventListener(
        "click",
        async () => {

          const errorBox =
            document.getElementById(
              "passwordError"
            );


          const currentPassword =
            document.getElementById(
              "currentPassword"
            ).value;


          const newPassword =
            document.getElementById(
              "newPassword"
            ).value;


          const confirmPassword =
            document.getElementById(
              "confirmNewPassword"
            ).value;


          errorBox.textContent = "";


          if (
            !currentPassword ||
            !newPassword
          ) {

            errorBox.textContent =
              "Fill in all password fields.";


            return;

          }


          if (
            newPassword !==
            confirmPassword
          ) {

            errorBox.textContent =
              "New passwords do not match.";


            return;

          }


          if (
            newPassword.length < 6
          ) {

            errorBox.textContent =
              "New password must be at least 6 characters.";


            return;

          }


          try {

            const credential =
              EmailAuthProvider.credential(
                user.email,
                currentPassword
              );


            await reauthenticateWithCredential(
              user,
              credential
            );


            await updatePassword(
              user,
              newPassword
            );


            errorBox.classList.add(
              "auth-success"
            );


            errorBox.textContent =
              "Password changed successfully.";

          } catch (error) {

            console.error(
              "Password change error:",
              error
            );


            errorBox.textContent =
              "Current password is incorrect.";

          }

        }
      );

  }

}


// ============================================
// HTML ESCAPE
// ============================================

function escapeHTML(value) {

  return String(value || "")

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}
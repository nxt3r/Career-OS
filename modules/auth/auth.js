import {
  signUpWithEmail,
  logInWithEmail,
  logInWithGoogle,
  logInWithGithub,
  sendVerificationEmail,
  refreshUser,
  resetPassword,
  getFriendlyAuthError
} from "../../core/auth.js";

let mode = "login";


function isValidEmailFormat(email) {

  /*
   * Basic, reasonable format check —
   * not exhaustive, just catches obvious
   * typos/malformed input before hitting
   * Firebase.
   */

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}


function getPasswordStrength(password) {

  if (password.length === 0) {

    return { label: "", className: "" };

  }

  if (password.length < 6) {

    return { label: "Too short", className: "weak" };

  }

  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) {

    return { label: "Weak", className: "weak" };

  }

  if (score <= 2) {

    return { label: "Normal", className: "normal" };

  }

  if (score <= 4) {

    return { label: "Strong", className: "strong" };

  }

  return { label: "Perfect", className: "perfect" };

}

export function renderAuthScreen(container) {

  if (!container) return;

  container.innerHTML = `

    <div class="auth-wrapper">

      <div class="card auth-card">

        <h1>Career OS</h1>

        <h3>${mode === "login" ? "Log In" : "Sign Up"}</h3>

        <div id="authError" class="auth-error"></div>

        <label>Email</label>
        <input
          type="email"
          id="authEmail"
          placeholder="you@example.com"
        >

        <label>Password</label>
        <div class="password-field">
          <input
            type="password"
            id="authPassword"
            placeholder="••••••••"
          >
          <button type="button" class="toggle-password" data-target="authPassword">👁</button>
        </div>

        ${
          mode === "signup"
            ? `<div id="passwordStrength" class="password-strength"></div>`
            : ""
        }

        ${
          mode === "login"
            ? `
              <p class="auth-switch">
                <a href="#" id="authForgotPassword">
                  Forgot password?
                </a>
              </p>
            `
            : ""
        }

        <br>

        <button id="authSubmit">
          ${mode === "login" ? "Log In" : "Sign Up"}
        </button>

        <button id="authGoogle">
          Continue with Google
        </button>

        <button id="authGithub">
          Continue with GitHub
        </button>

        <p class="auth-switch">
          ${
            mode === "login"
              ? `Don't have an account? <a href="#" id="authSwitch">Sign up</a>`
              : `Already have an account? <a href="#" id="authSwitch">Log in</a>`
          }
        </p>

        <p class="auth-switch">
          Need help? <a href="#" id="authSupport">Contact support</a>
        </p>

        <p class="auth-credit">
          A product of
          <a class="nx-credit" href="https://nxt3r.github.io/nx-conglo/" target="_blank" rel="noopener noreferrer"><img src="assets/nx-conglo-logo.png" alt="Nx Conglo"></a>
        </p>

      </div>

    </div>

  `;

  attachAuthEvents(container);

}


export function renderVerifyScreen(container, user) {

  if (!container) return;

  container.innerHTML = `

    <div class="auth-wrapper">

      <div class="card auth-card">

        <h1>Career OS</h1>

        <h3>Verify Your Email</h3>

        <p>
          We sent a verification link to
          <strong>${escapeHTML(user.email)}</strong>.
          Click it, then come back here.
        </p>

        <p class="verify-hint">
          Can't find it? Check your spam or junk folder, then press "Resend Email" below.
        </p>

        <div id="authError" class="auth-error"></div>

        <button id="verifyRefresh">
          I've Verified — Continue
        </button>

        <button id="verifyResend">
          Resend Email
        </button>

        <button id="verifyBackToLogin">
          Back to Login
        </button>

      </div>

    </div>

  `;

  document
    .getElementById("verifyBackToLogin")
    .addEventListener("click", async () => {

      const { logOutUser } =
        await import("../../core/auth.js");

      await logOutUser();

    });

  document
    .getElementById("verifyRefresh")
    .addEventListener("click", async () => {

      const errorBox =
        document.getElementById("authError");

      try {

        await refreshUser(user);

        if (!user.emailVerified) {

          errorBox.textContent =
            "Still not verified — check your inbox " +
            "(and spam folder) and click the link first.";

        }

        /*
         * If verified, onAuthChange's user object
         * is stale until a full refresh, so we
         * force one to let app.js re-check cleanly.
         */

        if (user.emailVerified) {

          location.reload();

        }

      } catch (error) {

        console.error("Verify refresh error:", error);

        errorBox.textContent =
          "Something went wrong. Try again.";

      }

    });

  document
    .getElementById("verifyResend")
    .addEventListener("click", async () => {

      const errorBox =
        document.getElementById("authError");

      try {

        await sendVerificationEmail(user);

        errorBox.textContent =
          "Verification email sent again.";

      } catch (error) {

        console.error("Resend error:", error);

        errorBox.textContent =
          getFriendlyAuthError(error);

      }

    });

}


function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function attachAuthEvents(container) {

  document
    .getElementById("authSubmit")
    .addEventListener("click", () => handleSubmit(container));

  document
    .getElementById("authGoogle")
    .addEventListener("click", () => handleGoogle(container));

  document
    .getElementById("authGithub")
    .addEventListener("click", () => handleGithub(container));

  document
    .getElementById("authSwitch")
    .addEventListener("click", event => {

      event.preventDefault();

      mode =
        mode === "login"
          ? "signup"
          : "login";

      renderAuthScreen(container);

    });

  document
    .getElementById("authSupport")
    .addEventListener("click", async event => {

      event.preventDefault();

      const errorBox =
        document.getElementById("authError");

      try {

        const { openGuestSupport } =
          await import("../help/guestSupport.js");

        await openGuestSupport(container);

      } catch (error) {

        console.error("Guest support error:", error);

        errorBox.textContent =
          "Couldn't open support right now. Please try again.";

      }

    });

  const forgotLink =
    document.getElementById("authForgotPassword");

  if (forgotLink) {

    forgotLink.addEventListener("click", event => {

      event.preventDefault();

      handleForgotPassword();

    });

  }

  document
    .getElementById("authPassword")
    .addEventListener("keydown", event => {

      if (event.key === "Enter") {
        handleSubmit(container);
      }

    });


  const strengthBox =
    document.getElementById("passwordStrength");

  if (strengthBox) {

    document
      .getElementById("authPassword")
      .addEventListener("input", event => {

        const strength =
          getPasswordStrength(event.target.value);

        strengthBox.textContent =
          strength.label;

        strengthBox.className =
          `password-strength ${strength.className}`;

      });

  }

}


async function handleSubmit(container) {

  const email =
    document.getElementById("authEmail").value.trim();

  const password =
    document.getElementById("authPassword").value;

  const errorBox =
    document.getElementById("authError");

  errorBox.textContent = "";

  if (!email || !password) {

    errorBox.textContent =
      "Enter both email and password.";

    return;

  }

  if (!isValidEmailFormat(email)) {

    errorBox.textContent =
      "Enter a valid email address.";

    return;

  }

  try {

    if (mode === "login") {

      await logInWithEmail(email, password);

    } else {

      const credential =
        await signUpWithEmail(email, password);

      await sendVerificationEmail(credential.user);

    }

    /*
     * Successful login/signup triggers
     * onAuthChange in app.js, which takes
     * over rendering the real app.
     */

  } catch (error) {

    console.error("Auth error:", error);

    errorBox.textContent =
      getFriendlyAuthError(error);

  }

}


async function handleForgotPassword() {

  const emailInput =
    document.getElementById("authEmail");

  const errorBox =
    document.getElementById("authError");

  const email =
    emailInput.value.trim();

  errorBox.textContent = "";

  if (!isValidEmailFormat(email)) {

    errorBox.textContent =
      "Enter your email above first, then click " +
      "'Forgot password?' again.";

    return;

  }

  try {

    await resetPassword(email);

    errorBox.textContent =
      "Password reset email sent — check your inbox.";

    errorBox.classList.add("auth-success");

  } catch (error) {

    console.error("Password reset error:", error);

    errorBox.textContent =
      getFriendlyAuthError(error);

  }

}


async function handleGoogle(container) {

  const errorBox =
    document.getElementById("authError");

  errorBox.textContent = "";

  try {

    await logInWithGoogle();

  } catch (error) {

    console.error("Auth error:", error);

    errorBox.textContent =
      getFriendlyAuthError(error);

  }

}


async function handleGithub(container) {

  const errorBox =
    document.getElementById("authError");

  errorBox.textContent = "";

  try {

    await logInWithGithub();

  } catch (error) {

    console.error("Auth error:", error);

    errorBox.textContent =
      getFriendlyAuthError(error);

  }

}
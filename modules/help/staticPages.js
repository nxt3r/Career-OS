const NX_LINK = `<a class="nx-credit" href="https://nxt3r.github.io/nx-conglo/" target="_blank" rel="noopener noreferrer"><img src="assets/nx-conglo-logo.png" alt="Nx Conglo">Nx Conglo</a>`;

const NX_LOGO_ONLY = `<a class="nx-credit" href="https://nxt3r.github.io/nx-conglo/" target="_blank" rel="noopener noreferrer"><img src="assets/nx-conglo-logo.png" alt="Nx Conglo"></a>`;


/* =========================================================
   PRIVACY POLICY
   ========================================================= */

const PRIVACY_SECTIONS = [

  {
    icon: "🏢",
    title: "Who we are",
    html: `Career OS is a product of ${NX_LINK}`
  },

  {
    icon: "🗄️",
    title: "What we store",
    html: "Career OS stores your projects, skills, career goals, time-tracking sessions, and account profile information (username, display name, avatar) in your account."
  },

  {
    icon: "🏆",
    title: "Rankings",
    wide: true,
    html: `The Rankings page shows other signed-in users your weekly and monthly time totals (total, focus and distraction), along with your display name and avatar. Only these totals are shared. Your projects, skills, goals and individual sessions stay private. If you turn on Anonymous, your name and avatar are removed from the public record and you appear as "Anonymous", but your totals still appear on the board.`
  },

  {
    icon: "💬",
    title: "Support chat",
    html: "If you contact support from the login screen without an account, your messages are stored under an anonymous ID (no email or password) so our team can reply. Staff can read support conversations."
  },

  {
    icon: "🚫",
    title: "What we don't do",
    html: "We don't get your password and we never try to access your device. We don't sell your data, and we don't share it with third parties. Staff with appropriate permissions can view account data for support and moderation purposes only."
  },

  {
    icon: "🎛️",
    title: "Your control",
    html: "You can export or permanently delete your data at any time from Settings."
  }

];


export function renderPrivacyPolicy(app) {

  app.innerHTML = `
    <section>

      <h2>Privacy Policy</h2>

      <p class="doc-lead">How Career OS handles your data, in plain language.</p>

      <div class="doc-pills">
        <span class="doc-pill">🔒 Private by default</span>
        <span class="doc-pill">🚫 We don't sell your data</span>
        <span class="doc-pill">🗑️ Export or delete any time</span>
      </div>

      <div class="doc-grid">
        ${PRIVACY_SECTIONS.map((section, index) => `
          <article class="doc-card ${section.wide ? "wide" : ""}" style="--i:${index}">
            <div class="doc-card-head">
              <span class="doc-icon">${section.icon}</span>
              <h3>${section.title}</h3>
            </div>
            <p>${section.html}</p>
          </article>
        `).join("")}
      </div>

      <button id="helpBackBtn" class="btn-compact">← Back</button>

    </section>
  `;

  attachBack();

}


/* =========================================================
   FAQ
   ========================================================= */

const FAQ_GROUPS = ["Basics", "Tracking", "Growth", "Account", "Support"];

const FAQS = [

  { group: "Basics", q: "What is Career OS and who manages it?", a: `Career OS, created by NxT3R, is a subsidiary of ${NX_LOGO_ONLY} that tracks all your time and connects Projects, Skills, and Career Goals with each other. Nx Conglo manages the platform and provides support while also adding new features from time to time.` },

  { group: "Tracking", q: "How do I track my time?", a: "Go to Time OS, pick a category, optionally link a project or skill, and press Start." },

  { group: "Tracking", q: "What is Neutral Time?", a: "Neutral time is time spent in categories set to the Neutral group (like Exercise). It isn't counted as either focus or distraction, so it never counts toward your weekly focus target or your distraction limit." },

  { group: "Tracking", q: "What is focus mode?", a: "Focus mode is a distraction-free interface for tracking time. It hides all other UI elements and shows only the timer and the current task." },

  { group: "Basics", q: "What is the purpose of Inbox?", a: "Inbox is a place to quickly capture tasks, ideas, and notes. You can link each capture to a project so it's easy to find later." },

  { group: "Growth", q: "How does a project count completion percentage?", a: "Completion percentage is calculated based on the number of completed milestones versus total milestones in the project. It does not count hours logged or tasks towards completion." },

  { group: "Growth", q: "What is Capability in Skills?", a: "Capability is a measure of your proficiency in a skill. It can be set to each level by the user and they can choose what they should be able to perform to reach that level." },

  { group: "Growth", q: "What's the difference between Skills and Career goals?", a: "Skills track what you can do. Career goals track where you're going, and reference the skills required to get there." },

  { group: "Growth", q: "What is Roadmap in Career Goals?", a: "Roadmap is a visual representation of the skills and milestones or any other step required to achieve your career goal. It helps you plan and track your progress." },

  { group: "Basics", q: "What are Rankings?", a: "Rankings is a leaderboard of weekly and monthly time totals (total, focus and distraction). Weeks start on Monday. You can hide your name and avatar at any time with the Anonymous switch." },

  { group: "Growth", q: "What is the difference between 'Archiving' and 'Deleting' a Project?", a: "Archiving a project removes it from your active list but keeps its data in your account for future reference. Deleting a project permanently removes it and all associated data." },

  { group: "Account", q: "Can I use Career OS offline?", a: "Career OS saves your data to your account in the cloud, so it needs an internet connection to log in and sync. Stay online while tracking time to make sure everything is saved." },

  { group: "Account", q: "How do I change my Avatar, Username, Display Name, or Password?", a: "Click your name in the top-right corner and choose Account Settings. You can change your avatar, username, display name and, for email accounts, your password there." },

  { group: "Support", q: "How do I report a bug?", a: "Click your name in the top-right corner and choose Report a Bug." },

  { group: "Support", q: "Can I contact support without an account?", a: "Yes. On the login or sign-up screen, click 'Need help? Contact support' to chat with our assistant and team without logging in. Come back to the same link in the same browser to continue the conversation." },

  { group: "Support", q: "I closed the verify screen and now I can't sign up again. What do I do?", a: "Your account was already created. Don't sign up again. Log in with the same email and password and you'll be taken back to the verify screen. Check your spam folder if the email is missing, then press 'Resend Email'." },

  { group: "Account", q: "Can other users see my data?", a: "No, your data is private to your account. Only authorized staff can view it for support purposes. The one exception is Rankings, which shows your time totals (and your name and avatar, unless you turn on Anonymous)." },

  { group: "Account", q: "How do I export, import, or reset my data?", a: "Go to Settings and find the Data card. Export Data downloads a JSON file with all your account data, Import Data replaces your current data with a JSON file you choose, and Reset All Data permanently deletes everything." },

  { group: "Account", q: "How do I delete my account?", a: "Go to Settings and scroll to the Danger Zone, then choose Delete Account. You'll be asked to confirm your identity. Your account is then scheduled for deletion in 30 days, so if you change your mind you can restore it by logging back in before then. After that, your data is permanently deleted." }

];


export function renderFAQ(app) {

  const items = FAQS.map(item => ({
    ...item,
    search: (item.q + " " + item.a.replace(/<[^>]*>/g, " ")).toLowerCase()
  }));

  app.innerHTML = `
    <section>

      <h2>Frequently Asked Questions</h2>

      <p class="doc-lead">Quick answers about tracking, skills, careers and your account.</p>

      <input
        id="faqSearch"
        class="faq-search"
        type="text"
        placeholder="🔍  Search questions…"
        autocomplete="off"
      >

      <div class="doc-chips" id="faqChips">
        ${["All", ...FAQ_GROUPS].map((group, index) => `
          <button class="doc-chip ${index === 0 ? "active" : ""}" data-group="${group}">${group}</button>
        `).join("")}
      </div>

      <div class="faq-list" id="faqList">
        ${items.map((item, index) => `
          <div class="faq-item" data-index="${index}">
            <button class="faq-q" aria-expanded="false">
              <span class="faq-q-text">${item.q}</span>
              <span class="faq-chevron">▾</span>
            </button>
            <div class="faq-a">
              <div class="faq-a-inner"><p>${item.a}</p></div>
            </div>
          </div>
        `).join("")}
      </div>

      <div id="faqEmpty" class="empty-state" hidden>
        <span class="empty-state-icon">🔍</span>
        <p>No questions match. Try different words.</p>
      </div>

      <button id="helpBackBtn" class="btn-compact">← Back</button>

    </section>
  `;

  let activeGroup = "All";
  let query = "";

  function applyFilter() {

    let visible = 0;

    app.querySelectorAll(".faq-item").forEach(element => {

      const item = items[Number(element.dataset.index)];

      const show =
        (activeGroup === "All" || item.group === activeGroup) &&
        (!query || item.search.includes(query));

      element.hidden = !show;

      if (show) visible++;

    });

    document.getElementById("faqEmpty").hidden = visible > 0;

  }

  document.getElementById("faqSearch")
    .addEventListener("input", event => {

      query = event.target.value.trim().toLowerCase();

      applyFilter();

    });

  document.getElementById("faqChips")
    .addEventListener("click", event => {

      const chip = event.target.closest(".doc-chip");

      if (!chip) return;

      activeGroup = chip.dataset.group;

      app.querySelectorAll(".doc-chip").forEach(other =>
        other.classList.toggle("active", other === chip)
      );

      applyFilter();

    });

  document.getElementById("faqList")
    .addEventListener("click", event => {

      const button = event.target.closest(".faq-q");

      if (!button) return;

      const open = button.parentElement.classList.toggle("open");

      button.setAttribute("aria-expanded", String(open));

    });

  attachBack();

}


/* =========================================================
   LICENSE
   ========================================================= */

export function renderLicense(app) {

  const year = new Date().getFullYear();

  app.innerHTML = `
    <section>

      <h2>License</h2>

      <div class="license-card">

        <span class="brand-mark license-mark">C</span>

        <h3 class="license-name">Career <span class="brand-os">OS</span></h3>

        <p>Career OS is a personal productivity application.</p>

        <p>A product of ${NX_LINK}</p>

        <div class="license-divider"></div>

        <p class="license-rights">All rights reserved by Nx Conglo.</p>

        <p class="copyright">© Nx Conglo ${year}</p>

      </div>

      <button id="helpBackBtn" class="btn-compact">← Back</button>

    </section>
  `;

  attachBack();

}


function attachBack() {

  document.getElementById("helpBackBtn")
    .addEventListener("click", async () => {

      const { goTo } = await import("../../core/router.js");

      goTo("dashboard");

    });

}
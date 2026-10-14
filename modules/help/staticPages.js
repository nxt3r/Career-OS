export function renderPrivacyPolicy(app) {

  app.innerHTML = `
    <section>
      <h2>Privacy Policy</h2>
      <div class="card">
        <h3>Who we are</h3>
        <p>Career OS is a product of <a class="nx-credit" href="https://nxt3r.github.io/nx-conglo/" target="_blank" rel="noopener noreferrer"><img src="assets/nx-conglo-logo.png" alt="Nx Conglo">Nx Conglo</a></p>
        <h3>What we store</h3>
        <p>Career OS stores your projects, skills, career goals, time-tracking sessions, and account profile information (username, display name, avatar) in your account.</p>
        <h3>Rankings</h3>
        <p>The Rankings page shows other signed-in users your weekly and monthly time totals (total, focus and distraction), along with your display name and avatar. Only these totals are shared. Your projects, skills, goals and individual sessions stay private. If you turn on Anonymous, your name and avatar are removed from the public record and you appear as "Anonymous", but your totals still appear on the board.</p>
        <h3>Support chat</h3>
        <p>If you contact support from the login screen without an account, your messages are stored under an anonymous ID (no email or password) so our team can reply. Staff can read support conversations.</p>
        <h3>What we don't do</h3>
        <p>We don't get your Password and we never try to access your Device. We don't sell your data, and we don't share it with third parties. Staff with appropriate permissions can view account data for support and moderation purposes only.</p>
        <h3>Your control</h3>
        <p>You can export or permanently delete your data at any time from Settings.</p>
      </div>
      <button id="helpBackBtn" class="btn-compact">← Back</button>
    </section>
  `;

  attachBack();

}


export function renderFAQ(app) {

  const faqs = [
    { q: 'What is/Who manages Career OS?', a: 'Career OS, created by NxT3R, is a subsidiary of <a class="nx-credit" href="https://nxt3r.github.io/nx-conglo/" target="_blank" rel="noopener noreferrer"><img src="assets/nx-conglo-logo.png" alt="Nx Conglo"></a> that tracks all your time and connects Projects, Skills, and Career Goals with each other. Nx Conglo manages the platform and provides support while also adding new features time to time.' },
    { q: 'How do I track my time?', a: 'Go to Time OS, pick a category, optionally link a project or skill, and press Start.' },
    { q: 'What is Neutral Time?', a: "Neutral time is time that isn't linked to any project or skill and should not counted as either productive or unproductive. It can be used for general tasks, breaks, or unplanned activities." },
    { q: 'What is focus mode?', a: 'Focus mode is a distraction-free interface for tracking time. It hides all other UI elements and shows only the timer and the current task.' },
    { q: 'What is the purpose of Inbox?', a: 'Inbox is a place to quickly capture tasks, ideas, and notes. You can later organize them into projects, skills, or career goals.' },
    { q: 'How does a project count completion percentage?', a: 'Completion percentage is calculated based on the number of completed milestones versus total milestones in the project. It does not count hours logged or tasks towards completion.' },
    { q: 'What is Capability in Skills?', a: 'Capability is a measure of your proficiency in a skill. It can be set to each level by the user and they can choose what they should be able to perform to reach that level.' },
    { q: "What's the difference between Skills and Career goals?", a: "Skills track what you can do. Career goals track where you're going, and reference the skills required to get there." },
    { q: 'What is Roadmap in Career Goals?', a: 'Roadmap is a visual representation of the skills and milestones or any other step required to achieve your career goal. It helps you plan and track your progress.' },
    { q: 'What are Rankings?', a: 'Rankings is a leaderboard of weekly and monthly time totals (total, focus and distraction). Weeks start on Monday. You can hide your name and avatar at any time with the Anonymous switch.' },
    { q: "What is the difference between 'Archiving' and 'Deleting' a Project?", a: "Archiving a project removes it from your active list but keeps its data in your account for future reference. Deleting a project permanently removes it and all associated data." },
    { q: "Can I use Career OS offline?", a: "Career OS saves your data to your account in the cloud, so it needs an internet connection to log in and sync. Stay online while tracking time to make sure everything is saved." },
    { q: "How do I change my Avatar, Username, Display Name, or Password?", a: "Click your name in the top-right corner and choose Account Settings. You can change your avatar, username, display name and, for email accounts, your password there." },
    { q: "How do I report a bug?", a: "Click your name in the top-right corner and choose Report a Bug." },
    { q: "Can I contact support without an account?", a: "Yes. On the login or sign-up screen, click 'Need help? Contact support' to chat with our assistant and team without logging in. Come back to the same link in the same browser to continue the conversation." },
    { q: "I closed the verify screen and now I can't sign up again. What do I do?", a: "Your account was already created. Don't sign up again. Log in with the same email and password and you'll be taken back to the verify screen. Check your spam folder if the email is missing, then press 'Resend Email'." },   
    { q: 'Can other users see my data?', a: 'No, your data is private to your account. Only authorized staff can view it for support purposes.' },
    { q: "How do I export, import, or reset my data?", a: "Go to Settings and find the Data card. Export Data downloads a JSON file with all your account data, Import Data replaces your current data with a JSON file you choose, and Reset All Data permanently deletes everything." },
    { q: "How do I delete my account?", a: "Go to Settings and scroll to the Danger Zone, then choose Delete Account. You'll be asked to confirm your identity. Your account is then scheduled for deletion in 30 days, so if you change your mind you can restore it by logging back in before then. After that, your data is permanently deleted." }
  ];

  app.innerHTML = `
    <section>
      <h2>Frequently Asked Questions</h2>
      <div class="card">
        ${
          faqs.map(item => `
            <div class="skill-section">
              <h4>${item.q}</h4>
              <p>${item.a}</p>
            </div>
          `).join("")
        }
      </div>
      <button id="helpBackBtn" class="btn-compact">← Back</button>
    </section>
  `;

  attachBack();

}


export function renderLicense(app) {

const year = new Date().getFullYear();

app.innerHTML = `
  <section>
    <h2>License</h2>

    <div class="card">
      <p>Career OS is a personal productivity application.</p>
      <p>A product of
        <a class="nx-credit" href="https://nxt3r.github.io/nx-conglo/" target="_blank" rel="noopener noreferrer"><img src="assets/nx-conglo-logo.png" alt="Nx Conglo">Nx Conglo</a>
      </p>
      <p>All rights reserved by Nx Conglo.</p>

      <p class="copyright">
        © Nx Conglo ${year}
      </p>
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
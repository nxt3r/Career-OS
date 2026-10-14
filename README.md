# Career OS

**Track your time, projects, skills and career goals in one place.**

Career OS is a personal career dashboard: a vanilla JavaScript web app backed by Firebase. It is a product of [Nx Conglo](https://nxt3r.github.io/nx-conglo/).

> **Version 1.0 (Beta)**

---

## Contents

- [What is Career OS?](#what-is-career-os)
- [Features](#features)
- [How to use it](#how-to-use-it)
- [Roles and the admin panel](#roles-and-the-admin-panel)
- [Support chats](#support-chats)
- [Rankings in detail](#rankings-in-detail)
- [How it is built](#how-it-is-built)
- [Running your own copy](#running-your-own-copy)
- [Privacy and security notes](#privacy-and-security-notes)
- [Known limitations](#known-limitations)
- [Future plans](#future-plans)
- [License](#license)
- [Credits](#credits)

---

## What is Career OS?

Most productivity tools track one thing. Career OS connects the pieces of a career-building routine:

- the **time** you spend (and whether it was focus or distraction),
- the **projects** you are building,
- the **skills** you are growing,
- and the **career goals** those skills and projects lead to.

Time tracked on a project or skill feeds back into your numbers, so you can see whether your hours are actually moving you toward where you want to go.

The app has two sides that share one Firebase backend:

- **The client app**, which is what every user sees.
- **The admin panel**, a separate side for staff (owner, admins and moderators) to manage users, support chats and reports.

---

## Features

### Time OS
- Start, pause, resume and stop timed sessions.
- Pick a **category** for each session and optionally link it to a **project** and a **skill**. Only Focus categories can be linked.
- Every category belongs to a **group**:
  - **Focus**: counts toward your weekly focus target.
  - **Distraction**: counts toward your weekly distraction limit.
  - **Neutral**: tracked, but counted as neither.
- Built-in categories include Deep Work, Study, Scrolling, Gaming and Exercise. You can add and edit your own in Settings.
- **Focus Mode**: a distraction-free, full-screen timer with optional ambient audio.
- Keyboard controls for start, pause and stop.

### Projects
- Track projects with milestones; completion is calculated from completed milestones versus total milestones (hours logged do not count toward completion).
- Statuses such as Planning, Active, Paused and Completed.
- **Archive** a project to remove it from your active list while keeping its data. Only archived projects can be **permanently deleted**, and doing so requires re-verifying your identity.

### Skills
- Track what you can do, with levels you define yourself ("Capability").
- Group skills into your own skill categories.
- See which projects relate to each skill.

### Career goals
- Set where you are going, and link the skills required to get there.
- A roadmap view of the skills and steps needed to reach each goal.

### Dashboard, Inbox and Reviews
- A dashboard overview of your numbers.
- An **Inbox** for quickly capturing tasks, ideas and notes to organize later.
- **Reviews** for looking back at your progress.

### Rankings
- A weekly and monthly leaderboard by **total**, **focus** and **distraction** time.
- A podium for the top three, progress bars for the rest, and your own rank pinned at the bottom.
- An **Anonymous** switch that hides your name and avatar. See [Rankings in detail](#rankings-in-detail).

### Account and profile
- Choose an emoji avatar (several sets), an accent colour, or paste an image URL.
- Change your username, display name and (for email accounts) password.
- Sign in with email, Google or GitHub. Email accounts must verify their address (the verify screen reminds people to check their spam folder).

### Settings
- Weekly focus target, weekly distraction limit, and week start day.
- Manage categories and skill categories.
- **Export**, **Import** and **Reset** your data.
- **Delete Account** with a 30-day grace period: log back in within 30 days to restore it.

### Help and support
- FAQ, Privacy Policy and License pages.
- **Report a Bug** from the profile menu.
- **Help / Chat** to talk to staff. A helper bot answers common questions first (login, verification, passwords, exporting or deleting data). Slash commands such as `/bug`, `/billing`, `/account` and `/other` start a conversation, and suspended users can appeal with `/unban`.
- **Contact support without an account.** The login and sign-up screens have a "Need help? Contact support" link that opens the chat as a guest, with no email or password. Guests get a small set of commands (`/login`, `/signup`, `/verify`, `/password`, `/staff`). If they come back in the same browser, their conversation is still there.

---

## How to use it

1. **Sign up** with email, Google or GitHub. If you use email, verify your address, then choose a username. Stuck? Use **Need help? Contact support** on the login screen.
2. Open **Settings** and set your weekly focus target and distraction limit.
3. Add a few **Projects** and **Skills**, and optionally a **Career goal** that uses them.
4. Open **Time OS**, pick a category (and a project or skill if it is focus work), and press **Start**. Use **Focus Mode** when you want nothing else on screen.
5. Stop the session when you are done. It is saved to your account.
6. Check your **Dashboard** and **Reviews** to see how the week is going.
7. Open **Rankings** to see how your time compares. Turn on **Anonymous** if you would rather not show your name.

Your profile menu (top right) has Account Settings, FAQ, Privacy Policy, License, Report a Bug, Help / Chat and Log Out.

---

## Roles and the admin panel

Every account has one of four roles, enforced by the Firestore security rules (not just the UI):

| Role | What they can do |
| --- | --- |
| **User** | Use the app. Read and write their own data. |
| **Moderator** | Staff. View the user list, view data of lower-ranked users, suspend or unsuspend them, reset their passwords, view the activity log, claim and answer support chats that need a human (one at a time), handle bug reports, and report other staff. |
| **Admin** | Everything a moderator can do, plus change roles below their own, delete user data, create tester accounts, see every support chat and the moderators' satisfaction ratings, and read staff reports. |
| **Owner** | Everything. Sees all staff reports, including reports filed about admins. |

Rules of thumb:

- Staff can only act on accounts **ranked below** them.
- Every staff action is written to the **activity log**.
- Staff can report each other through **Staff Reports**. The Owner and Admins review them. An admin who has been reported cannot see the report about themselves.
- **Tester accounts** let admins create throwaway accounts for testing.

---

## Support chats

1. A user (or a guest on the login screen) opens a chat and either starts with a slash command or just types.
2. The **helper bot** answers common questions from a keyword list. If it cannot, the chat is escalated to staff.
3. Staff **claim** a chat to reply to it. Moderators only see chats that need a human (plus their own) and can handle one chat at a time. Admins and the owner see every chat.
4. When staff mark a chat **resolved**, the user is asked whether their issue was solved. Ratings feed a tally of moderator ratings that admins can see. "Not satisfied" reopens the chat.
5. **Appeals and guest chats skip the rating step** and simply close when resolved. Guest chats are labelled "Guest" in the admin panel and have a "Guests" filter.

---

## Rankings in detail

Users cannot read each other's private data, so rankings live in their own small public collection.

- Each user has one document in `rankings/{uid}` holding only their weekly and monthly totals (total, focus, distraction), plus their display name and avatar.
- The snapshot is refreshed when you stop a session and when you open the Rankings page.
- Weeks always start on **Monday** for everyone, so everyone is compared over the same period. (This is separate from the personal "Week starts on" setting.)
- **Anonymous** removes your name and avatar from the stored document, not just from the screen. Your totals still appear on the board.
- Resetting your data or scheduling account deletion zeroes your public totals and removes your name and avatar.

---

## How it is built

- **Vanilla JavaScript** (ES modules). There is no build step.
- **Firebase** (Authentication and Cloud Firestore), loaded from the Firebase CDN (SDK 10.12.2).
- A small **hash-based router**: the page is the part of the URL after `#`.
- **CSS** is split into `globals.css` for shared styles and one stylesheet per page.
- Logic stays in each page's JavaScript file, and styling stays in CSS.

### Project layout

```
core/         shared logic: auth, firebase, firestore, state, storage, router, username, rankings, staff reports, chat thread...
components/   shared UI such as the sidebar
modules/      one folder per page: dashboard, timer, projects, skills, career, reviews,
              settings, rankings, profile, help, focus, auth...
assets/       images, backgrounds, logo
firestore.rules   the Firestore security rules
```

### Data

| Collection | Contents |
| --- | --- |
| `users/{uid}` | Profile: username, display name, avatar, role, suspended flag |
| `usernames/{name}` | Reserves usernames so they stay unique |
| `userData/{uid}` | The user's private app data: projects, skills, goals, sessions, settings |
| `rankings/{uid}` | Public weekly and monthly totals for the leaderboard |
| `chats/{id}` (and `messages`) | Support chats, including guest chats (marked `guest: true`) |
| `staffReports/{id}` | Reports filed between staff |
| `auditLog/{id}` | Activity log of staff actions |
| `bugReports/{id}` | Bug reports from users |

---

## Running your own copy

1. **Clone** the repository.
2. **Create a Firebase project.** Enable **Authentication** (Email/Password, Google, GitHub and **Anonymous** providers) and create a **Cloud Firestore** database. Anonymous sign-in is only used for guest support chats.
3. **Add your Firebase config** to `core/firebase.js`.
4. **Publish the security rules first.** Copy the contents of `firestore.rules` into Firestore → Rules in the Firebase console and click **Publish**. Do this *before* enabling Anonymous sign-in, so guests never get a chance to read members-only data. Also enable the delete in 30 days for anonymous accounts so they don't pile up. Remember to publish after every rules change.
5. **Serve the files over HTTP.** ES modules do not work from `file://`. Any static server works, for example `npx serve` or the VS Code Live Server extension.
6. **Make yourself the first owner.** The rules do not let anyone give themselves a role, so sign up in the app, then open your document in the `users` collection in the Firebase console and set `role` to `owner`.
7. Add the domain you host on to Authentication → Settings → **Authorized domains**.

---

## Privacy and security notes

- Your projects, skills, goals and sessions are private to your account. Staff with the right permissions can view account data for support and moderation only.
- The only thing other users can see is your weekly and monthly time totals on the Rankings page, with your display name and avatar unless you use Anonymous.
- Guests (people using "Contact support" without an account) get an anonymous Firebase ID. The security rules let them use support chats only. They cannot read rankings, usernames or any member data.
- A Firebase web API key is public by design. The security rules are what protect the data, so always publish them, and restrict the API key to your own domain in the Google Cloud console.
- Roles, suspension and rank checks are enforced in the Firestore rules, so they cannot be bypassed from the browser.

---

## Known limitations

- **Rankings run on the honour system.** Each user writes their own totals, so a technical user could fake hours. A server-side calculation would fix this (see Future plans).
- A **suspended user** stays on the board until the week or month rolls over, unless an admin deletes their ranking document.
- Rankings always use **Monday** as the week start, regardless of the personal Week-start setting.
- Admin "Delete Data" removes a user's Firestore data but **not their login account**. Fully deleting the login requires server-side cleanup that has not been built yet.
- **Guest support** can be spammed, because anyone can start an anonymous session. A guest's conversation is tied to their browser, so clearing site data loses access to it. But all the anonymous account will be deleted in 30 days of creation. So the spamming is temporary.

---

## Future plans

These are ideas, not promises:

- Server-side ranking calculation (Cloud Functions on Firebase's Blaze plan), which would stop cheating and hide suspended users automatically.
- **App Check** and automatic clean-up of old guest sessions.
- An **all-time** tab and **streaks** on Rankings.
- **Badges**, for example for staying under your distraction limit.
- Complete server-side account deletion.

---

## License

Career OS is proprietary software. All rights reserved by Nx Conglo. See [LICENSE](LICENSE).

---

## Credits

Created by **NxT3R**. A product of [Nx Conglo](https://nxt3r.github.io/nx-conglo/).

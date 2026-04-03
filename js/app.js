/**
 * app.js — Application router and initialiser
 *
 * Responsibilities:
 *  - Decide which screen to show on page load (based on session)
 *  - Wire up navigation buttons (landing → register/login, back buttons)
 *  - Handle tab switching within the dashboard
 *  - Handle logout
 *  - Call module init functions
 */

/* ── SCREEN MANAGEMENT ────────────────────────────────────── */

/**
 * Show a screen by its ID; hide all others.
 * All screens have class .screen; only the target gets .active.
 *
 * @param {string} screenId  - e.g. "screen-landing"
 */
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(s => {
    s.classList.toggle("active", s.id === screenId);
  });
}

/** Convenience wrappers for each screen */
function showLanding()   { showScreen("screen-landing"); }
function showRegister()  { resetRegisterForm(); showScreen("screen-register"); }
function showLogin()     { resetLoginForm();    showScreen("screen-login"); }

/**
 * Show the dashboard for the currently logged-in user.
 * Populates the header username, renders the Memories tab,
 * and activates the tab nav.
 */
function showDashboard() {
  const username = getSession();
  if (!username) { showLanding(); return; }

  const user = getUserByUsername(username);
  if (!user)    { clearSession(); showLanding(); return; }

  // Update header
  $("header-username-display").textContent = "@" + username;

  // Render memories tab first (default active tab)
  activateTab("memories");

  showScreen("screen-dashboard");
}

/* ── TAB MANAGEMENT ───────────────────────────────────────── */

/**
 * Activate a dashboard tab by name ("memories" | "write").
 * Updates button active state and shows the correct content panel.
 *
 * @param {string} tabName
 */
function activateTab(tabName) {
  // Update tab buttons
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  // Show/hide tab content panels
  document.querySelectorAll(".tab-content").forEach(panel => {
    panel.classList.toggle("active", panel.id === "tab-" + tabName);
  });

  // Run tab-specific render logic
  if (tabName === "memories") {
    renderMemoriesTab();   // always re-fetch so new memoirs appear
  }
  if (tabName === "write") {
    resetWriteForm();
  }
}

/* ── LOGOUT ───────────────────────────────────────────────── */

/**
 * Clear the session and return the user to the landing screen.
 */
function handleLogout() {
  clearSession();
  showToast("You've been signed out. See you next time!");
  showLanding();
}

/* ── BOOT ─────────────────────────────────────────────────── */

/**
 * Called on DOMContentLoaded.
 * Wires every button and decides the first screen to show.
 */
function init() {
  // Initialise EmailJS (no-op in DEMO_MODE)
  initEmailJS();

  // ── Landing buttons ──
  $("btn-go-register").addEventListener("click", showRegister);
  $("btn-go-login").addEventListener("click",    showLogin);

  // Set the year in the landing logo subtitle
  $("landing-year").textContent = "Class of " + new Date().getFullYear();

  // ── Auth back buttons ──
  $("btn-register-back").addEventListener("click", showLanding);
  $("btn-login-back").addEventListener("click",    showLanding);

  // ── Auth module wiring ──
  initRegister();
  initLogin();

  // ── Dashboard tab buttons ──
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });

  // ── Logout ──
  $("btn-logout").addEventListener("click", handleLogout);

  // ── Write tab wiring ──
  initWriteTab();

  // ── Decide first screen ──
  // If a session exists from a previous page view in this tab, go straight to dashboard
  if (getSession()) {
    showDashboard();
  } else {
    showLanding();
  }
}

// Bootstrap on DOM ready
document.addEventListener("DOMContentLoaded", init);

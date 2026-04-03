/**
 * auth.js — Registration, Login, and OTP verification flows
 *
 * State machine:
 *   Register: step-1 (fill form) → send OTP → step-2 (enter OTP) → create account → dashboard
 *   Login:    step-1 (username + password) → send OTP → step-2 (enter OTP) → dashboard
 *
 * OTPs are held in memory only (no localStorage) and expire after OTP_TTL_MS.
 */

/* ── OTP IN-MEMORY STORE ──────────────────────────────────── */
// Keyed by email, holds { code, expiresAt }
const _otpStore = {};
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate and cache an OTP for an email address.
 * @param {string} email
 * @returns {string} the generated code
 */
function _issueOTP(email) {
  const code = generateOTP();
  _otpStore[email.toLowerCase()] = {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
  };
  return code;
}

/**
 * Validate a submitted OTP against the stored value.
 * Clears the entry on success.
 * @param {string} email
 * @param {string} submittedCode
 * @returns {{ ok: boolean, error?: string }}
 */
function _validateOTP(email, submittedCode) {
  const entry = _otpStore[email.toLowerCase()];
  if (!entry) return { ok: false, error: "No OTP found. Please request a new one." };
  if (Date.now() > entry.expiresAt) {
    delete _otpStore[email.toLowerCase()];
    return { ok: false, error: "OTP has expired. Please request a new one." };
  }
  if (entry.code !== submittedCode.trim()) {
    return { ok: false, error: "Incorrect OTP. Please check and try again." };
  }
  delete _otpStore[email.toLowerCase()];
  return { ok: true };
}

/* ── REGISTRATION ─────────────────────────────────────────── */

// Temporary holder for the pending registration data
let _pendingRegData = null;

/**
 * Wire up the registration screen's buttons and form logic.
 * Called once by app.js on init.
 */
function initRegister() {
  $("btn-register-submit").addEventListener("click", handleRegisterStep1);
  $("btn-register-verify").addEventListener("click", handleRegisterStep2);
  $("btn-resend-reg-otp").addEventListener("click", resendRegisterOTP);
}

/**
 * Step 1: Validate form fields, then send OTP to the provided email.
 */
async function handleRegisterStep1() {
  hideError("reg-error");

  const name     = $("reg-name").value.trim();
  const username = $("reg-username").value.trim().toLowerCase().replace(/\s+/g, "_");
  const email    = $("reg-email").value.trim().toLowerCase();
  const password = $("reg-password").value;
  const bio      = $("reg-bio").value.trim();

  // ── Validation ──
  if (!name)               return showError("reg-error", "Please enter your full name.");
  if (!username)           return showError("reg-error", "Please enter a username.");
  if (!/^[a-z0-9_]{3,20}$/.test(username))
    return showError("reg-error", "Username must be 3–20 chars: letters, numbers, underscores only.");
  if (!email || !email.includes("@"))
    return showError("reg-error", "Please enter a valid email address.");
  if (password.length < 6)
    return showError("reg-error", "Password must be at least 6 characters.");

  // Check username uniqueness before sending OTP
  if (getUserByUsername(username)) {
    return showError("reg-error", "That username is already taken. Please choose another.");
  }

  // ── Send OTP ──
  const btn = $("btn-register-submit");
  btn.textContent = "Sending…";
  btn.disabled = true;

  try {
    const otp = _issueOTP(email);
    await sendOTPEmail(email, name, otp);

    // Cache the form data for use in step 2
    _pendingRegData = { name, username, email, password, bio };

    // Show OTP step
    $("register-step-1").classList.add("hidden");
    $("register-step-2").classList.remove("hidden");
    $("reg-otp-email-display").textContent = email;

    showToast("OTP sent! Check your inbox.");
  } catch (err) {
    showError("reg-error", "Failed to send OTP. Please try again. (" + err.message + ")");
  } finally {
    btn.textContent = "Send OTP to Email";
    btn.disabled = false;
  }
}

/**
 * Step 2: Verify the entered OTP; if valid, create the account.
 */
function handleRegisterStep2() {
  hideError("reg-otp-error");

  const code = $("reg-otp").value.trim();
  if (!code) return showError("reg-otp-error", "Please enter the OTP.");

  const result = _validateOTP(_pendingRegData.email, code);
  if (!result.ok) return showError("reg-otp-error", result.error);

  // Create the account
  try {
    createUser(_pendingRegData);
    setSession(_pendingRegData.username);
    _pendingRegData = null;
    showToast("Account created! Welcome to the Yearbook 🎉");
    showDashboard();
  } catch (err) {
    showError("reg-otp-error", err.message);
  }
}

/**
 * Resend OTP on the register OTP screen.
 */
async function resendRegisterOTP() {
  if (!_pendingRegData) return;
  try {
    const otp = _issueOTP(_pendingRegData.email);
    await sendOTPEmail(_pendingRegData.email, _pendingRegData.name, otp);
    showToast("OTP resent!");
  } catch {
    showToast("Could not resend OTP. Please go back and try again.");
  }
}

/* ── LOGIN ────────────────────────────────────────────────── */

// Email for the pending login (needed in step 2)
let _pendingLoginEmail   = null;
let _pendingLoginUsername = null;

/**
 * Wire up login screen buttons.
 * Called once by app.js on init.
 */
function initLogin() {
  $("btn-login-submit").addEventListener("click", handleLoginStep1);
  $("btn-login-verify").addEventListener("click", handleLoginStep2);
  $("btn-resend-login-otp").addEventListener("click", resendLoginOTP);
}

/**
 * Step 1: Validate credentials, then send OTP to the user's email.
 */
async function handleLoginStep1() {
  hideError("login-error");

  const username = $("login-username").value.trim().toLowerCase();
  const password = $("login-password").value;

  if (!username) return showError("login-error", "Please enter your username.");
  if (!password) return showError("login-error", "Please enter your password.");

  const user = getUserByUsername(username);
  if (!user)              return showError("login-error", "No account found with that username.");
  if (user.password !== password)
    return showError("login-error", "Incorrect password. Please try again.");

  // ── Send OTP ──
  const btn = $("btn-login-submit");
  btn.textContent = "Sending…";
  btn.disabled = true;

  try {
    const otp = _issueOTP(user.email);
    await sendOTPEmail(user.email, user.name, otp);

    _pendingLoginEmail    = user.email;
    _pendingLoginUsername = user.username;

    $("login-step-1").classList.add("hidden");
    $("login-step-2").classList.remove("hidden");
    $("login-otp-email-display").textContent = user.email;

    showToast("OTP sent! Check your inbox.");
  } catch (err) {
    showError("login-error", "Failed to send OTP. (" + err.message + ")");
  } finally {
    btn.textContent = "Send OTP to Email";
    btn.disabled = false;
  }
}

/**
 * Step 2: Verify OTP; if valid, start session and go to dashboard.
 */
function handleLoginStep2() {
  hideError("login-otp-error");

  const code = $("login-otp").value.trim();
  if (!code) return showError("login-otp-error", "Please enter the OTP.");

  const result = _validateOTP(_pendingLoginEmail, code);
  if (!result.ok) return showError("login-otp-error", result.error);

  setSession(_pendingLoginUsername);
  _pendingLoginEmail    = null;
  _pendingLoginUsername = null;
  showToast("Signed in! Welcome back 👋");
  showDashboard();
}

/**
 * Resend OTP on the login OTP screen.
 */
async function resendLoginOTP() {
  if (!_pendingLoginEmail || !_pendingLoginUsername) return;
  const user = getUserByUsername(_pendingLoginUsername);
  if (!user) return;
  try {
    const otp = _issueOTP(user.email);
    await sendOTPEmail(user.email, user.name, otp);
    showToast("OTP resent!");
  } catch {
    showToast("Could not resend OTP.");
  }
}

/**
 * Reset login form back to step 1 (called when navigating away).
 */
function resetLoginForm() {
  $("login-step-1").classList.remove("hidden");
  $("login-step-2").classList.add("hidden");
  $("login-username").value = "";
  $("login-password").value = "";
  $("login-otp").value = "";
  hideError("login-error");
  hideError("login-otp-error");
  _pendingLoginEmail    = null;
  _pendingLoginUsername = null;
}

/**
 * Reset register form back to step 1.
 */
function resetRegisterForm() {
  $("register-step-1").classList.remove("hidden");
  $("register-step-2").classList.add("hidden");
  ["reg-name","reg-username","reg-email","reg-password","reg-bio","reg-otp"].forEach(id => {
    const el = $(id);
    if (el) el.value = "";
  });
  hideError("reg-error");
  hideError("reg-otp-error");
  _pendingRegData = null;
}

/**
 * utils.js — Shared utility functions
 *
 * Covers:
 *  - OTP generation
 *  - Email sending via EmailJS
 *  - Toast notifications
 *  - General DOM helpers
 *
 * NOTE: Before deploying, set your EmailJS credentials in
 *       the CONFIG object below (see README.md).
 */

/* ── EMAILJS CONFIGURATION ────────────────────────────────────
   1. Sign up at https://www.emailjs.com (free tier is enough)
   2. Create a service (Gmail, Outlook, etc.)
   3. Create an email template with variables:
        {{to_email}}  — recipient address
        {{otp}}       — the 6-digit code
        {{to_name}}   — recipient's name
   4. Fill in the three values below.
   ────────────────────────────────────────────────────────── */
const EMAILJS_CONFIG = {
  PUBLIC_KEY:  "YOUR_EMAILJS_PUBLIC_KEY",   // from EmailJS → Account → API Keys
  SERVICE_ID:  "YOUR_SERVICE_ID",           // e.g. "service_abc123"
  TEMPLATE_ID: "YOUR_TEMPLATE_ID",         // e.g. "template_xyz456"
};

/* ── DEMO MODE ─────────────────────────────────────────────────
   When DEMO_MODE = true, OTPs are shown in an alert() instead of
   being emailed. Useful for local testing without EmailJS setup.
   Set to false when you configure EmailJS for real deployment.
   ────────────────────────────────────────────────────────── */
const DEMO_MODE = true;

/**
 * Initialise EmailJS (called once on page load by app.js).
 */
function initEmailJS() {
  if (!DEMO_MODE) {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  }
}

/**
 * Generate a cryptographically random 6-digit OTP string.
 * @returns {string} e.g. "482019"
 */
function generateOTP() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  // Map to 100000–999999 range
  return String(100000 + (arr[0] % 900000));
}

/**
 * Send an OTP email to the given address.
 * In DEMO_MODE, shows the OTP in an alert instead.
 *
 * @param {string} toEmail   - Recipient email address
 * @param {string} toName    - Recipient display name
 * @param {string} otp       - The 6-digit code to send
 * @returns {Promise<void>}
 */
async function sendOTPEmail(toEmail, toName, otp) {
  if (DEMO_MODE) {
    // In demo mode, surface OTP to the developer without emailing
    alert(`[DEMO MODE]\n\nYour OTP for ${toEmail} is:\n\n${otp}\n\n(Set DEMO_MODE = false and configure EmailJS to send real emails.)`);
    return;
  }

  // Real email via EmailJS
  await emailjs.send(
    EMAILJS_CONFIG.SERVICE_ID,
    EMAILJS_CONFIG.TEMPLATE_ID,
    {
      to_email: toEmail,
      to_name:  toName,
      otp:      otp,
    }
  );
}

/* ── TOAST NOTIFICATIONS ──────────────────────────────────── */
let _toastTimer = null;

/**
 * Show a brief toast message at the bottom-right of the screen.
 * Auto-dismisses after `duration` ms.
 *
 * @param {string} message
 * @param {number} [duration=3000]
 */
function showToast(message, duration = 3000) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add("hidden"), duration);
}

/* ── DOM HELPERS ──────────────────────────────────────────── */

/**
 * Shorthand for document.getElementById.
 * @param {string} id
 * @returns {HTMLElement}
 */
function $(id) {
  return document.getElementById(id);
}

/**
 * Show a form-level error message inside an element.
 * @param {string} elementId
 * @param {string} message
 */
function showError(elementId, message) {
  const el = $(elementId);
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
}

/**
 * Hide a form-level error message.
 * @param {string} elementId
 */
function hideError(elementId) {
  const el = $(elementId);
  if (el) el.classList.add("hidden");
}

/**
 * Show a success message.
 * @param {string} elementId
 * @param {string} message
 */
function showSuccess(elementId, message) {
  const el = $(elementId);
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
}

/**
 * Get the initials from a full name (up to 2 chars).
 * e.g. "Priya Sharma" → "PS"
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || "")
    .join("");
}

/**
 * Format a timestamp (ms since epoch) to a readable date string.
 * e.g. 1711929600000 → "Apr 1, 2025"
 * @param {number} ts
 * @returns {string}
 */
function formatDate(ts) {
  return new Date(ts).toLocaleDateString("en-IN", {
    year:  "numeric",
    month: "short",
    day:   "numeric",
  });
}

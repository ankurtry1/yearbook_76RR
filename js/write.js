/**
 * write.js — "Write a Memoir" tab
 *
 * Responsibilities:
 *  - Live username lookup with name preview
 *  - Character counter on the memoir textarea
 *  - Validation and submission of memoir to storage
 */

const MEMOIR_MAX_CHARS = 500;

// Debounce timer for username lookup
let _usernameDebounce = null;

/**
 * Wire up all interactivity for the Write tab.
 * Called once from app.js after the dashboard is first shown.
 */
function initWriteTab() {
  const usernameInput = $("write-to-username");
  const textArea      = $("write-memoir-text");
  const sendBtn       = $("btn-send-memoir");

  // ── Live username lookup ──
  usernameInput.addEventListener("input", () => {
    clearTimeout(_usernameDebounce);
    _usernameDebounce = setTimeout(handleUsernameInput, 300);
  });

  // ── Character counter ──
  textArea.addEventListener("input", updateCharCount);

  // ── Send button ──
  sendBtn.addEventListener("click", handleSendMemoir);
}

/**
 * Look up the entered username and display the matched person's name
 * (or an error if not found / is self).
 */
function handleUsernameInput() {
  const rawInput = $("write-to-username").value.trim().toLowerCase();
  const preview  = $("write-to-name-preview");

  // Clear preview when field is empty
  if (!rawInput) {
    preview.textContent = "";
    preview.className   = "name-preview";
    return;
  }

  const currentUser = getSession();

  // Prevent writing to yourself
  if (rawInput === currentUser) {
    preview.textContent = "That's you! Pick a different classmate.";
    preview.className   = "name-preview not-found";
    return;
  }

  const found = getUserByUsername(rawInput);
  if (found) {
    preview.textContent = "✓ " + found.name;
    preview.className   = "name-preview";   // green (default colour)
  } else {
    preview.textContent = "✗ No account found with that username.";
    preview.className   = "name-preview not-found";  // red
  }
}

/**
 * Update the character counter below the textarea.
 */
function updateCharCount() {
  const len     = $("write-memoir-text").value.length;
  const counter = $("memoir-char-count");
  counter.textContent = len + " / " + MEMOIR_MAX_CHARS;
  counter.classList.toggle("over", len > MEMOIR_MAX_CHARS);
}

/**
 * Validate and submit the memoir.
 */
function handleSendMemoir() {
  hideError("write-error");
  hideSuccess("write-success");

  const toUsername  = $("write-to-username").value.trim().toLowerCase();
  const text        = $("write-memoir-text").value.trim();
  const currentUser = getSession();

  // ── Validation ──
  if (!toUsername) return showError("write-error", "Please enter the recipient's username.");
  if (toUsername === currentUser) return showError("write-error", "You can't write a memoir to yourself.");

  const recipient = getUserByUsername(toUsername);
  if (!recipient) return showError("write-error", "No account found for that username.");

  if (!text)                        return showError("write-error", "Please write something before sending!");
  if (text.length > MEMOIR_MAX_CHARS)
    return showError("write-error", `Memoir is too long (max ${MEMOIR_MAX_CHARS} characters).`);

  // ── Lookup author details ──
  const author = getUserByUsername(currentUser);

  // ── Save to storage ──
  addMemoir({
    toUsername:   recipient.username,
    fromUsername: currentUser,
    fromName:     author ? author.name : currentUser,
    text,
  });

  // ── Reset form ──
  $("write-to-username").value  = "";
  $("write-memoir-text").value  = "";
  $("write-to-name-preview").textContent = "";
  updateCharCount();

  showSuccess("write-success", `Your memoir was sent to ${recipient.name}! ✦`);
  showToast("Memoir delivered! 🕊️");
}

/**
 * Reset the Write tab form (called on tab switch or logout).
 */
function resetWriteForm() {
  $("write-to-username").value  = "";
  $("write-memoir-text").value  = "";
  $("write-to-name-preview").textContent = "";
  $("write-to-name-preview").className   = "name-preview";
  updateCharCount();
  hideError("write-error");
  hideSuccess("write-success");
}

// Expose hideSuccess locally (mirrors utils.js showSuccess pattern)
function hideSuccess(elementId) {
  const el = $(elementId);
  if (el) el.classList.add("hidden");
}

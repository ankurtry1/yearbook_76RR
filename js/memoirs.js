/**
 * memoirs.js — "Memories" tab
 *
 * Responsibilities:
 *  - Fetch all memoirs addressed to the current user
 *  - Render them as 3D flip cards (front = sender info, back = memoir text)
 *  - Handle card click to toggle the flip state
 *  - Show empty state when no memoirs exist
 */

/**
 * Render the Memories tab for the currently logged-in user.
 * Safe to call multiple times (re-renders from fresh localStorage data).
 */
function renderMemoriesTab() {
  const username = getSession();
  if (!username) return;

  const grid    = $("memories-grid");
  const empty   = $("memories-empty");
  const memoirs = getMemoisForUser(username);

  // Clear previous render
  grid.innerHTML = "";

  if (memoirs.length === 0) {
    // Show empty state with the user's username as a shareable badge
    grid.classList.add("hidden");
    empty.classList.remove("hidden");
    $("empty-username-display").textContent = "@" + username;
    return;
  }

  // Hide empty state, show grid
  grid.classList.remove("hidden");
  empty.classList.add("hidden");

  // Build one flip card per memoir
  memoirs.forEach((memoir, index) => {
    const card = buildFlipCard(memoir, index);
    grid.appendChild(card);
  });
}

/**
 * Build and return a flip card DOM element for a single memoir.
 *
 * Card structure:
 *  .flip-card
 *    .flip-card-inner
 *      .flip-front   ← sender avatar + name (visible by default)
 *      .flip-back    ← memoir text (visible after flip)
 *
 * @param {Object} memoir  - MemoirRecord from storage.js
 * @param {number} index   - Position in the list (used for stagger animation)
 * @returns {HTMLElement}
 */
function buildFlipCard(memoir, index) {
  // ── Outer wrapper ──
  const card = document.createElement("div");
  card.className = "flip-card";
  // Stagger the entrance animation slightly for each card
  card.style.animationDelay = (index * 60) + "ms";

  // ── Inner rotating container ──
  const inner = document.createElement("div");
  inner.className = "flip-card-inner";

  // ── FRONT face ──
  const front = document.createElement("div");
  front.className = "flip-front";

  // Avatar circle with sender's initials
  const avatar = document.createElement("div");
  avatar.className = "flip-front-avatar";
  avatar.textContent = getInitials(memoir.fromName);

  // Sender display name
  const name = document.createElement("div");
  name.className = "flip-front-name";
  name.textContent = memoir.fromName;

  // Sender username
  const uname = document.createElement("div");
  uname.className = "flip-front-username";
  uname.textContent = "@" + memoir.fromUsername;

  // Hint to click
  const hint = document.createElement("div");
  hint.className = "flip-hint";
  hint.textContent = "click to read ↩";

  front.append(avatar, name, uname, hint);

  // ── BACK face ──
  const back = document.createElement("div");
  back.className = "flip-back";

  // Memoir text
  const text = document.createElement("div");
  text.className = "flip-back-text";
  text.textContent = memoir.text;

  // Date sent
  const meta = document.createElement("div");
  meta.className = "flip-back-meta";
  meta.textContent = "— " + memoir.fromName + " · " + formatDate(memoir.createdAt);

  back.append(text, meta);

  // ── Assemble ──
  inner.append(front, back);
  card.appendChild(inner);

  // ── Click to toggle flip ──
  // CSS :hover also flips (for desktop), but click persists for mobile
  card.addEventListener("click", () => {
    card.classList.toggle("flipped");
  });

  return card;
}

/**
 * storage.js — localStorage abstraction layer
 *
 * All data is kept in localStorage under two keys:
 *
 *   "ybk_users"   → { [username]: UserRecord }
 *   "ybk_memoirs" → MemoirRecord[]
 *
 * UserRecord shape:
 *   {
 *     username:  string,   // unique, lowercase
 *     name:      string,   // display name
 *     email:     string,
 *     password:  string,   // plain-text (acceptable for a school demo; use hashing in production)
 *     bio:       string,
 *     createdAt: number,   // timestamp ms
 *   }
 *
 * MemoirRecord shape:
 *   {
 *     id:          string,   // unique ID  e.g. "m_1711929600123"
 *     toUsername:  string,   // recipient
 *     fromUsername:string,   // author
 *     fromName:    string,   // author display name (snapshot at write time)
 *     text:        string,
 *     createdAt:   number,   // timestamp ms
 *   }
 */

const USERS_KEY   = "ybk_users";
const MEMOIRS_KEY = "ybk_memoirs";

/* ── USERS ────────────────────────────────────────────────── */

/**
 * Load the full users map from localStorage.
 * @returns {{ [username: string]: Object }}
 */
function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  } catch {
    return {};
  }
}

/**
 * Persist the users map to localStorage.
 * @param {{ [username: string]: Object }} users
 */
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/**
 * Find a user by username (case-insensitive).
 * @param {string} username
 * @returns {Object|null}
 */
function getUserByUsername(username) {
  const users = loadUsers();
  return users[username.toLowerCase()] || null;
}

/**
 * Create and persist a new user account.
 * Returns the created user object, or throws if username already taken.
 *
 * @param {Object} params
 * @param {string} params.username
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} [params.bio]
 * @returns {Object} the new user record
 */
function createUser({ username, name, email, password, bio = "" }) {
  const users = loadUsers();
  const key = username.toLowerCase();

  if (users[key]) {
    throw new Error("Username already taken. Please choose another.");
  }

  // Check for duplicate email
  const emailTaken = Object.values(users).some(
    u => u.email.toLowerCase() === email.toLowerCase()
  );
  if (emailTaken) {
    throw new Error("An account with this email already exists.");
  }

  const user = {
    username:  key,
    name,
    email,
    password,   // NOTE: hash with bcrypt/PBKDF2 in a real backend
    bio,
    createdAt: Date.now(),
  };

  users[key] = user;
  saveUsers(users);
  return user;
}

/* ── MEMOIRS ──────────────────────────────────────────────── */

/**
 * Load all memoirs from localStorage.
 * @returns {Object[]}
 */
function loadMemoirs() {
  try {
    return JSON.parse(localStorage.getItem(MEMOIRS_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * Persist the full memoirs array to localStorage.
 * @param {Object[]} memoirs
 */
function saveMemoirs(memoirs) {
  localStorage.setItem(MEMOIRS_KEY, JSON.stringify(memoirs));
}

/**
 * Fetch all memoirs addressed TO a given username.
 * Returns newest first.
 *
 * @param {string} username
 * @returns {Object[]}
 */
function getMemoisForUser(username) {
  return loadMemoirs()
    .filter(m => m.toUsername === username.toLowerCase())
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Add a new memoir record.
 *
 * @param {Object} params
 * @param {string} params.toUsername
 * @param {string} params.fromUsername
 * @param {string} params.fromName
 * @param {string} params.text
 * @returns {Object} the saved memoir record
 */
function addMemoir({ toUsername, fromUsername, fromName, text }) {
  const memoirs = loadMemoirs();
  const memoir = {
    id:           "m_" + Date.now(),
    toUsername:   toUsername.toLowerCase(),
    fromUsername: fromUsername.toLowerCase(),
    fromName,
    text,
    createdAt:    Date.now(),
  };
  memoirs.push(memoir);
  saveMemoirs(memoirs);
  return memoir;
}

/* ── SESSION ──────────────────────────────────────────────── */
// Session is kept in sessionStorage so it clears on tab close.
const SESSION_KEY = "ybk_session";

/**
 * Persist the logged-in user's username to the session.
 * @param {string} username
 */
function setSession(username) {
  sessionStorage.setItem(SESSION_KEY, username.toLowerCase());
}

/**
 * Return the currently logged-in username, or null.
 * @returns {string|null}
 */
function getSession() {
  return sessionStorage.getItem(SESSION_KEY);
}

/**
 * Clear the active session (logout).
 */
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

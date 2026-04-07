const ADMIN_PREVIEW_TOKEN = 'admin123';
const ADMIN_PREVIEW_STORAGE_KEY = 'yearbook_admin_preview';

export function isDevAdminPreviewCode(value: string): boolean {
  if (!import.meta.env.DEV) return false;
  return value.trim() === ADMIN_PREVIEW_TOKEN;
}

export function readPersistedDevPreviewMode(): boolean {
  if (!import.meta.env.DEV) return false;

  try {
    return window.localStorage.getItem(ADMIN_PREVIEW_STORAGE_KEY) === 'enabled';
  } catch {
    return false;
  }
}

export function persistDevPreviewMode(): void {
  if (!import.meta.env.DEV) return;

  try {
    window.localStorage.setItem(ADMIN_PREVIEW_STORAGE_KEY, 'enabled');
  } catch {
    // Ignore storage errors in private mode.
  }
}

export function clearDevPreviewMode(): void {
  try {
    window.localStorage.removeItem(ADMIN_PREVIEW_STORAGE_KEY);
  } catch {
    // Ignore storage errors in private mode.
  }
}

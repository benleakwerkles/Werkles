/** Client-only mock session for local route preview (no Supabase). */

export type DevPreviewSession = {
  userId: string;
  email: string;
};

const STORAGE_KEY = "werkles_dev_preview_session";
const COOKIE_KEY = STORAGE_KEY;

function readCookieSession(): DevPreviewSession | null {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_KEY}=`));
  if (!cookie) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(cookie.slice(COOKIE_KEY.length + 1))) as DevPreviewSession;
    if (!parsed?.userId || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readDevPreviewSession(): DevPreviewSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return readCookieSession();
    const parsed = JSON.parse(raw) as DevPreviewSession;
    if (!parsed?.userId || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeDevPreviewSession(session: DevPreviewSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=86400; samesite=lax`;
}

export function clearDevPreviewSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; samesite=lax`;
}

export function signInDevPreview(email: string) {
  writeDevPreviewSession({
    userId: "dev-preview-user",
    email: email.trim() || "operator@werkles.local"
  });
}

/** Client-only mock session for local route preview (no Supabase). */

export type DevPreviewSession = {
  userId: string;
  email: string;
};

const STORAGE_KEY = "werkles_dev_preview_session";

export function readDevPreviewSession(): DevPreviewSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DevPreviewSession;
    if (!parsed?.userId || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeDevPreviewSession(session: DevPreviewSession) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearDevPreviewSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function signInDevPreview(email: string) {
  writeDevPreviewSession({
    userId: "dev-preview-user",
    email: email.trim() || "operator@werkles.local"
  });
}

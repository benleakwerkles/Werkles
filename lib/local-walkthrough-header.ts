type LocalWalkthroughSession = {
  email: string;
  userId: "dev-preview-user";
};

export function isLocalWalkthroughSessionCookie(raw: string | undefined): raw is string {
  if (!raw || raw.length > 1000) return false;

  try {
    const parsed = JSON.parse(raw) as Partial<LocalWalkthroughSession>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;

    return parsed.userId === "dev-preview-user"
      && typeof parsed.email === "string"
      && parsed.email.trim().length > 0
      && parsed.email.length <= 320;
  } catch {
    return false;
  }
}

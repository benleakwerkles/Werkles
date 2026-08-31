/**
 * Ghost Fleet is Local + Preview only.
 * Hard-closed on Vercel Production until Operator promote phrase.
 */
export function isGhostFleetEnabled() {
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.GHOST_FLEET_LOCAL === "true") return true;
  if (process.env.VERCEL_ENV === "preview") return true;
  return process.env.NODE_ENV === "development";
}

export const GHOST_FLEET_DISCLOSURE =
  "Practice profiles, not real people. Werkles uses them to test matching before introducing members.";

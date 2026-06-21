import { readDevPreviewSession } from "@/lib/dev-preview-session";
import { isLocalRoutePreviewUnlocked } from "@/lib/local-route-preview";

/** When true, auth/membership pages mock sign-in and skip Supabase/Stripe. */
export function shouldUseDevPreviewAuth() {
  return isLocalRoutePreviewUnlocked();
}

export function getDevPreviewUser() {
  const session = readDevPreviewSession();
  if (!session || !shouldUseDevPreviewAuth()) return null;
  return { id: session.userId, email: session.email };
}

export function isSignedInForDevPreview() {
  return shouldUseDevPreviewAuth() && Boolean(readDevPreviewSession());
}

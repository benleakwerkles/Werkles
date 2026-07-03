import { readDevPreviewSession } from "@/lib/dev-preview-session";
import { isLocalRoutePreviewUnlocked, isRuntimeRoutePreviewUnlocked } from "@/lib/local-route-preview";

/** When true, auth/membership pages mock sign-in and skip Supabase/Stripe. */
export function shouldUseDevPreviewAuth() {
  return isLocalRoutePreviewUnlocked();
}

export function shouldUseRuntimePreviewAuth() {
  return isRuntimeRoutePreviewUnlocked();
}

export function getDevPreviewUser() {
  const session = readDevPreviewSession();
  if (!session || !shouldUseRuntimePreviewAuth()) return null;
  return { id: session.userId, email: session.email };
}

export function isSignedInForDevPreview() {
  return shouldUseRuntimePreviewAuth() && Boolean(readDevPreviewSession());
}

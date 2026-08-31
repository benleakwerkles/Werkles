import { readDevPreviewSession } from "@/lib/dev-preview-session";
import { isLocalRoutePreviewUnlocked } from "@/lib/local-route-preview";
import { getSupabaseBrowser, hasSupabaseBrowserConfig } from "@/lib/supabase/client";

export async function getClientAccessToken(): Promise<string | null> {
  if (hasSupabaseBrowserConfig()) {
    const { data } = await getSupabaseBrowser().auth.getSession();
    if (data.session?.access_token) return data.session.access_token;
  }
  return isLocalRoutePreviewUnlocked() && readDevPreviewSession()
    ? "dev-preview-token"
    : null;
}

export async function getClientAuthEmail(): Promise<string | null> {
  if (hasSupabaseBrowserConfig()) {
    const { data } = await getSupabaseBrowser().auth.getUser();
    if (data.user?.email) return data.user.email;
  }
  const dev = readDevPreviewSession();
  return isLocalRoutePreviewUnlocked() && dev ? dev.email : null;
}

export function isDevPreviewSignedIn() {
  return isLocalRoutePreviewUnlocked() && Boolean(readDevPreviewSession());
}

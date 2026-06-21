import { readDevPreviewSession } from "@/lib/dev-preview-session";
import { isLocalRoutePreviewUnlocked } from "@/lib/local-route-preview";
import { getSupabaseBrowser, hasSupabaseBrowserConfig } from "@/lib/supabase/client";

export async function getClientAccessToken(): Promise<string | null> {
  if (isLocalRoutePreviewUnlocked() && readDevPreviewSession()) {
    return "dev-preview-token";
  }
  if (!hasSupabaseBrowserConfig()) return null;
  const { data } = await getSupabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

export async function getClientAuthEmail(): Promise<string | null> {
  const dev = readDevPreviewSession();
  if (isLocalRoutePreviewUnlocked() && dev) return dev.email;
  if (!hasSupabaseBrowserConfig()) return null;
  const { data } = await getSupabaseBrowser().auth.getUser();
  return data.user?.email ?? null;
}

export function isDevPreviewSignedIn() {
  return isLocalRoutePreviewUnlocked() && Boolean(readDevPreviewSession());
}

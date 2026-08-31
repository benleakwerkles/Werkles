import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { hasSupabasePublicEnv } from "@/lib/local-route-preview";

let browserClient: SupabaseClient | undefined;

export function hasSupabaseBrowserConfig() {
  return hasSupabasePublicEnv();
}

export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Werkles cannot reach account storage right now. Your work was not sent or changed.");
  }

  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
  }

  return browserClient;
}

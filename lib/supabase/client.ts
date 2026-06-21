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
    throw new Error("The steel is not connected yet. Add the Supabase URL and anon key before this door opens.");
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

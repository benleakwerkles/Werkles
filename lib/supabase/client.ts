import { createClient } from "@supabase/supabase-js";

export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("The steel is not connected yet. Add the Supabase URL and anon key before this door opens.");
  }

  return createClient(
    url,
    anonKey
  );
}

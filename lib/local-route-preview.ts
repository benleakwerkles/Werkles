/**
 * Local route preview — unlock login/membership UI on Sally without Supabase/Stripe env.
 * Set NEXT_PUBLIC_LOCAL_ROUTE_PREVIEW=1 in .env.local, or auto-enables in dev when Supabase is missing.
 */

function isPlaceholderEnv(value: string | undefined) {
  if (!value) return true;
  const lower = value.toLowerCase();
  return (
    lower.includes("replace-with") ||
    lower.includes("your-project") ||
    lower === "https://your-project.supabase.co"
  );
}

export function hasSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !isPlaceholderEnv(url) && !isPlaceholderEnv(key));
}

export function isLocalRoutePreviewUnlocked() {
  if (process.env.NODE_ENV !== "development") return false;
  if (process.env.NEXT_PUBLIC_LOCAL_ROUTE_PREVIEW === "0") return false;
  if (process.env.NEXT_PUBLIC_LOCAL_ROUTE_PREVIEW === "1") return true;
  // Default unlocked in dev so Sally can walk login/membership without env juggling.
  return true;
}

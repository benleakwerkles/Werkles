import type { SkyPookaFieldFeed } from "@/lib/skypooka/feed";

export const SKYPOOKA_FEED_CACHE_KEY = "skypooka:last-feed";

export function readCachedSkyPookaFeed(): SkyPookaFieldFeed | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SKYPOOKA_FEED_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SkyPookaFieldFeed;
    return parsed.ok ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedSkyPookaFeed(feed: SkyPookaFieldFeed) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SKYPOOKA_FEED_CACHE_KEY, JSON.stringify(feed));
  } catch {
    // Ignore quota errors on mobile browsers.
  }
}

export async function fetchSkyPookaFeed(options?: { offlineFallback?: boolean }) {
  const offlineFallback = options?.offlineFallback ?? true;

  try {
    const response = await fetch("/api/skypooka/feed", { cache: "no-store" });
    const payload = (await response.json()) as SkyPookaFieldFeed | { ok: false; error?: string };
    if (!response.ok || !("ok" in payload) || payload.ok !== true) {
      throw new Error("error" in payload ? payload.error ?? "Feed failed" : "Feed failed");
    }
    writeCachedSkyPookaFeed(payload);
    return { feed: payload, stale: false as const, error: null as string | null };
  } catch (error) {
    if (offlineFallback) {
      const cached = readCachedSkyPookaFeed();
      if (cached) {
        return {
          feed: cached,
          stale: true as const,
          error: error instanceof Error ? error.message : "Feed failed"
        };
      }
    }
    return {
      feed: null,
      stale: false as const,
      error: error instanceof Error ? error.message : "Feed failed"
    };
  }
}

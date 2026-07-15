export function harveyOperatorBridgeUrl() {
  if (typeof window === "undefined") return null;
  const hostname = window.location.hostname.toLowerCase();
  if (hostname !== "127.0.0.1" && hostname !== "localhost") return null;
  return `http://${hostname}:3002`;
}

export async function harveyOperatorBridgeReady() {
  const bridge = harveyOperatorBridgeUrl();
  if (!bridge) return false;
  try {
    const response = await fetch(`${bridge}/health`, { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

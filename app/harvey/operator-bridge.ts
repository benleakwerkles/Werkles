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

export type HarveyCommandRoute = {
  url: string;
  mode: "DOSS_LOOPBACK" | "HARVEY_CLOUD" | "SALLY_PAIRED";
  credentials: RequestCredentials;
};

export type HarveySynapseRoute = HarveyCommandRoute;
export type HarveyTaskBridgeRoute = HarveyCommandRoute;

export function harveyCommandRoute(): HarveyCommandRoute | null {
  if (typeof window === "undefined") return null;
  const bridge = harveyOperatorBridgeUrl();
  if (bridge) return { url: `${bridge}/work-orders`, mode: "DOSS_LOOPBACK", credentials: "omit" };
  return { url: "/api/harvey/work-orders", mode: "HARVEY_CLOUD", credentials: "include" };
}

export async function harveyCommandRouteReady(): Promise<HarveyCommandRoute | null> {
  const route = harveyCommandRoute();
  if (!route) return null;
  try {
    if (route.mode === "DOSS_LOOPBACK") {
      const response = await fetch(route.url.replace(/\/work-orders$/, "/health"), { cache: "no-store" });
      return response.ok ? route : null;
    }
    const response = await fetch(route.url, { cache: "no-store", credentials: route.credentials });
    if (!response.ok) return null;
    const body = await response.json();
    return body?.operator?.mode === "HARVEY_CLOUD" ? route : null;
  } catch {
    return null;
  }
}

export function harveySynapseRoute(): HarveySynapseRoute | null {
  if (typeof window === "undefined") return null;
  const bridge = harveyOperatorBridgeUrl();
  if (bridge) return { url: `${bridge}/synapse`, mode: "DOSS_LOOPBACK", credentials: "omit" };
  return { url: "/api/harvey/synapse", mode: "SALLY_PAIRED", credentials: "include" };
}

export async function harveySynapseRouteReady(): Promise<HarveySynapseRoute | null> {
  const route = harveySynapseRoute();
  if (!route) return null;
  try {
    const response = await fetch(route.url, { cache: "no-store", credentials: route.credentials });
    if (!response.ok) return null;
    const body = await response.json();
    const expectedRoute = route.mode === "DOSS_LOOPBACK" ? "DOSS_LOOPBACK" : "SALLY_PAIRED_SESSION";
    return body?.viewer?.route === expectedRoute && body?.viewer?.task_identity_proven === false ? route : null;
  } catch {
    return null;
  }
}

export function harveyTaskBridgeRoute(): HarveyTaskBridgeRoute | null {
  if (typeof window === "undefined") return null;
  const bridge = harveyOperatorBridgeUrl();
  if (bridge) return { url: `${bridge}/task-bridge`, mode: "DOSS_LOOPBACK", credentials: "omit" };
  return { url: "/api/harvey/task-bridge", mode: "SALLY_PAIRED", credentials: "include" };
}

export async function harveyTaskBridgeRouteReady(): Promise<HarveyTaskBridgeRoute | null> {
  const route = harveyTaskBridgeRoute();
  if (!route) return null;
  try {
    const response = await fetch(route.url, { cache: "no-store", credentials: route.credentials });
    if (!response.ok) return null;
    const body = await response.json();
    const expectedRoute = route.mode === "DOSS_LOOPBACK" ? "DOSS_LOOPBACK" : "SALLY_PAIRED_SESSION";
    return body?.viewer?.route === expectedRoute && body?.viewer?.task_identity_proven_by === "CODEX_THREAD_STARTED_EVENT" ? route : null;
  } catch {
    return null;
  }
}

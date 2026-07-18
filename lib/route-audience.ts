export const INTERNAL_ROUTE_ROOTS = [
  "/operator",
  "/thinkit",
  "/tinkerden",
  "/soledash",
  "/gd",
  "/nerdkle"
] as const;

export const INTERNAL_API_ROOTS = [
  "/api/operator",
  "/api/soledash",
  "/api/tinkerden",
  "/api/thinkit",
  "/api/nerdkle",
  "/api/organism",
  "/api/speaker"
] as const;

function pathMatchesRoot(pathname: string, root: string) {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return normalized === root || normalized.startsWith(`${root}/`);
}

export function isInternalRoutePath(pathname: string) {
  return INTERNAL_ROUTE_ROOTS.some((root) => pathMatchesRoot(pathname, root));
}

export function isInternalApiPath(pathname: string) {
  return INTERNAL_API_ROOTS.some((root) => pathMatchesRoot(pathname, root));
}

export function isProtectedInternalPath(pathname: string) {
  return isInternalRoutePath(pathname) || isInternalApiPath(pathname);
}

export function isLocalDevelopmentHost(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

export function shouldDenyInternalRoute(input: {
  pathname: string;
  hostname: string;
  nodeEnv: string | undefined;
  vercelEnv?: string | undefined;
  internalPreviewAccess?: string | undefined;
  hasVercelProtectionBypass?: boolean;
}) {
  if (!isProtectedInternalPath(input.pathname)) return false;
  if (input.nodeEnv === "development" && isLocalDevelopmentHost(input.hostname)) return false;
  if (
    input.vercelEnv === "preview" &&
    input.internalPreviewAccess === "enabled" &&
    input.hasVercelProtectionBypass
  ) {
    return false;
  }
  return true;
}

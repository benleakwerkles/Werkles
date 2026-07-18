const SAFE_MEMBER_RETURN_PATHS = new Set([
  "/dashboard",
  "/dashboard/profile",
  "/bellows/recommendations"
]);

export function safeMemberReturnPath(value: unknown, fallback = "/dashboard") {
  const safeFallback = SAFE_MEMBER_RETURN_PATHS.has(fallback) ? fallback : "/dashboard";
  return typeof value === "string" && SAFE_MEMBER_RETURN_PATHS.has(value) ? value : safeFallback;
}

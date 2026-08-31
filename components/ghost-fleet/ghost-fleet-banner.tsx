import { GHOST_FLEET_DISCLOSURE, isGhostFleetEnabled } from "@/lib/ghost-fleet/enabled";

export function GhostFleetBanner({ count }: { count?: number }) {
  if (!isGhostFleetEnabled()) return null;
  return (
    <p className="muted" role="note">
      {GHOST_FLEET_DISCLOSURE}
      {typeof count === "number" ? ` Fleet size: ${count}.` : ""}
    </p>
  );
}

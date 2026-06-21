import type { DenZoneId } from "@/lib/soledash/wonka-den-room/zones";

/** Zone click → work area (panel component). */
export const DEN_ZONE_CLICK_MAP: Record<
  DenZoneId,
  { panel: string; workArea: string }
> = {
  "main-desk": { panel: "TaskComposerPanel", workArea: "task composer" },
  workbench: { panel: "WorkbenchPanel", workArea: "active projects" },
  "machine-wall": { panel: "MachineWallPanel", workArea: "fleet roster" },
  "receipt-wall": { panel: "ReceiptDrawer", workArea: "receipt drawer" },
  "artifact-shelf": { panel: "ArtifactShelfPanel", workArea: "operator artifacts" },
  "pearl-shelf": { panel: "PearlShelfPanel", workArea: "crawler pearls" },
  forge: { panel: "ForgePanel", workArea: "dream projects" },
  "permission-swatter": { panel: "PermissionSwatterReceiptLog", workArea: "swatter receipt log" }
};

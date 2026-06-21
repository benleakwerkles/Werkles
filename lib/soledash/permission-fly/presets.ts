import type { PermissionFlyPreset } from "./types";

export const PERMISSION_FLY_PRESETS: PermissionFlyPreset[] = [
  {
    id: "google_drive_items_removed",
    label: "GOOGLE DRIVE ITEMS REMOVED",
    source: "Google Drive",
    severity: "high",
    classification: "human_gate",
    detail: "Items Removed — permission / approval popup while operating"
  }
];

export function presetById(id: string): PermissionFlyPreset | undefined {
  return PERMISSION_FLY_PRESETS.find((p) => p.id === id);
}

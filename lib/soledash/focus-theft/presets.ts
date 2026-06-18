import type { FocusTheftPreset } from "./types";

export const FOCUS_THEFT_PRESETS: FocusTheftPreset[] = [
  {
    id: "google_drive_items_removed",
    label: "Google Drive — Items Removed",
    source_app: "Google Drive",
    notification_text: "Items Removed",
    what_ben_was_doing: "SoleDash operator work",
    severity: "high"
  }
];

export function presetById(id: string): FocusTheftPreset | undefined {
  return FOCUS_THEFT_PRESETS.find((p) => p.id === id);
}

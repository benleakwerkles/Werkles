import type { DenZoneId } from "@/lib/soledash/wonka-den-room/zones";

export type ArtifactId =
  | "receipt-drawer"
  | "approval-registry"
  | "agent-roster"
  | "permission-swatter"
  | "crawler";

export type ArtifactShelfItem = {
  id: ArtifactId;
  label: string;
  status: string;
  owner: string;
  lastReceipt: string;
  openZone: DenZoneId;
  sourcePath: string;
};

export type ArtifactShelfSnapshot = {
  artifacts: ArtifactShelfItem[];
  loaded_at: string;
};

export const ARTIFACT_ORDER: ArtifactId[] = [
  "receipt-drawer",
  "approval-registry",
  "agent-roster",
  "permission-swatter",
  "crawler"
];

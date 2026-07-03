export type RelayArtifactKind =
  | "screenshot"
  | "screen_recording"
  | "url"
  | "localhost_url"
  | "preview_url"
  | "commit_hash"
  | "diff_summary"
  | "file_path"
  | "receipt_file"
  | "generated_report";

export type RelayArtifact = {
  kind: RelayArtifactKind;
  label: string;
  value: string;
  href: string | null;
  thumbnail: string | null;
};

export type RelayArtifactGate = {
  required: boolean;
  passed: boolean;
  allowed_artifacts: string[];
  artifact_count: number;
  blocker: string | null;
};

export type RelayReceiptStrip = {
  packetId: string | null;
  receiptPath: string | null;
  outboundPath: string | null;
  packetPath: string | null;
  success: boolean | null;
  updatedAt: string | null;
  status: string | null;
};

export type RelayCardNotes = {
  owner: string;
  machine: string;
  confidence: string;
  expectedReceipt: string;
  blocker: string | null;
  lastUpdate: string | null;
  nextAction: string;
  missionText: string;
  artifactRequired: boolean;
  artifactGate: RelayArtifactGate;
};

export type RelayCardActionKind = "approve" | "edit_route" | "needs_research" | "kill_test";

export type RelayFailureContext = {
  summary: string;
  error: string | null;
  blocker: string | null;
  stderr: string | null;
  stdout: string | null;
  status: string;
};

export type RelayResultTranslation = {
  whatHappened: string;
  whyItMatters: string;
  actionNeeded: string;
  rawLines: { label: string; value: string }[];
};

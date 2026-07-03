export type BellowsLedgerIntakeRow = {
  intakeId: string;
  state: "Received";
  createdAt: string;
  packetPath: string;
  speakerEntryPath: string;
  meaning: string;
  answeredCount: number;
  totalQuestions: number;
  headline: string;
};

export type BellowsLedgerOptionRow = {
  packetId: string;
  state: "StagedForOperator";
  action: string;
  createdAt: string;
  recommendationId: string;
  title: string;
  confidence: number;
  packetPath: string;
  speakerEntryPath: string;
  sourceMode?: string | null;
  sourceIntakeId?: string | null;
  sourcePacketPath?: string | null;
  sourceSpeakerEntryPath?: string | null;
  meaning: string;
};

export type BellowsPacketLedger = {
  intakes: BellowsLedgerIntakeRow[];
  optionPackets: BellowsLedgerOptionRow[];
};

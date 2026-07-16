export type FlockEvidenceTruth = 'COMMITTED_SNAPSHOT_NOT_LIVE';

export type FlockEvidenceRecord = Readonly<{
  id: string;
  title: string;
  summary: string;
  observedAt: string;
  sourcePath: string;
  sourceBlob: string;
  supportingSource: Readonly<{
    path: string;
    blob: string;
  }> | null;
  truth: FlockEvidenceTruth;
}>;

export type FlockEvidenceView = FlockEvidenceRecord &
  Readonly<{
    ageDays: number;
    freshness: 'STALE';
  }>;

const committedFlockEvidence: readonly FlockEvidenceRecord[] = Object.freeze([
  Object.freeze({
    id: 'relay-build-coverage-20260629',
    title: 'Relay build coverage',
    summary: '8 of 8 committed build items were recorded in the dated relay-build snapshot.',
    observedAt: '2026-06-29T00:00:00.000Z',
    sourcePath: 'source-truth-plan/references/swanson_relay_build_20260629/README.md',
    sourceBlob: '9ab5e565b232d4da3f6803d40bd7d5601a0806c5',
    supportingSource: Object.freeze({
      path: 'source-truth-plan/references/swanson_relay_build_20260629/MANIFEST.json',
      blob: 'bbda215edc3579a33a587b3358e37d31837c52e7'
    }),
    truth: 'COMMITTED_SNAPSHOT_NOT_LIVE'
  }),
  Object.freeze({
    id: 'command-dash-pending-20260628',
    title: 'Command Dash receipt queue',
    summary: 'Three packet entries were recorded as awaiting Aeye receipts.',
    observedAt: '2026-06-28T19:06:20.000Z',
    sourcePath: 'data/organism/command_dash_relay_status.json',
    sourceBlob: '3a8317936ddcc741cdf3573a83f5bdf38bfaf570',
    supportingSource: null,
    truth: 'COMMITTED_SNAPSHOT_NOT_LIVE'
  })
]);

export function getCommittedFlockEvidence(now: Date): readonly FlockEvidenceView[] {
  const nowMilliseconds = now.getTime();

  return committedFlockEvidence.map((record) =>
    Object.freeze({
      ...record,
      ageDays: Math.max(
        0,
        Math.floor((nowMilliseconds - Date.parse(record.observedAt)) / 86400000)
      ),
      freshness: 'STALE' as const
    })
  );
}

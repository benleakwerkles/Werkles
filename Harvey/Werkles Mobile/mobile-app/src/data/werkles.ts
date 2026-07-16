export type FixtureProofState = 'SAMPLE_NOT_LIVE';

export type BridgeRoute = Readonly<{
  id: string;
  label: string;
  destination: string;
  proofState: FixtureProofState;
  sampleLatency: string;
  sampleQueued: number;
}>;

export type DispatchEvent = Readonly<{
  id: string;
  title: string;
  route: string;
  timeLabel: string;
  proofState: FixtureProofState;
}>;

export const fixtureMetadata = Object.freeze({
  label: 'Static sample data',
  proofBoundary:
    'No bridge probe or receiver receipt is connected. Values are layout fixtures, not live operations.'
});

export const bridgeRoutes: readonly BridgeRoute[] = [
  {
    id: 'wonka-den',
    label: 'Wonka Den',
    destination: 'duck.bridge.wonka-den',
    proofState: 'SAMPLE_NOT_LIVE',
    sampleLatency: '42 ms',
    sampleQueued: 3
  },
  {
    id: 'aeye-workstations',
    label: 'Aeye Workstations',
    destination: 'duck.bridge.aeye-workstations-pussypod',
    proofState: 'SAMPLE_NOT_LIVE',
    sampleLatency: '88 ms',
    sampleQueued: 7
  },
  {
    id: 'medullina-handoff',
    label: 'Medullina Handoff',
    destination: 'duck.bridge.medullina-handoff',
    proofState: 'SAMPLE_NOT_LIVE',
    sampleLatency: '54 ms',
    sampleQueued: 1
  }
];

export const dispatchEvents: readonly DispatchEvent[] = [
  {
    id: 'evt-1044',
    title: 'Example payload normalized',
    route: 'Wonka Den',
    timeLabel: 'Sample 09:42',
    proofState: 'SAMPLE_NOT_LIVE'
  },
  {
    id: 'evt-1043',
    title: 'Example envelope prepared',
    route: 'Aeye Workstations',
    timeLabel: 'Sample 09:21',
    proofState: 'SAMPLE_NOT_LIVE'
  },
  {
    id: 'evt-1042',
    title: 'Example boundary note attached',
    route: 'Medullina Handoff',
    timeLabel: 'Sample 08:58',
    proofState: 'SAMPLE_NOT_LIVE'
  }
];

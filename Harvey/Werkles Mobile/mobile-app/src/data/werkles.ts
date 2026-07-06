export type RouteStatus = 'clear' | 'watch' | 'paused';

export type BridgeRoute = {
  id: string;
  label: string;
  destination: string;
  status: RouteStatus;
  latency: string;
  queued: number;
};

export type DispatchEvent = {
  id: string;
  title: string;
  route: string;
  time: string;
  state: string;
};

export const bridgeRoutes: BridgeRoute[] = [
  {
    id: 'wonka-den',
    label: 'Wonka Den',
    destination: 'duck.bridge.wonka-den',
    status: 'clear',
    latency: '42 ms',
    queued: 3
  },
  {
    id: 'aeye-workstations',
    label: 'Aeye Workstations',
    destination: 'duck.bridge.aeye-workstations-pussypod',
    status: 'watch',
    latency: '88 ms',
    queued: 7
  },
  {
    id: 'medullina-handoff',
    label: 'Medullina Handoff',
    destination: 'duck.bridge.medullina-handoff',
    status: 'clear',
    latency: '54 ms',
    queued: 1
  }
];

export const dispatchEvents: DispatchEvent[] = [
  {
    id: 'evt-1044',
    title: 'Duck payload normalized',
    route: 'Wonka Den',
    time: '09:42',
    state: 'Delivered'
  },
  {
    id: 'evt-1043',
    title: 'Bridge envelope signed',
    route: 'Aeye Workstations',
    time: '09:21',
    state: 'Queued'
  },
  {
    id: 'evt-1042',
    title: 'Sandbox boundary note attached',
    route: 'Medullina Handoff',
    time: '08:58',
    state: 'Delivered'
  }
];


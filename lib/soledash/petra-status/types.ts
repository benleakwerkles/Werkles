export type PetraStatusSnapshot = {
  primary: string;
  machine: string;
  last_verdict: string;
  last_spof: string;
  heartbeat: string;
  heartbeat_at: string | null;
  loaded_at: string;
};

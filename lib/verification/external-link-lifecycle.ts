export const EXTERNAL_LINK_LIFECYCLE_STATES = [
  "loading",
  "open",
  "exited",
  "failed",
  "completed-not-saved"
] as const;

export type ExternalLinkLifecycleState =
  (typeof EXTERNAL_LINK_LIFECYCLE_STATES)[number];

export interface ExternalLinkLifecycleSnapshot {
  readonly state: ExternalLinkLifecycleState;
}

const TERMINAL_STATES: readonly ExternalLinkLifecycleState[] = [
  "exited",
  "failed",
  "completed-not-saved"
];

const ALLOWED_TRANSITIONS: Readonly<Record<ExternalLinkLifecycleState, readonly ExternalLinkLifecycleState[]>> = {
  loading: ["open", "failed"],
  open: ["exited", "failed", "completed-not-saved"],
  exited: [],
  failed: [],
  "completed-not-saved": []
};

function requireState(value: unknown): asserts value is ExternalLinkLifecycleState {
  if (
    typeof value !== "string" ||
    !EXTERNAL_LINK_LIFECYCLE_STATES.includes(value as ExternalLinkLifecycleState)
  ) {
    throw new TypeError("external_link_lifecycle.invalid_state");
  }
}

function requireSnapshot(value: unknown): asserts value is ExternalLinkLifecycleSnapshot {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("external_link_lifecycle.invalid_snapshot");
  }
  const keys = Object.keys(value);
  if (keys.length !== 1 || keys[0] !== "state") {
    throw new TypeError("external_link_lifecycle.unsafe_snapshot_fields");
  }
  requireState((value as { state?: unknown }).state);
}

function snapshot(state: ExternalLinkLifecycleState): ExternalLinkLifecycleSnapshot {
  return Object.freeze({ state });
}

export function beginExternalLinkLifecycle(): ExternalLinkLifecycleSnapshot {
  return snapshot("loading");
}

export function transitionExternalLinkLifecycle(
  current: ExternalLinkLifecycleSnapshot,
  nextState: ExternalLinkLifecycleState
): ExternalLinkLifecycleSnapshot {
  requireSnapshot(current);
  requireState(nextState);
  if (!ALLOWED_TRANSITIONS[current.state].includes(nextState)) {
    throw new TypeError("external_link_lifecycle.invalid_transition");
  }
  return snapshot(nextState);
}

export function isExternalLinkTerminalState(
  state: ExternalLinkLifecycleState
): boolean {
  requireState(state);
  return TERMINAL_STATES.includes(state);
}

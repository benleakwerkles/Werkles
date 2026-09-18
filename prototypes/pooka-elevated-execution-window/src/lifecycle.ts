import type { SessionPhase, WorkerSession } from "./types.ts";

const TERMINAL: SessionPhase[] = ["completed", "expired", "shutdown"];

export function isTerminal(phase: SessionPhase): boolean {
  return TERMINAL.includes(phase);
}

export function markElevated(session: WorkerSession, at = new Date()): WorkerSession {
  if (isTerminal(session.phase)) {
    throw new Error(`cannot_elevate_from_${session.phase}`);
  }
  return {
    ...session,
    phase: "elevated",
    elevatedAt: at.toISOString()
  };
}

export function markBound(session: WorkerSession): WorkerSession {
  if (session.phase !== "elevated" && session.phase !== "bound") {
    throw new Error(`cannot_bind_from_${session.phase}`);
  }
  return { ...session, phase: "bound" };
}

export function markExecuting(session: WorkerSession): WorkerSession {
  if (session.phase !== "bound" && session.phase !== "executing") {
    throw new Error(`cannot_execute_from_${session.phase}`);
  }
  return { ...session, phase: "executing" };
}

export function completeSession(session: WorkerSession, at = new Date()): WorkerSession {
  return {
    ...session,
    phase: "completed",
    completedAt: at.toISOString(),
    revokedForNewWork: true
  };
}

export function expireSession(session: WorkerSession, at = new Date()): WorkerSession {
  return {
    ...session,
    phase: "expired",
    completedAt: at.toISOString(),
    revokedForNewWork: true
  };
}

export function shutdownSession(session: WorkerSession, at = new Date()): WorkerSession {
  return {
    ...session,
    phase: "shutdown",
    completedAt: at.toISOString(),
    revokedForNewWork: true
  };
}

/**
 * Explicit revocation for NEW work only.
 * Already-reserved effects remain executable until reservation TTL.
 */
export function revokeNewWorkOnly(session: WorkerSession): WorkerSession {
  return { ...session, revokedForNewWork: true };
}

export function evaluateSessionClock(
  session: WorkerSession,
  now = new Date()
): WorkerSession {
  if (isTerminal(session.phase)) return session;
  if (now.toISOString() >= session.scope.sessionExpiresAt) {
    return expireSession(session, now);
  }
  return session;
}

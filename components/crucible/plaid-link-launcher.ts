"use client";

import {
  beginExternalLinkLifecycle,
  transitionExternalLinkLifecycle,
  type ExternalLinkLifecycleSnapshot,
  type ExternalLinkLifecycleState
} from "../../lib/verification/external-link-lifecycle.ts";

declare global {
  interface Window {
    Plaid?: {
      create: (config: {
        token: string;
        onSuccess: (publicToken: unknown, ...discardedSdkValues: unknown[]) => void;
        onExit: (error?: unknown, ...discardedSdkValues: unknown[]) => void;
      }) => unknown;
    };
  }
}

type PlaidCreate = NonNullable<Window["Plaid"]>["create"];

const PLAID_SCRIPT_SRC = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
const SCRIPT_LOAD_TIMEOUT_MS = 15_000;
const LINK_SESSION_TIMEOUT_MS = 5 * 60_000;
let activeLaunchReservation: object | null = null;

function safeLaunchError(): Error {
  return new Error("Plaid Link failed safely.");
}

function waitForPlaidScript(script: Element): {
  promise: Promise<void>;
  fail: () => void;
} {
  let fail = () => {};
  const promise = new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (loaded: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      try {
        script.removeEventListener("load", onLoad);
        script.removeEventListener("error", onError);
      } catch {
        // A malformed script element cannot prevent sanitized settlement.
      }
      let sdkAvailable = false;
      try {
        sdkAvailable = Boolean(window.Plaid);
      } catch {
        sdkAvailable = false;
      }
      if (loaded && sdkAvailable) resolve();
      else {
        try {
          script.remove();
        } catch {
          // Removal is best-effort; failure still settles and releases the launch lock.
        }
        reject(safeLaunchError());
      }
    };
    const onLoad = () => finish(true);
    const onError = () => finish(false);
    fail = onError;
    const timeout = setTimeout(() => finish(false), SCRIPT_LOAD_TIMEOUT_MS);
    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
  });
  return { promise, fail };
}

async function loadPlaidScript(): Promise<void> {
  if (window.Plaid) return;

  const existing = document.querySelector(`script[src="${PLAID_SCRIPT_SRC}"]`);
  if (existing) {
    await waitForPlaidScript(existing).promise;
    return;
  }

  const script = document.createElement("script");
  script.src = PLAID_SCRIPT_SRC;
  script.async = true;
  const watcher = waitForPlaidScript(script);
  try {
    document.body.appendChild(script);
  } catch {
    watcher.fail();
  }
  await watcher.promise;
}

export async function launchPlaidLink(
  linkToken: string,
  onSuccess: () => void,
  onExit?: () => void,
  onLifecycle?: (snapshot: ExternalLinkLifecycleSnapshot) => void
): Promise<void> {
  if (activeLaunchReservation) throw new Error("Plaid Link is already open.");
  const reservation = {};
  activeLaunchReservation = reservation;

  let lifecycle = beginExternalLinkLifecycle();
  const notify = () => {
    try {
      onLifecycle?.(lifecycle);
    } catch {
      // Lifecycle observers receive sanitized snapshots and cannot control SDK cleanup.
    }
  };
  const move = (state: ExternalLinkLifecycleState) => {
    lifecycle = transitionExternalLinkLifecycle(lifecycle, state);
    notify();
  };
  notify();

  const launch = (async () => {
    if (typeof linkToken !== "string" || linkToken.trim().length === 0) {
      move("failed");
      throw safeLaunchError();
    }

    try {
      await loadPlaidScript();
    } catch {
      move("failed");
      throw safeLaunchError();
    }
    let createLink: PlaidCreate;
    try {
      const plaid = window.Plaid;
      if (!plaid || typeof plaid.create !== "function") throw safeLaunchError();
      createLink = plaid.create.bind(plaid);
    } catch {
      move("failed");
      throw safeLaunchError();
    }

    await new Promise<void>((resolve, reject) => {
      let terminal = false;
      let openInvoked = false;
      const fail = () => {
        if (terminal) return;
        terminal = true;
        clearTimeout(sessionTimeout);
        move("failed");
        reject(safeLaunchError());
      };
      const complete = (
        state: "exited" | "completed-not-saved",
        callback?: () => void
      ) => {
        if (terminal) return;
        terminal = true;
        try {
          callback?.();
        } catch {
          clearTimeout(sessionTimeout);
          move("failed");
          reject(safeLaunchError());
          return;
        }
        clearTimeout(sessionTimeout);
        move(state);
        resolve();
      };
      const sessionTimeout = setTimeout(() => fail(), LINK_SESSION_TIMEOUT_MS);

      let handler: unknown;
      try {
        handler = createLink({
          token: linkToken,
          onSuccess: (_publicToken, ..._discardedSdkValues) => {
            if (terminal) return;
            if (!openInvoked || lifecycle.state !== "open") {
              fail();
              return;
            }
            if (typeof _publicToken !== "string" || _publicToken.trim().length === 0) {
              fail();
              return;
            }
            complete("completed-not-saved", onSuccess);
          },
          onExit: (_error, ..._discardedSdkValues) => {
            if (terminal) return;
            if (!openInvoked || lifecycle.state !== "open") {
              fail();
              return;
            }
            if (_error !== null && _error !== undefined) {
              fail();
              return;
            }
            complete("exited", onExit);
          }
        });
      } catch {
        fail();
        return;
      }

      if (terminal) return;

      let openLink: () => void;
      try {
        if (handler === null || typeof handler !== "object") throw safeLaunchError();
        const candidate = (handler as { open?: unknown }).open;
        if (typeof candidate !== "function") throw safeLaunchError();
        openLink = () => candidate.call(handler);
      } catch {
        fail();
        return;
      }

      move("open");
      if (terminal) return;
      openInvoked = true;
      try {
        openLink();
      } catch {
        fail();
      }
    });
  })();

  try {
    await launch;
  } finally {
    if (activeLaunchReservation === reservation) activeLaunchReservation = null;
  }
}

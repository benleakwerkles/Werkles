"use client";

import { useEffect, useState, type ReactNode } from "react";

import type { RelayFailureContext } from "@/lib/soledash/automatica-relay/artifact-types";

const RETRY_COOLDOWN_SEC = 3;

function FailureOutput({ context }: { context: RelayFailureContext }) {
  return (
    <div className="sd-failure-retry__panel" role="region" aria-label="Failure output">
      <p className="sd-failure-retry__summary">{context.summary}</p>
      <dl className="sd-failure-retry__streams">
        <div>
          <dt>Status</dt>
          <dd>{context.status}</dd>
        </div>
        {context.error ? (
          <div className="sd-failure-retry__wide">
            <dt>Error</dt>
            <dd>
              <pre className="sd-failure-retry__pre">{context.error}</pre>
            </dd>
          </div>
        ) : null}
        {context.stderr ? (
          <div className="sd-failure-retry__wide">
            <dt>stderr</dt>
            <dd>
              <pre className="sd-failure-retry__pre">{context.stderr}</pre>
            </dd>
          </div>
        ) : null}
        {context.stdout ? (
          <div className="sd-failure-retry__wide">
            <dt>stdout</dt>
            <dd>
              <pre className="sd-failure-retry__pre">{context.stdout}</pre>
            </dd>
          </div>
        ) : null}
        {context.blocker && context.blocker !== context.error ? (
          <div className="sd-failure-retry__wide">
            <dt>Blocker</dt>
            <dd>
              <pre className="sd-failure-retry__pre">{context.blocker}</pre>
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

export function FailureRetryGate({
  context,
  retryLabel,
  busyLabel,
  busy,
  onRetry,
  buttonClassName,
  renderRetry
}: {
  context: RelayFailureContext;
  retryLabel: string;
  busyLabel?: string;
  busy?: boolean;
  onRetry: () => void;
  buttonClassName?: string;
  renderRetry?: (props: { ready: boolean; busy: boolean; onRetry: () => void }) => ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!expanded) {
      setCooldown(0);
      return;
    }

    const started = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000);
      const remaining = Math.max(0, RETRY_COOLDOWN_SEC - elapsed);
      setCooldown(remaining);
      if (remaining === 0) window.clearInterval(timer);
    }, 250);

    return () => window.clearInterval(timer);
  }, [expanded]);

  function openFailure() {
    setExpanded(true);
    setCooldown(RETRY_COOLDOWN_SEC);
  }

  function closeFailure() {
    setExpanded(false);
  }

  const retryReady = expanded && cooldown === 0 && !busy;

  return (
    <div className="sd-failure-retry">
      {!expanded ? (
        <button type="button" className="sd-failure-retry__expander" onClick={openFailure}>
          Show Failure
        </button>
      ) : (
        <>
          <div className="sd-failure-retry__head">
            <p className="sd-failure-retry__label">Failure context</p>
            <button type="button" className="sd-failure-retry__collapse" onClick={closeFailure}>
              Hide
            </button>
          </div>
          <FailureOutput context={context} />
        </>
      )}

      {expanded && cooldown > 0 ? (
        <button type="button" className={`sd-failure-retry__retry sd-failure-retry__retry--wait ${buttonClassName ?? ""}`} disabled>
          Retry in {cooldown}s
        </button>
      ) : renderRetry ? (
        renderRetry({ ready: retryReady, busy: Boolean(busy), onRetry })
      ) : retryReady ? (
        <button
          type="button"
          className={`sd-failure-retry__retry ${buttonClassName ?? ""}`}
          disabled={busy}
          onClick={onRetry}
        >
          {busy ? (busyLabel ?? "…") : retryLabel}
        </button>
      ) : null}
    </div>
  );
}

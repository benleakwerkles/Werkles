"use client";

import type { MockTestFailureMode, MockTestResult, MockTestRoute } from "@/protocol/index";
import {
  FAILURE_MODE_OPTIONS,
  MOCK_TEST_ROUTE_LIST
} from "@/lib/soledash/mock-test/client-runner";

export function MockTestBanner({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <section className="sd-mock-banner" aria-label="Mock test mode">
      <p className="sd-mock-banner__title">MOCK TEST MODE</p>
      <p className="sd-mock-banner__detail">
        Actions simulate transport and generate receipts. No external machine command executed.
      </p>
    </section>
  );
}

export function MockTestHarness({
  busy,
  failureMode,
  onFailureModeChange,
  lastResult,
  onRunTest
}: {
  busy: boolean;
  failureMode: MockTestFailureMode;
  onFailureModeChange: (mode: MockTestFailureMode) => void;
  lastResult: MockTestResult | null;
  onRunTest: (route: MockTestRoute) => void;
}) {
  return (
    <section className="sd-mock-harness" aria-label="Mock test harness">
      <div className="sd-mock-harness__head">
        <h2 className="sd-mock-harness__title">Mock Test Harness</h2>
        <span className="sd-mock-harness__badge">MOCK TEST</span>
      </div>

      <div className="sd-mock-harness__failure">
        <label className="sd-mock-harness__failure-label" htmlFor="sd-mock-failure-mode">
          Failure simulation
        </label>
        <select
          id="sd-mock-failure-mode"
          className="sd-mock-harness__failure-select"
          value={failureMode}
          disabled={busy}
          onChange={(e) => onFailureModeChange(e.target.value as MockTestFailureMode)}
        >
          {FAILURE_MODE_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="sd-mock-harness__routes">
        <p className="sd-mock-harness__routes-label">Run Mock Test</p>
        <div className="sd-mock-harness__route-row">
          {MOCK_TEST_ROUTE_LIST.map((route) => (
            <button
              key={route.id}
              type="button"
              className="sd-mock-harness__route-btn"
              disabled={busy}
              onClick={() => onRunTest(route.id)}
            >
              {route.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sd-mock-harness__result" aria-label="Last mock test">
        <p className="sd-mock-harness__result-label">Last Mock Test</p>
        {lastResult ? (
          <dl className="sd-mock-harness__result-dl">
            <div>
              <dt>Action</dt>
              <dd>{lastResult.action}</dd>
            </div>
            <div>
              <dt>Route</dt>
              <dd>{lastResult.route.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span className={`fm-receipt-status fm-receipt-status--${lastResult.status}`}>
                  {lastResult.status}
                </span>
                <span className="sd-mock-harness__sim-badge">simulated: true</span>
              </dd>
            </div>
            <div>
              <dt>Receipt id</dt>
              <dd className="fm-mono">{lastResult.receipt_id}</dd>
            </div>
            <div>
              <dt>Would happen live</dt>
              <dd>{lastResult.would_happen_live}</dd>
            </div>
            <div>
              <dt>Why simulated</dt>
              <dd>{lastResult.why_simulated}</dd>
            </div>
            <div>
              <dt>Written to</dt>
              <dd className="fm-mono">
                {lastResult.client_only ? "CLIENT-ONLY MOCK RECEIPT" : lastResult.written_to ?? "—"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="sd-mock-harness__result-empty">
            No mock test yet — click any Run Mock Test button or route action.
          </p>
        )}
      </div>
    </section>
  );
}

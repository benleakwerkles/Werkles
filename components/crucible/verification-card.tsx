import type { CrucibleCheck, CrucibleState } from "@/lib/crucible";
import { crucibleStateCopy } from "@/lib/crucible";
import { accountSelectionTruthFor } from "@/lib/crucible-account-selection-truth";
import { crucibleCardAction } from "@/lib/crucible-card-action";
import { exampleFundsReceipt } from "@/lib/crucible-example-funds-receipt";
import { plaidExperienceTruthFor } from "@/lib/crucible-plaid-experience-truth";
import { proofBoundaryFor } from "@/lib/crucible-proof-boundaries";
import {
  resolveProviderReadiness,
  type ProviderRuntimeAvailability
} from "@/lib/crucible-provider-readiness";
import { SiteIcon } from "@/components/foundry/site-icon";
import { crucibleIconId } from "@/lib/site-icons";

type VerificationCardProps = {
  check: CrucibleCheck;
  state?: CrucibleState;
  onStart?: (check: CrucibleCheck) => void;
  busy?: boolean;
  previewDisabled?: boolean;
  walkthroughReadOnly?: boolean;
  providerRuntime?: ProviderRuntimeAvailability;
};

export function VerificationCard({
  check,
  state = check.state as CrucibleState,
  onStart,
  busy = false,
  previewDisabled = false,
  walkthroughReadOnly = false,
  providerRuntime = "unknown"
}: VerificationCardProps) {
  const boundary = proofBoundaryFor(check.key);
  const accountSelectionTruth = accountSelectionTruthFor(check.key);
  const action = crucibleCardAction({
    state,
    checkKey: check.key,
    checkTitle: check.title,
    defaultLabel: check.cta,
    hasRoute: Boolean(check.route),
    hasHandler: Boolean(onStart),
    busy,
    previewDisabled,
    walkthroughReadOnly,
    runtimeUnavailable: providerRuntime === "unavailable"
  });
  const plaidExperienceTruth = plaidExperienceTruthFor(check.key, action.enabled);
  const providerReadiness = resolveProviderReadiness(check.providerReadiness, {
    walkthroughReadOnly,
    runtime: providerRuntime
  });
  const whatHappensNext =
    providerReadiness.status === "test_available" || providerReadiness.status === "sandbox_demo_available"
      ? "Choose the button below to open the test flow. A dated result exists only after the provider completes its check and Werkles receives a valid return; viewing this card proves nothing."
      : providerReadiness.status === "walkthrough_read_only"
        ? "You can review this boundary now. Running the test later requires a connected test member account; viewing this page does not contact a provider or create a result."
        : "Nothing runs from this card today. Its status names what must be connected or cleared before a member can begin this check.";

  return (
    <details id={`check-${check.key}`} className="ops-card verification-workflow-card">
      <summary className="verification-workflow-card__summary">
        <SiteIcon icon={crucibleIconId(check.key)} size="lg" className="verification-card-icon" />
        <span className="verification-workflow-card__heading">
          <span className="plan-kicker">{check.price}</span>
          <strong>{check.title}</strong>
          <small>{check.detail}</small>
        </span>
        <span className="verification-workflow-card__status">
          <span>{walkthroughReadOnly && check.route ? "Connected test account required" : crucibleStateCopy[state]}</span>
          <small>{providerReadiness.label}</small>
        </span>
        <span className="verification-workflow-card__toggle" aria-hidden="true">Review check</span>
      </summary>
      <div className="verification-workflow-card__body">
        <div className="verification-card-meta">
          <span>{check.stores}</span>
          <span data-provider-readiness={providerReadiness.status}>
            {providerReadiness.label} · {providerReadiness.detail}
          </span>
        </div>
        <dl className="verification-proof-boundary" aria-label={`${check.title} proof boundary`}>
          <div>
            <dt>What a completed check can establish</dt>
            <dd>{boundary.establishes}</dd>
          </div>
          <div>
            <dt>Cannot establish</dt>
            <dd>{boundary.doesNotEstablish}</dd>
          </div>
          <div>
            <dt>What happens next</dt>
            <dd>{whatHappensNext}</dd>
          </div>
        </dl>
        {accountSelectionTruth ? (
          <aside className="verification-account-selection-truth" aria-label="Plaid account selection">
            <strong>{accountSelectionTruth.heading}</strong>
            <p>{accountSelectionTruth.body}</p>
          </aside>
        ) : null}
        {plaidExperienceTruth ? <p className="muted verification-plaid-experience-truth" role="note">{plaidExperienceTruth}</p> : null}
        {check.key === "funds" ? (
          <figure className="verification-example-receipt" aria-labelledby="fictional-funds-receipt-title">
            <figcaption id="fictional-funds-receipt-title">{exampleFundsReceipt.title}</figcaption>
            <p role="note">{exampleFundsReceipt.disclaimer}</p>
            <details>
              <summary>View the six-field fictional example</summary>
              <dl>
                {exampleFundsReceipt.fields.map((field) => (
                  <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>
                ))}
              </dl>
            </details>
          </figure>
        ) : null}
        <button
          className={action.emphasis === "primary" ? "button button-dark" : "button button-outline"}
          type="button"
          disabled={!action.enabled}
          onClick={() => onStart?.(check)}
        >
          {action.label}
        </button>
      </div>
    </details>
  );
}

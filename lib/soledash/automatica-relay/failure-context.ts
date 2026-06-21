import type { RelayFailureContext } from "./artifact-types";
import type { RelayCardView, RelayReceipt } from "./types";

type ReceiptWithStreams = RelayReceipt & {
  stdout?: string | null;
  stderr?: string | null;
};

export function isFailedRelayCard(card: Pick<RelayCardView, "state" | "receipt" | "artifactGate">): boolean {
  if (card.state === "EXPLODED" || card.state === "BLOCKED") return true;
  if (card.receipt.success === false) return true;
  if (card.state === "RECEIPT RETURNED" && !card.artifactGate.passed) return true;
  return false;
}

export function relayRequiresFailureGate(
  card: Pick<RelayCardView, "state" | "receipt" | "artifactGate" | "failureContext">
): boolean {
  return Boolean(card.failureContext) && isFailedRelayCard(card);
}

export function buildFailureContext(
  card: Pick<RelayCardView, "state" | "blocker" | "artifactGate">,
  receipt: RelayReceipt | null
): RelayFailureContext | null {
  if (
    !isFailedRelayCard({
      state: card.state,
      artifactGate: card.artifactGate,
      receipt: { success: receipt?.success ?? null } as RelayCardView["receipt"]
    })
  ) {
    return null;
  }

  const ext = receipt as ReceiptWithStreams | null;
  const error = ext?.error?.trim() || null;
  const blocker = card.blocker?.trim() || ext?.blocker?.trim() || null;
  const stderr = ext?.stderr?.trim() || null;
  const stdout = ext?.stdout?.trim() || null;
  const status = ext?.status ?? card.state;

  const summaryParts = [error, blocker, ext?.next_missing_integration?.trim()].filter(Boolean);
  const summary =
    summaryParts.length > 0
      ? summaryParts.join(" · ")
      : `${status} — open failure output before retry`;

  return {
    summary,
    error,
    blocker,
    stderr,
    stdout,
    status
  };
}

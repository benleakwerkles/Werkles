import type { ReturnReceiptCorrelation } from './sshOnboarding';

export type FlockProofState =
  | 'NOT_RECEIVED'
  | 'RECEIVED_NOT_COMPLETED'
  | 'COMPLETED_RECEIPT_PROVEN'
  | 'BLOCKER_RECEIPT_PROVEN';

export type FlockProofLifecycle = Readonly<{
  state: FlockProofState;
  seenReceiptIds: readonly string[];
  accepted: boolean;
  reason: string;
}>;

const terminalStates: readonly FlockProofState[] = [
  'COMPLETED_RECEIPT_PROVEN',
  'BLOCKER_RECEIPT_PROVEN'
];

const stateRank: Record<FlockProofState, number> = {
  NOT_RECEIVED: 0,
  RECEIVED_NOT_COMPLETED: 1,
  COMPLETED_RECEIPT_PROVEN: 2,
  BLOCKER_RECEIPT_PROVEN: 2
};

export const initialFlockProofLifecycle: FlockProofLifecycle = Object.freeze({
  state: 'NOT_RECEIVED',
  seenReceiptIds: Object.freeze([]),
  accepted: false,
  reason: 'No correlated receiver receipt has been accepted.'
});

export function reduceFlockProofLifecycle(
  current: FlockProofLifecycle,
  correlation: ReturnReceiptCorrelation
): FlockProofLifecycle {
  if (correlation.status !== 'CORRELATED' || correlation.receipt === null) {
    return Object.freeze({
      ...current,
      accepted: false,
      reason:
        correlation.status === 'REJECTED'
          ? 'Rejected input cannot advance proof state.'
          : 'No receiver receipt is available.'
    });
  }

  const { receipt } = correlation;

  if (current.seenReceiptIds.includes(receipt.receiptId)) {
    return Object.freeze({
      ...current,
      accepted: false,
      reason: 'Replay rejected: this receipt ID was already processed.'
    });
  }

  if (terminalStates.includes(current.state)) {
    return Object.freeze({
      ...current,
      accepted: false,
      reason: 'Terminal proof is immutable; later receipts cannot change it.'
    });
  }

  if (stateRank[receipt.proofState] <= stateRank[current.state]) {
    return Object.freeze({
      ...current,
      accepted: false,
      reason: 'Backward or non-advancing proof transition rejected.'
    });
  }

  return Object.freeze({
    state: receipt.proofState,
    seenReceiptIds: Object.freeze([...current.seenReceiptIds, receipt.receiptId]),
    accepted: true,
    reason: 'Correlated receipt advanced the proof lifecycle monotonically.'
  });
}

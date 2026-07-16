import { strict as assert } from 'node:assert';
import test from 'node:test';

import { createLocalDuckDraftReceipt } from './duckDraft';
import {
  initialFlockProofLifecycle,
  reduceFlockProofLifecycle
} from './flockProof';
import { getCommittedFlockEvidence } from './flockRelay';
import {
  correlateReturnReceipt,
  createSshKeyTitle,
  createSshOnboardingReceipt,
  parseManualReturnReceipt,
  validateMachineName
} from './sshOnboarding';
import type {
  SshOnboardingReceipt,
  SshOnboardingReturnReceipt
} from './sshOnboarding';

const createdAt = new Date('2026-07-16T12:00:00.000Z');

function createReturnedReceipt(
  request: SshOnboardingReceipt,
  receiptId: string,
  proofState: SshOnboardingReturnReceipt['proofState']
): SshOnboardingReturnReceipt {
  return {
    receiptId,
    requestId: request.requestId,
    returnedAt: '2026-07-16T12:05:00.000Z',
    proofState,
    source: 'UNTRUSTED_MANUAL_INPUT',
    evidenceReference: 'local-contract-test',
    machineName: request.machineName,
    keyTitle: request.keyTitle,
    githubAccount: request.githubAccount,
    repository: request.repository,
    hostAlias: request.hostAlias,
    remote: request.remote,
    originReturnConfirmed: proofState !== 'RECEIVED_NOT_COMPLETED'
  };
}

test('machine names normalize and produce deterministic key titles', () => {
  const validation = validateMachineName('  Doss   Lab-2  ');

  assert.equal(validation.isValid, true);
  assert.equal(validation.normalized, 'Doss Lab-2');
  assert.equal(
    createSshKeyTitle(validation.normalized, createdAt),
    'Harvey · Doss Lab-2 · 2026-07-16'
  );
  assert.equal(validateMachineName('-bad').isValid, false);
});

test('manual receipt parsing is bounded to one JSON object', () => {
  assert.deepEqual(parseManualReturnReceipt('{"receiptId":"one"}'), {
    receiptId: 'one'
  });
  assert.throws(() => parseManualReturnReceipt('[]'), /JSON object/);
  assert.throws(
    () => parseManualReturnReceipt('{"value":"' + 'x'.repeat(10000) + '"}'),
    /10,000/
  );
});

test('return receipt correlation rejects extra and mismatched fields', () => {
  const request = createSshOnboardingReceipt('Doss', createdAt);
  const valid = createReturnedReceipt(
    request,
    'receipt-received',
    'RECEIVED_NOT_COMPLETED'
  );

  assert.equal(correlateReturnReceipt(request, valid).status, 'CORRELATED');
  assert.equal(
    correlateReturnReceipt(request, { ...valid, unexpected: true }).status,
    'REJECTED'
  );
  assert.equal(
    correlateReturnReceipt(request, { ...valid, requestId: 'wrong' }).status,
    'REJECTED'
  );
});

test('Duck receipts reject secrets, excessive size, and excessive depth', () => {
  assert.throws(
    () =>
      createLocalDuckDraftReceipt(
        '{"work":"sync","nested":{"api_key":"never"}}',
        createdAt
      ),
    /sensitive field/
  );
  assert.throws(
    () =>
      createLocalDuckDraftReceipt(
        '{"value":"' + 'x'.repeat(10000) + '"}',
        createdAt
      ),
    /10,000/
  );

  let nested: Record<string, unknown> = { leaf: true };
  for (let index = 0; index < 9; index += 1) {
    nested = { next: nested };
  }

  assert.throws(
    () => createLocalDuckDraftReceipt(JSON.stringify(nested), createdAt),
    /eight levels/
  );

  const receipt = createLocalDuckDraftReceipt(
    '{"work":"sync","priority":"normal"}',
    createdAt
  );
  assert.deepEqual(receipt.payloadSummary.topLevelKeys, ['priority', 'work']);
  assert.equal('payload' in receipt, false);
});

test('Flock lifecycle rejects replay, backward, and post-terminal changes', () => {
  const request = createSshOnboardingReceipt('Doss', createdAt);
  const receivedCorrelation = correlateReturnReceipt(
    request,
    createReturnedReceipt(
      request,
      'receipt-received',
      'RECEIVED_NOT_COMPLETED'
    )
  );
  const received = reduceFlockProofLifecycle(
    initialFlockProofLifecycle,
    receivedCorrelation
  );

  assert.equal(received.state, 'RECEIVED_NOT_COMPLETED');
  assert.equal(received.accepted, true);

  const replay = reduceFlockProofLifecycle(received, receivedCorrelation);
  assert.equal(replay.accepted, false);
  assert.equal(replay.state, 'RECEIVED_NOT_COMPLETED');

  const nonAdvancing = reduceFlockProofLifecycle(
    received,
    correlateReturnReceipt(
      request,
      createReturnedReceipt(
        request,
        'receipt-received-again',
        'RECEIVED_NOT_COMPLETED'
      )
    )
  );
  assert.equal(nonAdvancing.accepted, false);

  const completed = reduceFlockProofLifecycle(
    received,
    correlateReturnReceipt(
      request,
      createReturnedReceipt(
        request,
        'receipt-completed',
        'COMPLETED_RECEIPT_PROVEN'
      )
    )
  );
  assert.equal(completed.state, 'COMPLETED_RECEIPT_PROVEN');

  const postTerminal = reduceFlockProofLifecycle(
    completed,
    correlateReturnReceipt(
      request,
      createReturnedReceipt(
        request,
        'receipt-blocker',
        'BLOCKER_RECEIPT_PROVEN'
      )
    )
  );
  assert.equal(postTerminal.accepted, false);
  assert.equal(postTerminal.state, 'COMPLETED_RECEIPT_PROVEN');
});

test('committed Flock evidence remains stale and provenance-backed', () => {
  const evidence = getCommittedFlockEvidence(
    new Date('2026-07-16T00:00:00.000Z')
  );

  assert.equal(evidence.length, 2);
  assert.equal(evidence[0].truth, 'COMMITTED_SNAPSHOT_NOT_LIVE');
  assert.equal(evidence[0].freshness, 'STALE');
  assert.equal(evidence[0].ageDays, 17);
  assert.match(evidence[0].sourceBlob, /^[a-f0-9]{40}$/);
});

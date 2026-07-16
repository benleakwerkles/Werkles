export type SshOnboardingProofState =
  | 'DRAFT'
  | 'CREATED_NOT_DISPATCHED'
  | 'QUEUED_NOT_DELIVERED'
  | 'RECEIVED_NOT_COMPLETED'
  | 'COMPLETED_RECEIPT_PROVEN'
  | 'BLOCKER_RECEIPT_PROVEN';

type ProofStatePresentation = {
  label: string;
  detail: string;
};

export const proofStatePresentation: Record<
  SshOnboardingProofState,
  ProofStatePresentation
> = {
  DRAFT: {
    label: 'Draft',
    detail: 'No local request receipt exists.'
  },
  CREATED_NOT_DISPATCHED: {
    label: 'Created · not dispatched',
    detail: 'A local receipt exists. No machine agent has received it.'
  },
  QUEUED_NOT_DELIVERED: {
    label: 'Queued · not delivered',
    detail: 'Transport accepted the request, but receiver proof is missing.'
  },
  RECEIVED_NOT_COMPLETED: {
    label: 'Received · not completed',
    detail: 'The receiver acknowledged the request, but no completion receipt exists.'
  },
  COMPLETED_RECEIPT_PROVEN: {
    label: 'Completed · receipt proven',
    detail: 'Completion is backed by a returned receiver receipt.'
  },
  BLOCKER_RECEIPT_PROVEN: {
    label: 'Blocked · receipt proven',
    detail: 'A returned receiver receipt identifies the blocker.'
  }
};

export const canonicalSshTarget = {
  account: 'benleakwerkles',
  repository: 'benleakwerkles/Werkles',
  hostAlias: 'github-benleakwerkles',
  remote: 'git@github-benleakwerkles:benleakwerkles/Werkles.git'
} as const;

export type MachineNameValidation = Readonly<{
  normalized: string;
  isValid: boolean;
  issue: string | null;
}>;

export type SshTargetIdentity = Readonly<{
  githubAccount: string;
  repository: string;
  hostAlias: string;
  remote: string;
}>;

export type SshMachineIdentityObservation = SshTargetIdentity &
  Readonly<{
    requestId: string;
    machineName: string;
  }>;

export type CanonicalIdentityField = keyof SshMachineIdentityObservation;

export type CanonicalIdentityMismatch = Readonly<{
  field: CanonicalIdentityField;
  expected: string;
  actual: string;
}>;

export type CanonicalIdentityCheck = Readonly<{
  status: 'NOT_OBSERVED' | 'VERIFIED_MATCH' | 'MISMATCH';
  canDispatch: boolean;
  mismatches: readonly CanonicalIdentityMismatch[];
  proofBoundary: string;
}>;

export type SshOnboardingReceipt = Readonly<{
  requestId: string;
  createdAt: string;
  machineName: string;
  keyTitle: string;
  githubAccount: typeof canonicalSshTarget.account;
  repository: typeof canonicalSshTarget.repository;
  hostAlias: typeof canonicalSshTarget.hostAlias;
  remote: typeof canonicalSshTarget.remote;
  proofState: 'CREATED_NOT_DISPATCHED';
  proofBoundary: string;
}>;

export type SshOnboardingReturnReceipt = Readonly<{
  receiptId: string;
  requestId: string;
  returnedAt: string;
  proofState:
    | 'RECEIVED_NOT_COMPLETED'
    | 'COMPLETED_RECEIPT_PROVEN'
    | 'BLOCKER_RECEIPT_PROVEN';
  source: string;
  evidenceReference: string;
  machineName: string;
  keyTitle: string;
  githubAccount: string;
  repository: string;
  hostAlias: string;
  remote: string;
  originReturnConfirmed: boolean;
}>;

export type ReturnReceiptCorrelation = Readonly<{
  status: 'NOT_RECEIVED' | 'CORRELATED' | 'REJECTED';
  receipt: SshOnboardingReturnReceipt | null;
  issues: readonly string[];
  proofBoundary: string;
}>;

export type SshOnboardingStep = {
  id: 'generate' | 'approve' | 'verify' | 'bind';
  label: string;
  detail: string;
  owner: 'Harvey' | 'Operator';
  status: 'NOT_STARTED' | 'WAITING_ON_PRIOR_STEP';
  proofRequired: string;
};

export function validateCanonicalSshIdentity(
  request: SshOnboardingReceipt,
  observation: SshMachineIdentityObservation | null
): CanonicalIdentityCheck {
  if (observation === null) {
    return Object.freeze({
      status: 'NOT_OBSERVED',
      canDispatch: false,
      mismatches: Object.freeze([]),
      proofBoundary:
        'Expected target saved locally. Machine identity has not been observed.'
    });
  }

  const expectedFields: ReadonlyArray<
    Readonly<{
      field: CanonicalIdentityField;
      expected: string;
    }>
  > = [
    { field: 'requestId', expected: request.requestId },
    { field: 'machineName', expected: request.machineName },
    { field: 'githubAccount', expected: canonicalSshTarget.account },
    { field: 'repository', expected: canonicalSshTarget.repository },
    { field: 'hostAlias', expected: canonicalSshTarget.hostAlias },
    { field: 'remote', expected: canonicalSshTarget.remote }
  ];

  const mismatches = expectedFields.flatMap(({ field, expected }) =>
    observation[field] === expected
      ? []
      : [{ field, expected, actual: observation[field] }]
  );

  return Object.freeze({
    status: mismatches.length === 0 ? 'VERIFIED_MATCH' : 'MISMATCH',
    canDispatch: mismatches.length === 0,
    mismatches: Object.freeze(mismatches),
    proofBoundary:
      mismatches.length === 0
        ? 'Returned observation matches the active request. Authenticity is not proven.'
        : 'Returned observation does not match the active request. Dispatch remains blocked.'
  });
}

const allowedReturnProofStates = [
  'RECEIVED_NOT_COMPLETED',
  'COMPLETED_RECEIPT_PROVEN',
  'BLOCKER_RECEIPT_PROVEN'
] as const;

const allowedReturnReceiptKeys = [
  'receiptId',
  'requestId',
  'returnedAt',
  'proofState',
  'source',
  'evidenceReference',
  'machineName',
  'keyTitle',
  'githubAccount',
  'repository',
  'hostAlias',
  'remote',
  'originReturnConfirmed'
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseManualReturnReceipt(receiptText: string): unknown {
  const normalized = receiptText.trim();

  if (!normalized) {
    throw new Error('Paste one returned receipt JSON object.');
  }

  if (normalized.length > 10000) {
    throw new Error('Returned receipt JSON cannot exceed 10,000 characters.');
  }

  const parsed: unknown = JSON.parse(normalized);

  if (!isRecord(parsed)) {
    throw new Error('Returned receipt must be a JSON object.');
  }

  return parsed;
}

function isBoundedString(value: unknown, maximumLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximumLength;
}

function isReturnProofState(
  value: unknown
): value is SshOnboardingReturnReceipt['proofState'] {
  return allowedReturnProofStates.some((state) => state === value);
}

export function correlateReturnReceipt(
  request: SshOnboardingReceipt,
  candidate: unknown
): ReturnReceiptCorrelation {
  if (candidate === null || candidate === undefined) {
    return Object.freeze({
      status: 'NOT_RECEIVED',
      receipt: null,
      issues: Object.freeze([]),
      proofBoundary: 'No machine-agent receipt has returned.'
    });
  }

  if (!isRecord(candidate)) {
    return Object.freeze({
      status: 'REJECTED',
      receipt: null,
      issues: Object.freeze(['Receipt must be a plain object.']),
      proofBoundary: 'Unknown input was rejected before it could advance proof state.'
    });
  }

  const issues: string[] = [];
  const extraKeys = Object.keys(candidate).filter(
    (key) =>
      !allowedReturnReceiptKeys.includes(
        key as (typeof allowedReturnReceiptKeys)[number]
      )
  );

  if (extraKeys.length > 0) {
    issues.push('Receipt contains fields outside the allowlist.');
  }

  const {
    receiptId,
    requestId,
    returnedAt,
    proofState,
    source,
    evidenceReference,
    machineName,
    keyTitle,
    githubAccount,
    repository,
    hostAlias,
    remote,
    originReturnConfirmed
  } = candidate;

  if (!isBoundedString(receiptId, 120)) {
    issues.push('receiptId is required and must be 120 characters or fewer.');
  }
  if (!isBoundedString(requestId, 120) || requestId !== request.requestId) {
    issues.push('requestId does not match the active local request.');
  }
  if (!isBoundedString(returnedAt, 64) || Number.isNaN(Date.parse(returnedAt))) {
    issues.push('returnedAt must be a valid timestamp.');
  } else if (Date.parse(returnedAt) < Date.parse(request.createdAt)) {
    issues.push('returnedAt cannot be earlier than request creation.');
  }
  if (!isReturnProofState(proofState)) {
    issues.push('proofState is not an accepted returned state.');
  }
  if (!isBoundedString(source, 120)) {
    issues.push('source is required and must be 120 characters or fewer.');
  }
  if (!isBoundedString(evidenceReference, 240)) {
    issues.push('evidenceReference is required and must be 240 characters or fewer.');
  }
  if (!isBoundedString(machineName, 64) || machineName !== request.machineName) {
    issues.push('machineName does not match the active local request.');
  }
  if (!isBoundedString(keyTitle, 120) || keyTitle !== request.keyTitle) {
    issues.push('keyTitle does not match the active local request.');
  }
  if (githubAccount !== request.githubAccount) {
    issues.push('githubAccount does not match the expected target.');
  }
  if (repository !== request.repository) {
    issues.push('repository does not match the expected target.');
  }
  if (hostAlias !== request.hostAlias) {
    issues.push('hostAlias does not match the expected target.');
  }
  if (remote !== request.remote) {
    issues.push('remote does not match the expected target.');
  }
  if (typeof originReturnConfirmed !== 'boolean') {
    issues.push('originReturnConfirmed must be a boolean.');
  }
  if (
    (proofState === 'COMPLETED_RECEIPT_PROVEN' ||
      proofState === 'BLOCKER_RECEIPT_PROVEN') &&
    originReturnConfirmed !== true
  ) {
    issues.push('Terminal proof requires confirmed origin return.');
  }

  if (issues.length > 0) {
    return Object.freeze({
      status: 'REJECTED',
      receipt: null,
      issues: Object.freeze(issues),
      proofBoundary:
        'Returned data failed correlation and cannot advance proof state.'
    });
  }

  const receipt: SshOnboardingReturnReceipt = Object.freeze({
    receiptId: receiptId as string,
    requestId: requestId as string,
    returnedAt: returnedAt as string,
    proofState: proofState as SshOnboardingReturnReceipt['proofState'],
    source: source as string,
    evidenceReference: evidenceReference as string,
    machineName: machineName as string,
    keyTitle: keyTitle as string,
    githubAccount: githubAccount as string,
    repository: repository as string,
    hostAlias: hostAlias as string,
    remote: remote as string,
    originReturnConfirmed: originReturnConfirmed as boolean
  });

  return Object.freeze({
    status: 'CORRELATED',
    receipt,
    issues: Object.freeze([]),
    proofBoundary:
      'Receipt structure and request correlation passed. Machine authenticity is not proven.'
  });
}

export function toMachineIdentityObservation(
  receipt: SshOnboardingReturnReceipt
): SshMachineIdentityObservation {
  return Object.freeze({
    requestId: receipt.requestId,
    machineName: receipt.machineName,
    githubAccount: receipt.githubAccount,
    repository: receipt.repository,
    hostAlias: receipt.hostAlias,
    remote: receipt.remote
  });
}

export function validateMachineName(machineName: string): MachineNameValidation {
  const normalized = machineName.trim().replace(/\s+/g, ' ');
  let issue: string | null = null;

  if (normalized.length < 2 || normalized.length > 64) {
    issue = 'Use 2 to 64 characters for the machine name.';
  } else if (!/^[A-Za-z0-9](?:[A-Za-z0-9 ._-]*[A-Za-z0-9])?$/.test(normalized)) {
    issue = 'Use letters, numbers, spaces, dots, underscores, or hyphens; start and end with a letter or number.';
  }

  return Object.freeze({ normalized, isValid: issue === null, issue });
}

export function createSshKeyTitle(machineName: string, createdAt: Date): string {
  const validation = validateMachineName(machineName);

  if (!validation.isValid) {
    throw new Error(validation.issue ?? 'Machine name is invalid.');
  }

  return 'Harvey · ' + validation.normalized + ' · ' + createdAt.toISOString().slice(0, 10);
}

export function createSshOnboardingReceipt(
  machineName: string,
  createdAt: Date
): SshOnboardingReceipt {
  const validation = validateMachineName(machineName);

  if (!validation.isValid) {
    throw new Error(validation.issue ?? 'Machine name is invalid.');
  }

  const normalizedMachineName = validation.normalized;

  const machineId = normalizedMachineName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const timestampId = createdAt.getTime().toString(36);

  return Object.freeze({
    requestId: `harvey-ssh-${machineId || 'machine'}-${timestampId}`,
    createdAt: createdAt.toISOString(),
    machineName: normalizedMachineName,
    keyTitle: createSshKeyTitle(normalizedMachineName, createdAt),
    githubAccount: canonicalSshTarget.account,
    repository: canonicalSshTarget.repository,
    hostAlias: canonicalSshTarget.hostAlias,
    remote: canonicalSshTarget.remote,
    proofState: 'CREATED_NOT_DISPATCHED',
    proofBoundary: 'Local memory only. Not queued, delivered, received, or completed.'
  });
}

export const sshOnboardingSteps: SshOnboardingStep[] = [
  {
    id: 'generate',
    label: 'Generate a machine key',
    detail: 'Create a dedicated Ed25519 key without reading or syncing the private key.',
    owner: 'Harvey',
    status: 'NOT_STARTED',
    proofRequired: 'Public key path and fingerprint returned by the machine agent.'
  },
  {
    id: 'approve',
    label: 'Approve the public key',
    detail: 'Open the exact GitHub SSH settings page and stop for the operator.',
    owner: 'Operator',
    status: 'WAITING_ON_PRIOR_STEP',
    proofRequired: 'Operator approval after the public key and fingerprint are visible.'
  },
  {
    id: 'verify',
    label: 'Verify the Ben identity',
    detail: 'Confirm GitHub answers as benleakwerkles before touching a repo remote.',
    owner: 'Harvey',
    status: 'WAITING_ON_PRIOR_STEP',
    proofRequired: 'SSH response identifying benleakwerkles.'
  },
  {
    id: 'bind',
    label: 'Bind the Werkles remote',
    detail: 'Use the account-specific SSH alias for the canonical Werkles repository.',
    owner: 'Harvey',
    status: 'WAITING_ON_PRIOR_STEP',
    proofRequired: 'Remote readback exactly matching the canonical SSH remote.'
  }
];

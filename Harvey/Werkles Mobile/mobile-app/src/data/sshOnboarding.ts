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

export type SshOnboardingReceipt = Readonly<{
  requestId: string;
  createdAt: string;
  machineName: string;
  githubAccount: typeof canonicalSshTarget.account;
  repository: typeof canonicalSshTarget.repository;
  hostAlias: typeof canonicalSshTarget.hostAlias;
  remote: typeof canonicalSshTarget.remote;
  proofState: 'CREATED_NOT_DISPATCHED';
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

export const canonicalSshTarget = {
  account: 'benleakwerkles',
  repository: 'benleakwerkles/Werkles',
  hostAlias: 'github-benleakwerkles',
  remote: 'git@github-benleakwerkles:benleakwerkles/Werkles.git'
} as const;

export function createSshOnboardingReceipt(
  machineName: string,
  createdAt: Date
): SshOnboardingReceipt {
  const normalizedMachineName = machineName.trim();

  if (!normalizedMachineName) {
    throw new Error('Machine name is required to create an onboarding receipt.');
  }

  const machineId = normalizedMachineName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const timestampId = createdAt.getTime().toString(36);

  return Object.freeze({
    requestId: `harvey-ssh-${machineId || 'machine'}-${timestampId}`,
    createdAt: createdAt.toISOString(),
    machineName: normalizedMachineName,
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

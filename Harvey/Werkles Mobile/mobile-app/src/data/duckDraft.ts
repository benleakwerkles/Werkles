export type DuckPayloadSummary = Readonly<{
  topLevelKeys: readonly string[];
  characterCount: number;
}>;

export type LocalDuckDraftReceipt = Readonly<{
  requestId: string;
  createdAt: string;
  payloadSummary: DuckPayloadSummary;
  proofState: 'LOCAL_DRAFT_NOT_DISPATCHED';
  proofBoundary: string;
}>;

const maximumPayloadCharacters = 10000;
const maximumPayloadDepth = 8;
const sensitiveKeyNames = new Set([
  'apikey',
  'authorization',
  'cookie',
  'oauth',
  'passphrase',
  'password',
  'privatekey',
  'secret',
  'token'
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeKeyName(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function assertSecretSafe(value: unknown, depth: number): void {
  if (depth > maximumPayloadDepth) {
    throw new Error('Payload nesting cannot exceed eight levels.');
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => assertSecretSafe(entry, depth + 1));
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  Object.entries(value).forEach(([key, entry]) => {
    if (sensitiveKeyNames.has(normalizeKeyName(key))) {
      throw new Error(
        'Payload contains a sensitive field name. Remove credentials and secrets.'
      );
    }

    assertSecretSafe(entry, depth + 1);
  });
}

export function createLocalDuckDraftReceipt(
  payloadText: string,
  createdAt: Date
): LocalDuckDraftReceipt {
  const normalizedPayload = payloadText.trim();

  if (!normalizedPayload) {
    throw new Error('Payload is required.');
  }

  if (normalizedPayload.length > maximumPayloadCharacters) {
    throw new Error('Payload cannot exceed 10,000 characters.');
  }

  const parsed: unknown = JSON.parse(normalizedPayload);

  if (!isRecord(parsed)) {
    throw new Error('Payload must be a JSON object.');
  }

  assertSecretSafe(parsed, 1);

  const topLevelKeys = Object.freeze(Object.keys(parsed).sort());
  const payloadSummary = Object.freeze({
    topLevelKeys,
    characterCount: normalizedPayload.length
  });

  return Object.freeze({
    requestId: 'duck-local-' + createdAt.getTime().toString(36),
    createdAt: createdAt.toISOString(),
    payloadSummary,
    proofState: 'LOCAL_DRAFT_NOT_DISPATCHED',
    proofBoundary:
      'Local memory only. Raw payload is not retained in the receipt and nothing was dispatched.'
  });
}

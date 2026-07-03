export const RELAY_REJECTION_HEADLINE = "Relay rejected untrusted response.";

export type RelayRejectionPayload = {
  reason_code: string;
  sender: string;
  expected_recipient: string;
  packet_id: string;
};

export type RelayRejectionDetails = {
  reasonCode: string;
  sender: string;
  expectedRecipient: string;
  packetId: string;
};

const KNOWN_REASON_CODES = [
  "STALE_DO_NOT_APPLY",
  "SOURCE_MISMATCH",
  "MISSING_SOURCE",
  "MALFORMED",
  "INVALID"
] as const;

const REASON_CODE_PATTERN = new RegExp(
  `\\b(${KNOWN_REASON_CODES.join("|")})\\b`,
  "i"
);

function normalizeReasonCode(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  const direct = KNOWN_REASON_CODES.find((code) => code.toLowerCase() === trimmed.toLowerCase());
  if (direct) return direct;
  const match = trimmed.match(REASON_CODE_PATTERN);
  return match?.[1]?.toUpperCase() ?? null;
}

function isUntrustedText(text: string): boolean {
  return /untrusted|relay rejected|do not apply|ack\/receipt rejected/i.test(text);
}

function payloadToDetails(payload: RelayRejectionPayload): RelayRejectionDetails | null {
  const reasonCode = normalizeReasonCode(payload.reason_code);
  const sender = payload.sender?.trim();
  const expectedRecipient = payload.expected_recipient?.trim();
  const packetId = payload.packet_id?.trim();
  if (!reasonCode || !sender || !expectedRecipient || !packetId) return null;
  return { reasonCode, sender, expectedRecipient, packetId };
}

export function relayRejectionFromPayload(
  payload: RelayRejectionPayload | null | undefined
): RelayRejectionDetails | null {
  if (!payload) return null;
  return payloadToDetails(payload);
}

export function detectRelayRejection(input: {
  relayRejection?: RelayRejectionPayload | null;
  error?: string | null;
  blocker?: string | null;
  status?: string | null;
  sender?: string | null;
  expectedRecipient?: string | null;
  packetId?: string | null;
}): RelayRejectionDetails | null {
  const structured = relayRejectionFromPayload(input.relayRejection);
  if (structured) return structured;

  const haystack = [input.status, input.error, input.blocker].filter(Boolean).join(" ");
  if (!haystack.trim()) return null;

  const reasonCode =
    normalizeReasonCode(input.status) ??
    normalizeReasonCode(input.error) ??
    normalizeReasonCode(input.blocker) ??
    (isUntrustedText(haystack) ? "UNTRUSTED_RESPONSE" : null);

  if (!reasonCode) return null;

  const sender = input.sender?.trim() || "—";
  const expectedRecipient = input.expectedRecipient?.trim() || "—";
  const packetId = input.packetId?.trim() || "—";

  return { reasonCode, sender, expectedRecipient, packetId };
}

export function applyRelayRejectionSurface<T extends { loopState: string; response: string | null }>(
  surface: T,
  rejection: RelayRejectionDetails | null
): T & { relayRejection: RelayRejectionDetails | null; loopState: "RELAY_REJECTED" | T["loopState"] } {
  if (!rejection) {
    return { ...surface, relayRejection: null };
  }
  return {
    ...surface,
    loopState: "RELAY_REJECTED",
    response: RELAY_REJECTION_HEADLINE,
    relayRejection: rejection
  };
}

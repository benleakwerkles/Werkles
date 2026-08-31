import type { VerificationProviderId } from "./provider-adapter-conformance.ts";

export const EXTERNAL_VERIFICATION_PROVIDER_IDS = [
  "stripe_identity",
  "plaid",
  "twilio_verify",
  "checkr"
] as const satisfies readonly VerificationProviderId[];

export type ExternalVerificationProviderId =
  (typeof EXTERNAL_VERIFICATION_PROVIDER_IDS)[number];

export type ProviderInteraction =
  | "hosted_redirect"
  | "embedded_link"
  | "challenge_code"
  | "hosted_invitation";

export type ProviderCompletionAuthority = "signed_webhook" | "server_check";
export type ProviderTrustDomain = "test" | "production";

export type ProviderBeginInput = Readonly<{
  operationRef: string;
  subjectRef: string;
  returnUrl?: string;
  deliveryTarget?: string;
}>;

export type ProviderBeginResult =
  | Readonly<{ kind: "hosted_redirect"; operationRef: string; providerOperationRef?: string; url: string; expiresAt?: string }>
  | Readonly<{ kind: "embedded_link"; operationRef: string; providerOperationRef?: string; clientToken: string; expiresAt?: string }>
  | Readonly<{
      kind: "challenge_code";
      operationRef: string;
      providerOperationRef?: string;
      maskedDestination: string;
      expiresAt: string;
    }>
  | Readonly<{ kind: "hosted_invitation"; operationRef: string; providerOperationRef?: string; deliveryState: "queued" | "sent" }>;

export type ProviderConsumeInput =
  | Readonly<{
      kind: "webhook";
      rawBody: Uint8Array;
      headers: Readonly<Record<string, string>>;
      receivedAt: string;
    }>
  | Readonly<{
      kind: "challenge_response";
      operationRef: string;
      code: string;
      receivedAt: string;
    }>
  | Readonly<{
      kind: "client_handoff";
      operationRef: string;
      transientToken: string;
      receivedAt: string;
    }>;

/** Sanitized provider fact. It carries no subject, claim, purpose, scope,
 * consent, evaluation, provider payload, account data, report, or token. */
export type ProviderVerifiedEvent = Readonly<{
  providerId: ExternalVerificationProviderId;
  trustDomain: ProviderTrustDomain;
  providerEventId: string;
  operationRef: string;
  observationKind: string;
  providerStatus: string;
  observedAt: string;
  evidenceDigest: `sha256:${string}`;
}>;

// Only the validating adapter wrapper can place an event in this set. The
// predicate proves object provenance without exporting a mint or brand symbol.
const PORT_VERIFIED_PROVIDER_EVENTS = new WeakSet<object>();

export function isPortVerifiedProviderEvent(value: unknown): value is ProviderVerifiedEvent {
  return typeof value === "object" && value !== null && PORT_VERIFIED_PROVIDER_EVENTS.has(value);
}

export type ProviderConsumeResult =
  | Readonly<{
      kind: "operation_progress";
      operationRef: string;
      state: "pending" | "connected" | "requires_input" | "cancelled";
    }>
  | Readonly<{ kind: "verified_observation"; event: ProviderVerifiedEvent }>;

export type ProviderRevokeResult = Readonly<{
  operationRef: string;
  state: "revoked" | "already_revoked";
}>;

export type VerificationProviderAdapterPort = Readonly<{
  version: "v1";
  providerId: ExternalVerificationProviderId;
  trustDomain: ProviderTrustDomain;
  interaction: ProviderInteraction;
  completionAuthority: ProviderCompletionAuthority;
  begin(input: ProviderBeginInput): Promise<ProviderBeginResult>;
  verifyAndNormalize(input: ProviderConsumeInput): Promise<ProviderConsumeResult>;
  revoke(operationRef: string): Promise<ProviderRevokeResult>;
}>;

export type VerificationProviderRegistry = Readonly<{
  readonly size: number;
  get(providerId: ExternalVerificationProviderId): VerificationProviderAdapterPort | undefined;
  has(providerId: ExternalVerificationProviderId): boolean;
  entries(): IterableIterator<[ExternalVerificationProviderId, VerificationProviderAdapterPort]>;
  keys(): IterableIterator<ExternalVerificationProviderId>;
  values(): IterableIterator<VerificationProviderAdapterPort>;
  [Symbol.iterator](): IterableIterator<[ExternalVerificationProviderId, VerificationProviderAdapterPort]>;
}>;

export const PROVIDER_PORT_PROFILES = Object.freeze({
  stripe_identity: Object.freeze({
    interaction: "hosted_redirect",
    completionAuthority: "signed_webhook",
    consumeKinds: Object.freeze(["webhook"] as const)
  }),
  plaid: Object.freeze({
    interaction: "embedded_link",
    completionAuthority: "signed_webhook",
    consumeKinds: Object.freeze(["webhook", "client_handoff"] as const)
  }),
  twilio_verify: Object.freeze({
    interaction: "challenge_code",
    completionAuthority: "server_check",
    consumeKinds: Object.freeze(["challenge_response"] as const)
  }),
  checkr: Object.freeze({
    interaction: "hosted_invitation",
    completionAuthority: "signed_webhook",
    consumeKinds: Object.freeze(["webhook"] as const)
  })
} as const satisfies Record<
  ExternalVerificationProviderId,
  Readonly<{
    interaction: ProviderInteraction;
    completionAuthority: ProviderCompletionAuthority;
    consumeKinds: readonly ProviderConsumeInput["kind"][];
  }>
>);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  return Object.values(Object.getOwnPropertyDescriptors(value)).every((item) => !item.get && !item.set);
}

function assertExactKeys(value: unknown, allowed: readonly string[], label: string): asserts value is Record<string, unknown> {
  if (!isPlainObject(value)) throw new TypeError(`${label} must be a plain data object`);
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== "string")) throw new TypeError(`${label} has invalid fields`);
  const actual = (ownKeys as string[]).sort();
  const expected = [...allowed].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new TypeError(`${label} has invalid fields`);
}

function assertText(value: unknown, label: string, maximum = 512): asserts value is string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value !== value.trim() ||
    value.length > maximum ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) throw new TypeError(`${label} is invalid`);
}

function assertInstant(value: unknown, label: string): asserts value is string {
  assertText(value, label, 40);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw new TypeError(`${label} is invalid`);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== value) throw new TypeError(`${label} is invalid`);
}

function assertSafeUrl(value: unknown, label: string): asserts value is string {
  assertText(value, label, 2048);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError(`${label} is invalid`);
  }
  const localHttp = parsed.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !localHttp) throw new TypeError(`${label} is invalid`);
}

function normalizeConsumeInput(input: ProviderConsumeInput): ProviderConsumeInput {
  if (input.kind === "webhook") {
    assertExactKeys(input, ["kind", "rawBody", "headers", "receivedAt"], "provider webhook input");
    if (!(input.rawBody instanceof Uint8Array)) throw new TypeError("Provider webhook body is invalid");
    if (!isPlainObject(input.headers)) throw new TypeError("Provider webhook headers are invalid");
    const headers: Record<string, string> = {};
    for (const [name, value] of Object.entries(input.headers)) {
      assertText(name, "provider webhook header name", 200);
      assertText(value, "provider webhook header value", 4096);
      headers[name.toLowerCase()] = value;
    }
    assertInstant(input.receivedAt, "provider webhook receipt time");
    return Object.freeze({
      kind: "webhook",
      rawBody: new Uint8Array(input.rawBody),
      headers: Object.freeze(headers),
      receivedAt: input.receivedAt
    });
  }
  if (input.kind === "challenge_response") {
    assertExactKeys(input, ["kind", "operationRef", "code", "receivedAt"], "provider challenge input");
    assertText(input.operationRef, "provider operation reference");
    assertText(input.code, "provider challenge code", 100);
    assertInstant(input.receivedAt, "provider challenge receipt time");
    return Object.freeze({ ...input });
  }
  if (input.kind === "client_handoff") {
    assertExactKeys(input, ["kind", "operationRef", "transientToken", "receivedAt"], "provider handoff input");
    assertText(input.operationRef, "provider operation reference");
    assertText(input.transientToken, "provider transient token", 8192);
    assertInstant(input.receivedAt, "provider handoff receipt time");
    return Object.freeze({ ...input });
  }
  throw new TypeError("Provider consume transport is invalid");
}

function operationRefFromConsume(input: ProviderConsumeInput): string | null {
  return "operationRef" in input ? input.operationRef : null;
}

function validateBeginResult(
  result: unknown,
  input: ProviderBeginInput,
  interaction: ProviderInteraction
): ProviderBeginResult {
  const common = ["kind", "operationRef"];
  const extra = interaction === "hosted_redirect"
    ? ["url"]
    : interaction === "embedded_link"
      ? ["clientToken"]
      : interaction === "challenge_code"
        ? ["maskedDestination", "expiresAt"]
        : ["deliveryState"];
  const candidate = result as Record<string, unknown>;
  const optionalExpiry = interaction === "hosted_redirect" || interaction === "embedded_link";
  const keys = [
    ...common,
    ...extra,
    ...(candidate?.providerOperationRef !== undefined ? ["providerOperationRef"] : []),
    ...(optionalExpiry && candidate?.expiresAt !== undefined ? ["expiresAt"] : [])
  ];
  assertExactKeys(result, keys, "provider begin result");
  if (candidate.kind !== interaction) throw new TypeError("Provider begin result kind mismatch");
  if (candidate.operationRef !== input.operationRef) throw new TypeError("Provider begin operation mismatch");
  if (candidate.providerOperationRef !== undefined) {
    assertText(candidate.providerOperationRef, "provider-created operation reference", 512);
  }
  if (interaction === "hosted_redirect") assertSafeUrl(candidate.url, "provider redirect URL");
  if (interaction === "embedded_link") assertText(candidate.clientToken, "provider client token", 4096);
  if (interaction === "challenge_code") {
    assertText(candidate.maskedDestination, "masked destination", 100);
    assertInstant(candidate.expiresAt, "challenge expiry");
  }
  if (interaction === "hosted_invitation" && !["queued", "sent"].includes(candidate.deliveryState as string)) {
    throw new TypeError("Provider invitation state is invalid");
  }
  if (candidate.expiresAt !== undefined) assertInstant(candidate.expiresAt, "provider begin expiry");
  return Object.freeze({ ...candidate }) as ProviderBeginResult;
}

function validateConsumeResult(
  result: unknown,
  input: ProviderConsumeInput,
  providerId: ExternalVerificationProviderId,
  trustDomain: ProviderTrustDomain,
  completionAuthority: ProviderCompletionAuthority
): ProviderConsumeResult {
  if (!isPlainObject(result)) throw new TypeError("Provider consume result must be a plain data object");
  if (result.kind === "operation_progress") {
    assertExactKeys(result, ["kind", "operationRef", "state"], "provider progress result");
    assertText(result.operationRef, "provider operation reference");
    const expectedRef = operationRefFromConsume(input);
    if (expectedRef && result.operationRef !== expectedRef) throw new TypeError("Provider progress operation mismatch");
    if (!["pending", "connected", "requires_input", "cancelled"].includes(result.state as string)) {
      throw new TypeError("Provider progress state is invalid");
    }
    return Object.freeze({ ...result }) as ProviderConsumeResult;
  }
  if (result.kind !== "verified_observation") throw new TypeError("Provider consume result kind is invalid");
  assertExactKeys(result, ["kind", "event"], "provider observation result");
  assertExactKeys(
    result.event,
    [
      "providerId",
      "trustDomain",
      "providerEventId",
      "operationRef",
      "observationKind",
      "providerStatus",
      "observedAt",
      "evidenceDigest"
    ],
    "provider observation"
  );
  const event = result.event;
  if (event.providerId !== providerId) throw new TypeError("Provider observation identity mismatch");
  if (event.trustDomain !== trustDomain) throw new TypeError("Provider observation trust-domain mismatch");
  for (const field of ["providerEventId", "operationRef", "observationKind", "providerStatus"] as const) {
    assertText(event[field], `provider observation ${field}`);
  }
  const expectedRef = operationRefFromConsume(input);
  if (expectedRef && event.operationRef !== expectedRef) throw new TypeError("Provider observation operation mismatch");
  assertInstant(event.observedAt, "provider observation time");
  if (typeof event.evidenceDigest !== "string" || !/^sha256:[0-9a-f]{64}$/.test(event.evidenceDigest)) {
    throw new TypeError("Provider evidence digest is invalid");
  }
  if (completionAuthority === "signed_webhook" && input.kind !== "webhook") {
    throw new TypeError("Provider observation requires a verified webhook");
  }
  if (completionAuthority === "server_check" && input.kind !== "challenge_response") {
    throw new TypeError("Provider observation requires a server check");
  }
  const verifiedEvent = Object.freeze({ ...event }) as ProviderVerifiedEvent;
  PORT_VERIFIED_PROVIDER_EVENTS.add(verifiedEvent);
  return Object.freeze({ kind: "verified_observation", event: verifiedEvent }) as ProviderConsumeResult;
}

export function defineVerificationProviderAdapter(
  adapter: VerificationProviderAdapterPort
): VerificationProviderAdapterPort {
  if (!EXTERNAL_VERIFICATION_PROVIDER_IDS.includes(adapter.providerId)) {
    throw new TypeError("Unknown verification provider adapter");
  }
  if (adapter.version !== "v1") throw new TypeError("Unsupported provider adapter version");
  if (!['test', 'production'].includes(adapter.trustDomain)) throw new TypeError("Provider trust domain is invalid");
  const expected = PROVIDER_PORT_PROFILES[adapter.providerId];
  if (
    adapter.interaction !== expected.interaction ||
    adapter.completionAuthority !== expected.completionAuthority
  ) {
    throw new TypeError("Provider adapter profile mismatch");
  }
  for (const method of ["begin", "verifyAndNormalize", "revoke"] as const) {
    if (typeof adapter[method] !== "function") throw new TypeError(`Provider adapter missing ${method}`);
  }
  const providerId = adapter.providerId;
  const trustDomain = adapter.trustDomain;
  const interaction = adapter.interaction;
  const completionAuthority = adapter.completionAuthority;
  const begin = adapter.begin.bind(adapter);
  const verifyAndNormalize = adapter.verifyAndNormalize.bind(adapter);
  const revoke = adapter.revoke.bind(adapter);
  return Object.freeze({
    version: "v1" as const,
    providerId,
    trustDomain,
    interaction,
    completionAuthority,
    async begin(input: ProviderBeginInput) {
      assertExactKeys(
        input,
        ["operationRef", "subjectRef", ...(input.returnUrl !== undefined ? ["returnUrl"] : []), ...(input.deliveryTarget !== undefined ? ["deliveryTarget"] : [])],
        "provider begin input"
      );
      assertText(input.operationRef, "provider operation reference");
      assertText(input.subjectRef, "provider subject reference");
      if (input.returnUrl !== undefined) assertSafeUrl(input.returnUrl, "provider return URL");
      if (input.deliveryTarget !== undefined) assertText(input.deliveryTarget, "provider delivery target");
      return validateBeginResult(await begin(input), input, interaction);
    },
    async verifyAndNormalize(input: ProviderConsumeInput) {
      const allowedKinds = PROVIDER_PORT_PROFILES[providerId].consumeKinds as readonly string[];
      if (!allowedKinds.includes(input.kind)) throw new TypeError("Provider consume transport is not allowed");
      const safeInput = normalizeConsumeInput(input);
      return validateConsumeResult(
        await verifyAndNormalize(safeInput),
        safeInput,
        providerId,
        trustDomain,
        completionAuthority
      );
    },
    async revoke(operationRef: string) {
      assertText(operationRef, "provider operation reference");
      const result = await revoke(operationRef);
      assertExactKeys(result, ["operationRef", "state"], "provider revoke result");
      if (result.operationRef !== operationRef) throw new TypeError("Provider revoke operation mismatch");
      if (!['revoked', 'already_revoked'].includes(result.state)) throw new TypeError("Provider revoke state is invalid");
      return Object.freeze({ ...result });
    }
  });
}

export function createVerificationProviderRegistry(
  adapters: readonly VerificationProviderAdapterPort[]
): VerificationProviderRegistry {
  const registry = new Map<ExternalVerificationProviderId, VerificationProviderAdapterPort>();
  for (const candidate of adapters) {
    const adapter = defineVerificationProviderAdapter(candidate);
    if (registry.has(adapter.providerId)) throw new TypeError("Duplicate verification provider adapter");
    registry.set(adapter.providerId, adapter);
  }
  return Object.freeze({
    get size() {
      return registry.size;
    },
    get(providerId: ExternalVerificationProviderId) {
      return registry.get(providerId);
    },
    has(providerId: ExternalVerificationProviderId) {
      return registry.has(providerId);
    },
    entries() {
      return registry.entries();
    },
    keys() {
      return registry.keys();
    },
    values() {
      return registry.values();
    },
    [Symbol.iterator]() {
      return registry[Symbol.iterator]();
    }
  });
}

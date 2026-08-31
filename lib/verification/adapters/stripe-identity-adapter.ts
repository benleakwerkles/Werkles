import "server-only";

import { createHash } from "node:crypto";

import { acceptProviderAdapterFactoryOutput } from "../provider-adapter-factory-acceptance.ts";
import type { ProviderTrustDomain, VerificationProviderAdapterPort } from "../provider-adapter-port.ts";

const SESSION_ID = /^vs_[A-Za-z0-9]{8,255}$/;
const EVENT_ID = /^evt_[A-Za-z0-9]{8,255}$/;
const EVENT_TYPES = new Set([
  "identity.verification_session.verified",
  "identity.verification_session.processing",
  "identity.verification_session.requires_input",
  "identity.verification_session.canceled",
  "identity.verification_session.redacted"
]);

type StripeIdentityStatus = "verified" | "processing" | "requires_input" | "canceled" | "redacted";
export type StripeIdentitySessionStart = Readonly<{ sessionId: string; status: "requires_input"; url: string; createdAt: string; livemode: boolean }>;
export type StripeIdentityCancel = Readonly<{ sessionId: string; status: "canceled" }>;
export type StripeIdentityWebhookFact = Readonly<{
  eventId: string;
  eventType: string;
  createdAt: string;
  sessionId: string;
  status: StripeIdentityStatus;
  livemode: boolean;
}>;

export type StripeIdentityServerClient = Readonly<{
  createDocumentSession(input: Readonly<{ operationRef: string; returnUrl: string }>): Promise<StripeIdentitySessionStart>;
  cancelSession(input: Readonly<{ sessionId: string }>): Promise<StripeIdentityCancel>;
}>;

export type StripeIdentityWebhookVerifier = (
  rawBody: Uint8Array,
  headers: Readonly<Record<string, string>>
) => Promise<StripeIdentityWebhookFact>;

export type StripeIdentityAdapterDependencies = Readonly<{
  trustDomain: ProviderTrustDomain;
  client: StripeIdentityServerClient;
  verifyWebhook: StripeIdentityWebhookVerifier;
  resolveInternalOperationRef(sessionId: string): Promise<string | null>;
  resolveProviderSessionId(operationRef: string): Promise<string | null>;
}>;

function exact(value: unknown, keys: readonly string[], label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} is invalid`);
  const prototype = Object.getPrototypeOf(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const own = Reflect.ownKeys(value);
  if ((prototype !== Object.prototype && prototype !== null) || Object.values(descriptors).some((item) => item.get || item.set) || own.some((key) => typeof key !== "string")) {
    throw new TypeError(`${label} is invalid`);
  }
  if (JSON.stringify((own as string[]).sort()) !== JSON.stringify([...keys].sort())) throw new TypeError(`${label} has invalid fields`);
}

function instant(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function safeUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

function digest(fact: StripeIdentityWebhookFact): `sha256:${string}` {
  const bytes = JSON.stringify({
    schema: "werkles.stripe-identity-document-observation.v1",
    eventId: fact.eventId,
    sessionId: fact.sessionId,
    status: fact.status,
    createdAt: fact.createdAt,
    livemode: fact.livemode
  });
  return `sha256:${createHash("sha256").update(bytes, "utf8").digest("hex")}`;
}

function requireTrustMatch(trustDomain: ProviderTrustDomain, livemode: boolean) {
  if ((trustDomain === "production") !== livemode) throw new TypeError("Stripe Identity trust domain does not match livemode");
}

export function createStripeIdentityVerificationAdapter(
  dependencies: StripeIdentityAdapterDependencies
): VerificationProviderAdapterPort {
  exact(dependencies, ["trustDomain", "client", "verifyWebhook", "resolveInternalOperationRef", "resolveProviderSessionId"], "Stripe Identity adapter dependencies");
  if (dependencies.trustDomain !== "test" && dependencies.trustDomain !== "production") throw new TypeError("Stripe Identity trust domain is invalid");
  exact(dependencies.client, ["createDocumentSession", "cancelSession"], "Stripe Identity server client");
  for (const method of [dependencies.client.createDocumentSession, dependencies.client.cancelSession, dependencies.verifyWebhook, dependencies.resolveInternalOperationRef, dependencies.resolveProviderSessionId]) {
    if (typeof method !== "function") throw new TypeError("Stripe Identity dependency method is invalid");
  }

  const trustDomain = dependencies.trustDomain;
  const createDocumentSession = dependencies.client.createDocumentSession.bind(dependencies.client);
  const cancelSession = dependencies.client.cancelSession.bind(dependencies.client);
  const verifyWebhook = dependencies.verifyWebhook.bind(dependencies);
  const resolveInternalOperationRef = dependencies.resolveInternalOperationRef.bind(dependencies);
  const resolveProviderSessionId = dependencies.resolveProviderSessionId.bind(dependencies);

  const candidate: VerificationProviderAdapterPort = {
    version: "v1",
    providerId: "stripe_identity",
    trustDomain,
    interaction: "hosted_redirect",
    completionAuthority: "signed_webhook",
    async begin(input) {
      if (!input.returnUrl || !safeUrl(input.returnUrl)) throw new TypeError("Stripe Identity return URL is invalid");
      const started = await createDocumentSession(Object.freeze({ operationRef: input.operationRef, returnUrl: input.returnUrl }));
      exact(started, ["sessionId", "status", "url", "createdAt", "livemode"], "Stripe Identity session start");
      if (!SESSION_ID.test(String(started.sessionId)) || started.status !== "requires_input" || !safeUrl(started.url) || !instant(started.createdAt) || typeof started.livemode !== "boolean") {
        throw new TypeError("Stripe Identity session start is invalid");
      }
      requireTrustMatch(trustDomain, started.livemode);
      return { kind: "hosted_redirect", operationRef: input.operationRef, providerOperationRef: started.sessionId, url: started.url };
    },
    async verifyAndNormalize(input) {
      if (input.kind !== "webhook") throw new TypeError("Stripe Identity requires a signed webhook");
      const fact = await verifyWebhook(new Uint8Array(input.rawBody), Object.freeze({ ...input.headers }));
      exact(fact, ["eventId", "eventType", "createdAt", "sessionId", "status", "livemode"], "Stripe Identity webhook fact");
      if (!EVENT_ID.test(String(fact.eventId)) || !SESSION_ID.test(String(fact.sessionId)) || !EVENT_TYPES.has(String(fact.eventType)) || !instant(fact.createdAt) || typeof fact.livemode !== "boolean") {
        throw new TypeError("Stripe Identity webhook fact is invalid");
      }
      const expectedType = `identity.verification_session.${fact.status}`;
      if (fact.eventType !== expectedType) throw new TypeError("Stripe Identity webhook type and status differ");
      requireTrustMatch(trustDomain, fact.livemode);
      const operationRef = await resolveInternalOperationRef(fact.sessionId);
      if (typeof operationRef !== "string" || !operationRef.trim()) throw new TypeError("Stripe Identity operation reference is unavailable");
      const providerStatus = fact.status === "redacted" ? "canceled" : fact.status;
      return {
        kind: "verified_observation",
        event: {
          providerId: "stripe_identity",
          trustDomain,
          providerEventId: fact.eventId,
          operationRef,
          observationKind: "government_id_document_check",
          providerStatus,
          observedAt: fact.createdAt,
          evidenceDigest: digest(fact)
        }
      };
    },
    async revoke(operationRef) {
      const sessionId = await resolveProviderSessionId(operationRef);
      if (typeof sessionId !== "string" || !SESSION_ID.test(sessionId)) throw new TypeError("Stripe Identity session reference is unavailable");
      const canceled = await cancelSession(Object.freeze({ sessionId }));
      exact(canceled, ["sessionId", "status"], "Stripe Identity cancellation");
      if (canceled.sessionId !== sessionId || canceled.status !== "canceled") throw new TypeError("Stripe Identity cancellation is invalid");
      return { operationRef, state: "revoked" };
    }
  };

  return acceptProviderAdapterFactoryOutput("stripe_identity", trustDomain, candidate);
}

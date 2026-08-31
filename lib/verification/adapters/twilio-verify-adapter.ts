import "server-only";

import { createHash } from "node:crypto";

import { acceptProviderAdapterFactoryOutput } from "../provider-adapter-factory-acceptance.ts";
import type {
  ProviderTrustDomain,
  VerificationProviderAdapterPort
} from "../provider-adapter-port.ts";

const VERIFICATION_SID = /^VE[0-9a-fA-F]{32}$/;
const CANONICAL_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const TERMINAL_UNFAVORABLE = new Set(["canceled", "max_attempts_reached", "deleted", "failed", "expired"]);

export type TwilioVerifyStarted = Readonly<{
  verificationSid: string;
  status: "pending";
  createdAt: string;
}>;

export type TwilioVerifyChecked = Readonly<{
  verificationSid: string;
  status: "pending" | "approved" | "canceled" | "max_attempts_reached" | "deleted" | "failed" | "expired";
  checkedAt: string;
}>;

export type TwilioVerifyCanceled = Readonly<{
  verificationSid: string;
  status: "canceled" | "deleted";
}>;

export type TwilioVerifyServerClient = Readonly<{
  startSmsVerification(input: Readonly<{ destination: string }>): Promise<TwilioVerifyStarted>;
  checkVerification(input: Readonly<{ verificationSid: string; code: string }>): Promise<TwilioVerifyChecked>;
  cancelVerification(input: Readonly<{ verificationSid: string }>): Promise<TwilioVerifyCanceled>;
}>;

export type TwilioVerifyAdapterDependencies = Readonly<{
  trustDomain: ProviderTrustDomain;
  client: TwilioVerifyServerClient;
  resolveProviderOperationRef(operationRef: string): Promise<string | null>;
}>;

function isPlainExact(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Object.values(descriptors).some((descriptor) => descriptor.get || descriptor.set)) return false;
  const own = Reflect.ownKeys(value);
  return own.every((key) => typeof key === "string") &&
    JSON.stringify((own as string[]).sort()) === JSON.stringify([...keys].sort());
}

function canonicalInstant(value: unknown): value is string {
  if (typeof value !== "string" || !CANONICAL_INSTANT.test(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function validSid(value: unknown): value is string {
  return typeof value === "string" && VERIFICATION_SID.test(value);
}

function requireDestination(value: unknown): string {
  if (typeof value !== "string" || !/^\+[1-9]\d{7,14}$/.test(value)) {
    throw new TypeError("Twilio Verify destination must be an E.164 phone number");
  }
  return value;
}

function maskedDestination(destination: string): string {
  return `••• ••• ${destination.slice(-4)}`;
}

function evidenceDigest(verificationSid: string, status: "approved", checkedAt: string): `sha256:${string}` {
  const bytes = JSON.stringify({
    schema: "werkles.twilio-verify-observation.v1",
    providerId: "twilio_verify",
    verificationSid,
    status,
    checkedAt
  });
  return `sha256:${createHash("sha256").update(bytes, "utf8").digest("hex")}`;
}

async function requireProviderOperationRef(
  resolver: (operationRef: string) => Promise<string | null>,
  operationRef: string
): Promise<string> {
  const resolved = await resolver(operationRef);
  if (!validSid(resolved)) throw new TypeError("Twilio Verify operation reference is unavailable");
  return resolved;
}

/**
 * Offline-testable server adapter. Production acceptance remains closed by the
 * factory slot until credentials, consent, abuse controls, and persistence are
 * separately reviewed and enabled.
 */
export function createTwilioVerifyAdapter(
  dependencies: TwilioVerifyAdapterDependencies
): VerificationProviderAdapterPort {
  if (!isPlainExact(dependencies, ["trustDomain", "client", "resolveProviderOperationRef"])) {
    throw new TypeError("Twilio Verify adapter dependencies are invalid");
  }
  if (dependencies.trustDomain !== "test" && dependencies.trustDomain !== "production") {
    throw new TypeError("Twilio Verify trust domain is invalid");
  }
  if (!isPlainExact(dependencies.client, ["startSmsVerification", "checkVerification", "cancelVerification"])) {
    throw new TypeError("Twilio Verify server client is invalid");
  }
  for (const method of [
    dependencies.client.startSmsVerification,
    dependencies.client.checkVerification,
    dependencies.client.cancelVerification,
    dependencies.resolveProviderOperationRef
  ]) {
    if (typeof method !== "function") throw new TypeError("Twilio Verify dependency method is invalid");
  }

  const trustDomain = dependencies.trustDomain;
  const startSmsVerification = dependencies.client.startSmsVerification.bind(dependencies.client);
  const checkVerification = dependencies.client.checkVerification.bind(dependencies.client);
  const cancelVerification = dependencies.client.cancelVerification.bind(dependencies.client);
  const resolveProviderOperationRef = dependencies.resolveProviderOperationRef.bind(dependencies);

  const candidate: VerificationProviderAdapterPort = {
    version: "v1",
    providerId: "twilio_verify",
    trustDomain,
    interaction: "challenge_code",
    completionAuthority: "server_check",
    async begin(input) {
      const destination = requireDestination(input.deliveryTarget);
      const started = await startSmsVerification(Object.freeze({ destination }));
      if (
        !isPlainExact(started, ["verificationSid", "status", "createdAt"]) ||
        !validSid(started.verificationSid) ||
        started.status !== "pending" ||
        !canonicalInstant(started.createdAt)
      ) throw new TypeError("Twilio Verify start result is invalid");
      const expiresAt = new Date(new Date(started.createdAt).valueOf() + 10 * 60 * 1000).toISOString();
      return {
        kind: "challenge_code",
        operationRef: input.operationRef,
        providerOperationRef: started.verificationSid,
        maskedDestination: maskedDestination(destination),
        expiresAt
      };
    },
    async verifyAndNormalize(input) {
      if (input.kind !== "challenge_response") throw new TypeError("Twilio Verify requires a server-side challenge check");
      const verificationSid = await requireProviderOperationRef(resolveProviderOperationRef, input.operationRef);
      const checked = await checkVerification(Object.freeze({ verificationSid, code: input.code }));
      if (
        !isPlainExact(checked, ["verificationSid", "status", "checkedAt"]) ||
        checked.verificationSid !== verificationSid ||
        !canonicalInstant(checked.checkedAt) ||
        (checked.status !== "pending" && checked.status !== "approved" && !TERMINAL_UNFAVORABLE.has(checked.status as string))
      ) throw new TypeError("Twilio Verify check result is invalid");
      if (checked.status === "pending") {
        return { kind: "operation_progress", operationRef: input.operationRef, state: "requires_input" };
      }
      if (checked.status !== "approved") {
        return { kind: "operation_progress", operationRef: input.operationRef, state: "cancelled" };
      }
      return {
        kind: "verified_observation",
        event: {
          providerId: "twilio_verify",
          trustDomain,
          providerEventId: `verification_check:${verificationSid}`,
          operationRef: input.operationRef,
          observationKind: "contact_channel_possession_check",
          providerStatus: "approved",
          observedAt: checked.checkedAt,
          evidenceDigest: evidenceDigest(verificationSid, "approved", checked.checkedAt)
        }
      };
    },
    async revoke(operationRef) {
      const verificationSid = await requireProviderOperationRef(resolveProviderOperationRef, operationRef);
      const canceled = await cancelVerification(Object.freeze({ verificationSid }));
      if (
        !isPlainExact(canceled, ["verificationSid", "status"]) ||
        canceled.verificationSid !== verificationSid ||
        (canceled.status !== "canceled" && canceled.status !== "deleted")
      ) throw new TypeError("Twilio Verify cancel result is invalid");
      return { operationRef, state: "revoked" };
    }
  };

  return acceptProviderAdapterFactoryOutput("twilio_verify", trustDomain, candidate);
}

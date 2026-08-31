import "server-only";

import { createHash } from "node:crypto";

import { acceptProviderAdapterFactoryOutput } from "../provider-adapter-factory-acceptance.ts";
import type { ProviderTrustDomain, VerificationProviderAdapterPort } from "../provider-adapter-port.ts";

const OPAQUE_ID = /^[A-Za-z0-9:_-]{8,512}$/;
const WEBHOOK_ID = /^plaid_webhook:[0-9a-f]{64}$/;

type PlaidEnvironment = "sandbox" | "production";
type PlaidThresholdStatus = "threshold_met" | "threshold_not_met" | "inconclusive";

export type PlaidAssetsLinkStart = Readonly<{
  linkToken: string;
  expiration: string;
  environment: PlaidEnvironment;
}>;

export type PlaidAssetsHandoff = Readonly<{
  operationRef: string;
  itemId: string;
  assetReportId: string;
  status: "pending";
  createdAt: string;
  environment: PlaidEnvironment;
}>;

export type PlaidAssetsWebhookFact = Readonly<{
  eventId: string;
  webhookType: "ASSETS";
  webhookCode: "PRODUCT_READY" | "ERROR";
  assetReportId: string;
  reportType: "FAST" | "FULL" | null;
  environment: PlaidEnvironment;
  verifiedAt: string;
}>;

export type PlaidDisposedThresholdResult = Readonly<{
  assetReportId: string;
  status: PlaidThresholdStatus;
  observedAt: string;
  environment: PlaidEnvironment;
  itemRemoved: true;
  reportRemoved: true;
}>;

export type PlaidRemovalResult = Readonly<{
  id: string;
  state: "removed" | "already_removed";
}>;

export type PlaidProviderCustody = Readonly<{
  itemId: string;
  assetReportId: string;
}>;

export type PlaidAssetsServerClient = Readonly<{
  createAssetsLinkToken(input: Readonly<{ operationRef: string; subjectRef: string }>): Promise<PlaidAssetsLinkStart>;
  exchangeAndCreateAssetSnapshot(input: Readonly<{ operationRef: string; transientToken: string }>): Promise<PlaidAssetsHandoff>;
  evaluateAndDisposeAssetSnapshot(input: Readonly<{ operationRef: string; assetReportId: string }>): Promise<PlaidDisposedThresholdResult>;
  removeItem(input: Readonly<{ itemId: string }>): Promise<PlaidRemovalResult>;
  removeAssetReport(input: Readonly<{ assetReportId: string }>): Promise<PlaidRemovalResult>;
}>;

export type PlaidAssetsWebhookVerifier = (
  rawBody: Uint8Array,
  headers: Readonly<Record<string, string>>
) => Promise<PlaidAssetsWebhookFact>;

export type PlaidVerificationAdapterDependencies = Readonly<{
  trustDomain: ProviderTrustDomain;
  client: PlaidAssetsServerClient;
  verifyWebhook: PlaidAssetsWebhookVerifier;
  resolveInternalOperationRef(assetReportId: string): Promise<string | null>;
  resolveProviderCustody(operationRef: string): Promise<PlaidProviderCustody | null>;
}>;

function exact(value: unknown, keys: readonly string[], label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} is invalid`);
  const prototype = Object.getPrototypeOf(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const own = Reflect.ownKeys(value);
  if (
    (prototype !== Object.prototype && prototype !== null) ||
    Object.values(descriptors).some((item) => item.get || item.set) ||
    own.some((key) => typeof key !== "string") ||
    JSON.stringify((own as string[]).sort()) !== JSON.stringify([...keys].sort())
  ) throw new TypeError(`${label} has invalid fields`);
}

function instant(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function opaqueId(value: unknown): value is string {
  return typeof value === "string" && OPAQUE_ID.test(value);
}

function opaqueToken(value: unknown): value is string {
  return typeof value === "string" && value.length >= 16 && value.length <= 4096 && !/\s|[\u0000-\u001f\u007f]/.test(value);
}

function environmentFor(trustDomain: ProviderTrustDomain): PlaidEnvironment {
  return trustDomain === "production" ? "production" : "sandbox";
}

function requireEnvironment(trustDomain: ProviderTrustDomain, environment: unknown) {
  if (environment !== environmentFor(trustDomain)) throw new TypeError("Plaid environment does not match the trust domain");
}

function thresholdDigest(
  fact: PlaidAssetsWebhookFact,
  result: PlaidDisposedThresholdResult
): `sha256:${string}` {
  const bytes = JSON.stringify({
    schema: "werkles.plaid-fast-assets-threshold-observation.v1",
    eventId: fact.eventId,
    assetReportId: fact.assetReportId,
    status: result.status,
    observedAt: result.observedAt,
    environment: result.environment,
    itemRemoved: result.itemRemoved,
    reportRemoved: result.reportRemoved
  });
  return `sha256:${createHash("sha256").update(bytes, "utf8").digest("hex")}`;
}

function assertLinkStart(value: unknown, trustDomain: ProviderTrustDomain): asserts value is PlaidAssetsLinkStart {
  exact(value, ["linkToken", "expiration", "environment"], "Plaid Link start");
  if (!opaqueToken(value.linkToken) || !instant(value.expiration)) throw new TypeError("Plaid Link start is invalid");
  requireEnvironment(trustDomain, value.environment);
}

function assertHandoff(value: unknown, operationRef: string, trustDomain: ProviderTrustDomain): asserts value is PlaidAssetsHandoff {
  exact(value, ["operationRef", "itemId", "assetReportId", "status", "createdAt", "environment"], "Plaid Assets handoff");
  if (
    value.operationRef !== operationRef ||
    !opaqueId(value.itemId) ||
    !opaqueId(value.assetReportId) ||
    value.status !== "pending" ||
    !instant(value.createdAt)
  ) throw new TypeError("Plaid Assets handoff is invalid");
  requireEnvironment(trustDomain, value.environment);
}

function assertWebhookFact(value: unknown, trustDomain: ProviderTrustDomain): asserts value is PlaidAssetsWebhookFact {
  exact(value, ["eventId", "webhookType", "webhookCode", "assetReportId", "reportType", "environment", "verifiedAt"], "Plaid Assets webhook fact");
  if (
    typeof value.eventId !== "string" || !WEBHOOK_ID.test(value.eventId) ||
    value.webhookType !== "ASSETS" ||
    (value.webhookCode !== "PRODUCT_READY" && value.webhookCode !== "ERROR") ||
    !opaqueId(value.assetReportId) ||
    (value.reportType !== "FAST" && value.reportType !== "FULL" && value.reportType !== null) ||
    !instant(value.verifiedAt)
  ) throw new TypeError("Plaid Assets webhook fact is invalid");
  if (
    (value.webhookCode === "PRODUCT_READY" && value.reportType === null) ||
    (value.webhookCode === "ERROR" && value.reportType !== null)
  ) throw new TypeError("Plaid Assets webhook code and report type differ");
  requireEnvironment(trustDomain, value.environment);
}

function assertDisposedResult(
  value: unknown,
  assetReportId: string,
  trustDomain: ProviderTrustDomain
): asserts value is PlaidDisposedThresholdResult {
  exact(value, ["assetReportId", "status", "observedAt", "environment", "itemRemoved", "reportRemoved"], "Plaid disposed threshold result");
  if (
    value.assetReportId !== assetReportId ||
    (value.status !== "threshold_met" && value.status !== "threshold_not_met" && value.status !== "inconclusive") ||
    !instant(value.observedAt) ||
    value.itemRemoved !== true ||
    value.reportRemoved !== true
  ) throw new TypeError("Plaid disposed threshold result is invalid");
  requireEnvironment(trustDomain, value.environment);
}

function assertRemoval(value: unknown, id: string, label: string): asserts value is PlaidRemovalResult {
  exact(value, ["id", "state"], label);
  if (value.id !== id || (value.state !== "removed" && value.state !== "already_removed")) {
    throw new TypeError(`${label} is invalid`);
  }
}

/**
 * Offline-testable Plaid Assets boundary. The injected server client owns all
 * token/report custody. This adapter never receives report contents, balances,
 * account identity, or transactions and cannot enable production while the
 * factory-slot gate remains closed.
 */
export function createPlaidVerificationAdapter(
  dependencies: PlaidVerificationAdapterDependencies
): VerificationProviderAdapterPort {
  exact(
    dependencies,
    ["trustDomain", "client", "verifyWebhook", "resolveInternalOperationRef", "resolveProviderCustody"],
    "Plaid adapter dependencies"
  );
  if (dependencies.trustDomain !== "test" && dependencies.trustDomain !== "production") {
    throw new TypeError("Plaid trust domain is invalid");
  }
  exact(
    dependencies.client,
    ["createAssetsLinkToken", "exchangeAndCreateAssetSnapshot", "evaluateAndDisposeAssetSnapshot", "removeItem", "removeAssetReport"],
    "Plaid server client"
  );
  for (const method of [
    dependencies.client.createAssetsLinkToken,
    dependencies.client.exchangeAndCreateAssetSnapshot,
    dependencies.client.evaluateAndDisposeAssetSnapshot,
    dependencies.client.removeItem,
    dependencies.client.removeAssetReport,
    dependencies.verifyWebhook,
    dependencies.resolveInternalOperationRef,
    dependencies.resolveProviderCustody
  ]) {
    if (typeof method !== "function") throw new TypeError("Plaid dependency method is invalid");
  }

  const trustDomain = dependencies.trustDomain;
  const createAssetsLinkToken = dependencies.client.createAssetsLinkToken.bind(dependencies.client);
  const exchangeAndCreateAssetSnapshot = dependencies.client.exchangeAndCreateAssetSnapshot.bind(dependencies.client);
  const evaluateAndDisposeAssetSnapshot = dependencies.client.evaluateAndDisposeAssetSnapshot.bind(dependencies.client);
  const removeItem = dependencies.client.removeItem.bind(dependencies.client);
  const removeAssetReport = dependencies.client.removeAssetReport.bind(dependencies.client);
  const verifyWebhook = dependencies.verifyWebhook.bind(dependencies);
  const resolveInternalOperationRef = dependencies.resolveInternalOperationRef.bind(dependencies);
  const resolveProviderCustody = dependencies.resolveProviderCustody.bind(dependencies);

  async function disposeCustody(operationRef: string, expectedAssetReportId?: string) {
    const custody = await resolveProviderCustody(operationRef);
    if (!custody) throw new TypeError("Plaid provider custody is unavailable");
    exact(custody, ["itemId", "assetReportId"], "Plaid provider custody");
    if (!opaqueId(custody.itemId) || !opaqueId(custody.assetReportId)) throw new TypeError("Plaid provider custody is invalid");
    if (expectedAssetReportId && custody.assetReportId !== expectedAssetReportId) {
      throw new TypeError("Plaid Asset Report custody does not match the webhook");
    }
    const item = await removeItem(Object.freeze({ itemId: custody.itemId }));
    assertRemoval(item, custody.itemId, "Plaid Item removal");
    const report = await removeAssetReport(Object.freeze({ assetReportId: custody.assetReportId }));
    assertRemoval(report, custody.assetReportId, "Plaid Asset Report removal");
    return Object.freeze({ item, report });
  }

  const candidate: VerificationProviderAdapterPort = {
    version: "v1",
    providerId: "plaid",
    trustDomain,
    interaction: "embedded_link",
    completionAuthority: "signed_webhook",
    async begin(input) {
      const started = await createAssetsLinkToken(Object.freeze({
        operationRef: input.operationRef,
        subjectRef: input.subjectRef
      }));
      assertLinkStart(started, trustDomain);
      return {
        kind: "embedded_link",
        operationRef: input.operationRef,
        clientToken: started.linkToken,
        expiresAt: started.expiration
      };
    },
    async verifyAndNormalize(input) {
      if (input.kind === "client_handoff") {
        const handoff = await exchangeAndCreateAssetSnapshot(Object.freeze({
          operationRef: input.operationRef,
          transientToken: input.transientToken
        }));
        assertHandoff(handoff, input.operationRef, trustDomain);
        if (new Date(handoff.createdAt).valueOf() > new Date(input.receivedAt).valueOf()) {
          throw new TypeError("Plaid Assets handoff cannot follow its receipt time");
        }
        return { kind: "operation_progress", operationRef: input.operationRef, state: "connected" };
      }
      if (input.kind !== "webhook") throw new TypeError("Plaid requires Link handoff or a verified webhook");
      const fact = await verifyWebhook(new Uint8Array(input.rawBody), Object.freeze({ ...input.headers }));
      assertWebhookFact(fact, trustDomain);
      const webhookLag = new Date(input.receivedAt).valueOf() - new Date(fact.verifiedAt).valueOf();
      if (webhookLag < 0 || webhookLag > 5 * 60 * 1000) {
        throw new TypeError("Plaid webhook verification time is outside the receipt window");
      }
      const operationRef = await resolveInternalOperationRef(fact.assetReportId);
      if (typeof operationRef !== "string" || !operationRef.trim()) throw new TypeError("Plaid operation reference is unavailable");
      if (fact.webhookCode === "ERROR") {
        await disposeCustody(operationRef, fact.assetReportId);
        return { kind: "operation_progress", operationRef, state: "cancelled" };
      }
      if (fact.reportType !== "FAST") {
        await disposeCustody(operationRef, fact.assetReportId);
        return { kind: "operation_progress", operationRef, state: "cancelled" };
      }
      const result = await evaluateAndDisposeAssetSnapshot(Object.freeze({
        operationRef,
        assetReportId: fact.assetReportId
      }));
      assertDisposedResult(result, fact.assetReportId, trustDomain);
      if (new Date(result.observedAt).valueOf() > new Date(fact.verifiedAt).valueOf()) {
        throw new TypeError("Plaid threshold observation cannot follow its verified webhook");
      }
      return {
        kind: "verified_observation",
        event: {
          providerId: "plaid",
          trustDomain,
          providerEventId: fact.eventId,
          operationRef,
          observationKind: "funds_threshold_observation",
          providerStatus: result.status,
          observedAt: result.observedAt,
          evidenceDigest: thresholdDigest(fact, result)
        }
      };
    },
    async revoke(operationRef) {
      const { item, report } = await disposeCustody(operationRef);
      return {
        operationRef,
        state: item.state === "already_removed" && report.state === "already_removed" ? "already_revoked" : "revoked"
      };
    }
  };

  return acceptProviderAdapterFactoryOutput("plaid", trustDomain, candidate);
}

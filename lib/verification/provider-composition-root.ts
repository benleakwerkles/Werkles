import "server-only";

import type { ExternalVerificationProviderId } from "./provider-adapter-port.ts";
import type {
  ProviderConsumeMaterial,
  ProviderCompositionBeginResult,
  ProviderCompositionConsumeResult,
  ProviderCompositionRevokeResult,
  ProviderLifecycleRequest,
  ProviderRevokeRequest
} from "./provider-composition-root-internal.ts";

export type {
  ProviderConsumeMaterial,
  ProviderCompositionBeginResult,
  ProviderCompositionConsumeResult,
  ProviderCompositionRevokeResult,
  ProviderLifecycleRequest,
  ProviderRevokeRequest
} from "./provider-composition-root-internal.ts";

export type VerificationProviderRuntime = Readonly<{
  version: "v1";
  configured: false;
  trustDomain: null;
  begin(
    request: ProviderLifecycleRequest
  ): Promise<ProviderCompositionBeginResult | Readonly<{ ok: false; code: "not_configured" }>>;
  consume(
    providerId: ExternalVerificationProviderId,
    material: ProviderConsumeMaterial
  ): Promise<ProviderCompositionConsumeResult | Readonly<{ ok: false; code: "not_configured" }>>;
  revoke(
    request: ProviderRevokeRequest
  ): Promise<ProviderCompositionRevokeResult | Readonly<{ ok: false; code: "not_configured" }>>;
}>;

const NOT_CONFIGURED = Object.freeze({ ok: false as const, code: "not_configured" as const });

/**
 * Production bootstrap remains explicitly unavailable until reviewed concrete
 * adapter factories and authoritative persistence resolvers are wired here.
 * It accepts no injected SDK, adapter, trust domain, or authority callbacks.
 */
const runtime: VerificationProviderRuntime = Object.freeze({
  version: "v1" as const,
  configured: false as const,
  trustDomain: null,
  async begin() {
    return NOT_CONFIGURED;
  },
  async consume() {
    return NOT_CONFIGURED;
  },
  async revoke() {
    return NOT_CONFIGURED;
  }
});

export function getVerificationProviderRuntime(): VerificationProviderRuntime {
  return runtime;
}

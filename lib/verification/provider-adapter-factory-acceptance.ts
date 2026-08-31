import "server-only";

import {
  defineVerificationProviderAdapter,
  PROVIDER_PORT_PROFILES,
  type ExternalVerificationProviderId,
  type ProviderTrustDomain,
  type VerificationProviderAdapterPort
} from "./provider-adapter-port.ts";
import { providerAdapterFactorySlot } from "./provider-adapter-factory-slots.ts";

/**
 * Final offline boundary for a future concrete provider factory. This does not
 * configure the production composition root or prove runtime availability.
 */
export function acceptProviderAdapterFactoryOutput(
  providerId: ExternalVerificationProviderId,
  trustDomain: ProviderTrustDomain,
  candidate: VerificationProviderAdapterPort
): VerificationProviderAdapterPort {
  const slot = providerAdapterFactorySlot(providerId);
  if (trustDomain === "production" && !slot.gate.productionReady) {
    throw new TypeError("Provider adapter production gate is closed");
  }

  const adapter = defineVerificationProviderAdapter(candidate);
  const profile = PROVIDER_PORT_PROFILES[providerId];
  if (
    adapter.providerId !== providerId ||
    adapter.trustDomain !== trustDomain ||
    adapter.interaction !== slot.interaction ||
    adapter.interaction !== profile.interaction ||
    adapter.completionAuthority !== slot.completionAuthority ||
    adapter.completionAuthority !== profile.completionAuthority
  ) {
    throw new TypeError("Provider adapter factory output does not match its slot");
  }

  return adapter;
}

import assert from "node:assert/strict";

import { acceptProviderAdapterFactoryOutput } from "../../lib/verification/provider-adapter-factory-acceptance.ts";
import {
  PROVIDER_PORT_PROFILES,
  type ExternalVerificationProviderId,
  type ProviderTrustDomain,
  type VerificationProviderAdapterPort
} from "../../lib/verification/provider-adapter-port.ts";

function candidate(
  providerId: ExternalVerificationProviderId,
  trustDomain: ProviderTrustDomain
): VerificationProviderAdapterPort {
  const profile = PROVIDER_PORT_PROFILES[providerId];
  return {
    version: "v1",
    providerId,
    trustDomain,
    interaction: profile.interaction,
    completionAuthority: profile.completionAuthority,
    async begin() { throw new Error("offline fixture"); },
    async verifyAndNormalize() { throw new Error("offline fixture"); },
    async revoke() { throw new Error("offline fixture"); }
  };
}

for (const providerId of ["stripe_identity", "plaid", "twilio_verify", "checkr"] as const) {
  const raw = candidate(providerId, "test");
  const accepted = acceptProviderAdapterFactoryOutput(providerId, "test", raw);
  assert.equal(accepted.providerId, providerId);
  assert.equal(accepted.trustDomain, "test");
  assert.equal(Object.isFrozen(accepted), true);

  (raw as { providerId: ExternalVerificationProviderId }).providerId =
    providerId === "plaid" ? "checkr" : "plaid";
  assert.equal(accepted.providerId, providerId, "accepted output must capture immutable identity");
}

assert.throws(
  () => acceptProviderAdapterFactoryOutput("plaid", "production", candidate("plaid", "production")),
  /production gate is closed/
);
assert.throws(
  () => acceptProviderAdapterFactoryOutput("plaid", "test", candidate("checkr", "test")),
  /does not match its slot/
);
assert.throws(
  () => acceptProviderAdapterFactoryOutput("twilio_verify", "test", {
    ...candidate("twilio_verify", "test"),
    interaction: "hosted_redirect"
  }),
  /profile mismatch/
);
assert.throws(
  () => acceptProviderAdapterFactoryOutput("stripe_identity", "test", {
    ...candidate("stripe_identity", "test"),
    completionAuthority: "server_check"
  }),
  /profile mismatch/
);
assert.throws(
  () => acceptProviderAdapterFactoryOutput("checkr", "test", {
    ...candidate("checkr", "test"),
    begin: undefined
  } as unknown as VerificationProviderAdapterPort),
  /missing begin/
);

console.log("provider-adapter-factory-acceptance-smoke: PASS");

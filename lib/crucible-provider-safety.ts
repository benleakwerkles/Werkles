export type CrucibleProviderSafety =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "provider_test_disabled"
        | "stripe_test_key_required"
        | "plaid_sandbox_required";
    };

export function checkStripeIdentityTestSafety(input: {
  providerTestEnabled: boolean;
  secretKey: string | undefined;
}): CrucibleProviderSafety {
  if (!input.providerTestEnabled) {
    return { ok: false, reason: "provider_test_disabled" };
  }

  const secretKey = input.secretKey?.trim() || "";
  if (!/^(sk|rk)_test_/.test(secretKey)) {
    return { ok: false, reason: "stripe_test_key_required" };
  }

  return { ok: true };
}

export function checkPlaidSandboxSafety(input: {
  providerTestEnabled: boolean;
  plaidEnv: string | undefined;
}): CrucibleProviderSafety {
  if (!input.providerTestEnabled) {
    return { ok: false, reason: "provider_test_disabled" };
  }

  const plaidEnv = input.plaidEnv?.trim().toLowerCase();
  if (plaidEnv !== "sandbox") {
    return { ok: false, reason: "plaid_sandbox_required" };
  }

  return { ok: true };
}

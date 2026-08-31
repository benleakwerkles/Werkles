/**
 * Plaid one-shot funds verification — shared draft types.
 *
 * Ordinary member views expose only a fresh verification date. A specific
 * minimum or amount requires a separate, expiring, mutually approved private
 * disclosure. No provider secret or raw financial evidence belongs here.
 */

export type PlaidEnv = "sandbox" | "production";

export type FundsVerificationStatus =
  | "verified"
  | "not_verified"
  | "inconclusive"
  | "expired"
  | "disputed"
  | "revoked";

export type FundsVerificationKind = "snapshot" | "private_refresh";

export type FundsVerificationReceipt = {
  id: string;
  userId: string;
  kind: FundsVerificationKind;
  status: FundsVerificationStatus;
  /** Private evaluation input. Never exposed by the ordinary profile view. */
  evaluatedMinimumCents: number | null;
  currency: string;
  observedAt: string;
  expiresAt: string;
  evidenceStrength: "provider_verified" | "self_reported" | "inferred" | "missing";
  provider: "plaid";
  providerEnv: PlaidEnv;
  consentId: string;
  providerReceiptRef: string;
  limitations: string[];
};

/** Ordinary profile/match signal. No amount, band, threshold, or failure state. */
export type FundsVerificationFreshnessView = Readonly<{
  label: "Funds verified";
  verifiedAt: string;
  expiresAt: string;
  provider: "plaid";
}>;

/** Named-recipient disclosure created only after both members agree. */
export type MutualFundsDisclosure = Readonly<{
  id: string;
  receiptId: string;
  ownerUserId: string;
  recipientUserId: string;
  ownerConsentId: string;
  recipientConsentId: string;
  disclosedMinimumCents: number;
  currency: string;
  verifiedAt: string;
  expiresAt: string;
  sharedAt: string;
  revokedAt: string | null;
}>;

export const FUNDS_VERIFICATION_TTL_DAYS = 30;

export function isFundsVerificationFresh(
  receipt: Pick<FundsVerificationReceipt, "expiresAt">,
  now = new Date()
): boolean {
  return new Date(receipt.expiresAt) > now;
}

/** Failed, stale, disputed, revoked, or non-provider results produce no badge. */
export function toFundsVerificationFreshnessView(
  receipt: FundsVerificationReceipt,
  now = new Date()
): FundsVerificationFreshnessView | null {
  if (
    receipt.status !== "verified" ||
    receipt.evidenceStrength !== "provider_verified" ||
    !isFundsVerificationFresh(receipt, now)
  ) {
    return null;
  }

  return Object.freeze({
    label: "Funds verified",
    verifiedAt: receipt.observedAt,
    expiresAt: receipt.expiresAt,
    provider: receipt.provider
  });
}

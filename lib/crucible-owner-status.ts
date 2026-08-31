export const storedVerificationStatuses = [
  "none",
  "sandbox_pending",
  "sandbox_verified",
  "live_verified"
] as const;

export type StoredVerificationStatus = (typeof storedVerificationStatuses)[number];

export type OwnerVerificationStatus = {
  identity: StoredVerificationStatus;
  funds: "none" | "legacy_unbacked";
};

export type OwnerCrucibleCardState =
  | "ready_to_start"
  | "sandbox_pending"
  | "sandbox_verified"
  | "live_verified"
  | "legacy_unbacked"
  | "unavailable";

export function normalizeStoredVerificationStatus(value: unknown): StoredVerificationStatus {
  return typeof value === "string" && storedVerificationStatuses.includes(value as StoredVerificationStatus)
    ? (value as StoredVerificationStatus)
    : "none";
}

export function ownerVerificationStatusFromProfile(profile: {
  id_status?: unknown;
  funds_status?: unknown;
} | null): OwnerVerificationStatus {
  return {
    identity: normalizeStoredVerificationStatus(profile?.id_status),
    funds: normalizeStoredVerificationStatus(profile?.funds_status) === "none" ? "none" : "legacy_unbacked"
  };
}

export function cardStateForStoredVerificationStatus(
  status: StoredVerificationStatus | "legacy_unbacked"
): OwnerCrucibleCardState {
  return status === "none" ? "ready_to_start" : status;
}

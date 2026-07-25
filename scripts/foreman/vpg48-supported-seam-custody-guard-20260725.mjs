#!/usr/bin/env node

export const VPG48_CYCLE_ID = "WERKLES-FLOCK-20260725-013031-ET-BETSY-01";
export const VPG48_SUPPORTED_SEAM_SCHEMA =
  "werkles.vpg48-supported-seam-custody/v1";
export const VPG48_SYNTHETIC_SUPABASE_ORIGIN =
  "https://vpg48-local-only.supabase.co";
export const VPG48_SYNTHETIC_ANON_KEY = "vpg48-local-anon-key";

function addReason(reasons, code, detail = null) {
  if (!reasons.some((reason) => reason.code === code)) {
    reasons.push({ code, detail });
  }
}

function parsedUrl(value) {
  try {
    return new URL(String(value));
  } catch {
    return null;
  }
}

function sortedStrings(value) {
  return Array.isArray(value)
    ? [...new Set(value.map((entry) => String(entry)))].sort()
    : [];
}

function exactStringSet(value, expected) {
  const actual = sortedStrings(value);
  const wanted = sortedStrings(expected);
  return (
    actual.length === wanted.length &&
    actual.every((entry, index) => entry === wanted[index])
  );
}

function canonicalInterceptions(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => ({
      pattern: String(entry?.pattern ?? ""),
      method: String(entry?.method ?? ""),
      action: String(entry?.action ?? ""),
      boundary: String(entry?.boundary ?? "")
    }))
    .sort((left, right) =>
      JSON.stringify(left).localeCompare(JSON.stringify(right))
    );
}

function exactInterceptions(value, expected) {
  return (
    JSON.stringify(canonicalInterceptions(value)) ===
    JSON.stringify(canonicalInterceptions(expected))
  );
}

export function evaluateVpg48SupportedSeamCustody(input) {
  const reasons = [];
  if (input?.schema !== VPG48_SUPPORTED_SEAM_SCHEMA) {
    addReason(reasons, "INVALID_SCHEMA");
  }
  if (input?.testOnly !== true) addReason(reasons, "TEST_ONLY_REQUIRED");
  if (input?.operation !== "LOCAL_BROWSER_ACCEPTANCE") {
    addReason(reasons, "LOCAL_ACCEPTANCE_OPERATION_REQUIRED");
  }
  if (input?.runtimeEnvironment !== "local-test") {
    addReason(reasons, "LOCAL_TEST_ENVIRONMENT_REQUIRED");
  }

  const candidate = input?.candidate ?? {};
  const expectedOrigin = parsedUrl(candidate.expectedOrigin);
  const observedOrigin = parsedUrl(candidate.observedOrigin);
  if (
    !expectedOrigin ||
    !["127.0.0.1", "localhost"].includes(expectedOrigin.hostname)
  ) {
    addReason(reasons, "LOOPBACK_REQUIRED");
  }
  if (!expectedOrigin?.port) addReason(reasons, "EXPLICIT_ISOLATED_PORT_REQUIRED");
  if (expectedOrigin?.port === "3000") addReason(reasons, "PORT_3000_FORBIDDEN");
  if (
    !observedOrigin ||
    observedOrigin.href !== expectedOrigin?.href
  ) {
    addReason(reasons, "OBSERVED_ORIGIN_MISMATCH");
  }
  if (
    !Number.isInteger(candidate.expectedPid) ||
    candidate.expectedPid <= 0 ||
    candidate.observedPid !== candidate.expectedPid
  ) {
    addReason(reasons, "PID_CUSTODY_MISMATCH");
  }
  if (
    typeof candidate.expectedBuildId !== "string" ||
    candidate.expectedBuildId.trim().length === 0 ||
    candidate.observedBuildId !== candidate.expectedBuildId
  ) {
    addReason(reasons, "BUILD_CUSTODY_MISMATCH");
  }

  const synthetic = input?.syntheticSupabase ?? {};
  if (synthetic.origin !== VPG48_SYNTHETIC_SUPABASE_ORIGIN) {
    addReason(reasons, "SYNTHETIC_ORIGIN_REQUIRED");
  }
  if (synthetic.anonKey !== VPG48_SYNTHETIC_ANON_KEY) {
    addReason(reasons, "SYNTHETIC_ANON_KEY_REQUIRED");
  }
  if (synthetic.credentialClass !== "synthetic-only") {
    addReason(reasons, "SYNTHETIC_CREDENTIAL_CLASS_REQUIRED");
  }
  if (synthetic.nonSyntheticCredentialCount !== 0) {
    addReason(reasons, "NON_SYNTHETIC_CREDENTIAL_FORBIDDEN");
  }

  const network = input?.network ?? {};
  const expectedAllowedOrigins = expectedOrigin
    ? [expectedOrigin.origin, VPG48_SYNTHETIC_SUPABASE_ORIGIN]
    : [VPG48_SYNTHETIC_SUPABASE_ORIGIN];
  if (!exactStringSet(network.allowedOrigins, expectedAllowedOrigins)) {
    addReason(reasons, "NETWORK_ALLOWLIST_MISMATCH");
  }
  if (network.fallthrough !== "abort") {
    addReason(reasons, "NETWORK_FALLTHROUGH_MUST_ABORT");
  }
  const expectedInterceptions = expectedOrigin
    ? [
        {
          pattern: `${expectedOrigin.origin}/api/bellows/recommendations/personal`,
          method: "GET",
          action: "fulfill",
          boundary: "personal-response-contract"
        },
        {
          pattern: `${VPG48_SYNTHETIC_SUPABASE_ORIGIN}/**`,
          method: "ANY",
          action: "fulfill_or_abort",
          boundary: "synthetic-supabase-only"
        }
      ]
    : [];
  if (!exactInterceptions(network.interceptions, expectedInterceptions)) {
    addReason(reasons, "INTERCEPTION_SCOPE_MISMATCH");
  }

  const implementation = input?.implementation ?? {};
  if (implementation.compiledChunkRewrite !== false) {
    addReason(reasons, "COMPILED_CHUNK_REWRITE_FORBIDDEN");
  }
  if (
    !Array.isArray(implementation.compiledChunkRoutes) ||
    implementation.compiledChunkRoutes.length !== 0
  ) {
    addReason(reasons, "COMPILED_CHUNK_ROUTE_FORBIDDEN");
  }
  if (
    !Array.isArray(implementation.sourceNeedles) ||
    implementation.sourceNeedles.length !== 0
  ) {
    addReason(reasons, "SOURCE_NEEDLE_FORBIDDEN");
  }
  if (implementation.productBypass !== false) {
    addReason(reasons, "PRODUCT_BYPASS_FORBIDDEN");
  }
  if (
    !Array.isArray(implementation.productFilesModified) ||
    implementation.productFilesModified.length !== 0
  ) {
    addReason(reasons, "PRODUCT_MODIFICATION_FORBIDDEN");
  }
  if (implementation.configSource !== "synthetic-build-env") {
    addReason(reasons, "SUPPORTED_CONFIG_SOURCE_REQUIRED");
  }

  const port3000 = input?.port3000 ?? {};
  if (
    port3000.targeted !== false ||
    port3000.touched !== false ||
    port3000.action !== "none"
  ) {
    addReason(reasons, "PORT_3000_CUSTODY_VIOLATION");
  }
  if (
    !Number.isInteger(port3000.observedPid) ||
    port3000.observedPid <= 0 ||
    typeof port3000.ownerRoot !== "string" ||
    port3000.ownerRoot.trim().length === 0
  ) {
    addReason(reasons, "PORT_3000_OWNER_PROOF_REQUIRED");
  }

  return {
    allowed: reasons.length === 0,
    verdict: reasons.length === 0 ? "PASS" : "BLOCKED",
    reasons
  };
}

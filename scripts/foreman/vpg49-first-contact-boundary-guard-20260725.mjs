#!/usr/bin/env node

export const VPG49_TOPOLOGY_SCHEMA =
  "werkles.vpg49-first-contact-topology-evidence/v1";
export const VPG49_STATE_SCHEMA =
  "werkles.vpg49-state-auth-boundary-evidence/v1";

function addReason(reasons, code, detail = null) {
  if (!reasons.some((reason) => reason.code === code)) {
    reasons.push({ code, detail });
  }
}

function exactStrings(actual, expected) {
  if (!Array.isArray(actual)) return false;
  const left = [...new Set(actual.map(String))].sort();
  const right = [...new Set(expected.map(String))].sort();
  return (
    left.length === right.length &&
    left.every((entry, index) => entry === right[index])
  );
}

export function evaluateVpg49Topology(input, policy) {
  const reasons = [];
  if (input?.schema !== VPG49_TOPOLOGY_SCHEMA) {
    addReason(reasons, "INVALID_TOPOLOGY_SCHEMA");
  }

  const counts = input?.bellowsDestinationCounts ?? {};
  for (const route of [
    "/bellows/recommendations",
    "/dashboard/profile?next=%2Fbellows%2Frecommendations",
    "/bellows/intake"
  ]) {
    if (counts[route] !== 1) {
      addReason(reasons, "BELLOWS_DESTINATION_NOT_UNIQUE", {
        route,
        count: counts[route]
      });
    }
  }

  const baseline = policy?.baseline ?? {};
  const duplicateReduction =
    Number(baseline.bellowsDuplicateExcess ?? 0) -
    Number(input?.bellowsDuplicateExcess ?? 0);
  if (
    duplicateReduction <
    Number(policy?.minimumBellowsDuplicateReduction ?? 0)
  ) {
    addReason(reasons, "BELLOWS_DUPLICATE_REDUCTION_REQUIRED", {
      duplicateReduction
    });
  }
  if (input?.bellowsPrimaryCount !== 1) {
    addReason(reasons, "BELLOWS_ONE_PRIMARY_REQUIRED");
  }

  const homeReduction =
    Number(baseline.homeMainAccountTrustLinkCount ?? 0) -
    Number(input?.homeMainAccountTrustLinkCount ?? 0);
  if (
    input?.homeMainAccountTrustLinkCount >
      Number(policy?.maximumHomeMainAccountTrustLinks ?? 0) ||
    homeReduction < Number(policy?.minimumHomeMainLinkReduction ?? 0)
  ) {
    addReason(reasons, "HOME_ENTRY_REDUCTION_REQUIRED", {
      count: input?.homeMainAccountTrustLinkCount,
      homeReduction
    });
  }

  for (const [surface, expected] of Object.entries(
    policy?.requiredDecisionSurfaces ?? {}
  )) {
    const observed = input?.decisionSurfaces?.[surface];
    if (!observed) {
      addReason(reasons, "DECISION_SURFACE_MISSING", surface);
      continue;
    }
    if (observed.primaryCount !== expected.primaryCount) {
      addReason(reasons, "ONE_PRIMARY_HIERARCHY_REQUIRED", {
        surface,
        primaryCount: observed.primaryCount
      });
    }
    if (observed.primaryRoute !== expected.primaryRoute) {
      addReason(reasons, "PRIMARY_ROUTE_DRIFT", {
        surface,
        route: observed.primaryRoute
      });
    }
  }

  if (!Array.isArray(input?.missingRequiredRoutes)) {
    addReason(reasons, "REQUIRED_ROUTE_PROOF_MISSING");
  } else if (input.missingRequiredRoutes.length > 0) {
    addReason(reasons, "REQUIRED_ROUTE_MISSING", input.missingRequiredRoutes);
  }
  if (!Array.isArray(input?.newRoutes) || input.newRoutes.length > 0) {
    addReason(reasons, "NEW_FIRST_CONTACT_ROUTE_FORBIDDEN", input?.newRoutes);
  }
  if (input?.unsafeReturnCount !== 0) {
    addReason(reasons, "UNSAFE_RETURN_TARGET", input?.unsafeReturnCount);
  }
  if (input?.promotedSecondaryCount !== 0) {
    addReason(
      reasons,
      "SECONDARY_ACTION_PROMOTED",
      input?.promotedSecondaryCount
    );
  }
  if (input?.closedIntakeTruthCount < 1) {
    addReason(reasons, "CLOSED_INTAKE_TRUTH_REQUIRED");
  }
  if (input?.accessibleNameErrors !== 0) {
    addReason(reasons, "ACCESSIBLE_NAME_REQUIRED", input?.accessibleNameErrors);
  }
  if (input?.headingReferenceErrors !== 0) {
    addReason(
      reasons,
      "HEADING_RELATIONSHIP_REQUIRED",
      input?.headingReferenceErrors
    );
  }
  if (input?.nestedInteractiveErrors !== 0) {
    addReason(
      reasons,
      "NESTED_INTERACTIVE_FORBIDDEN",
      input?.nestedInteractiveErrors
    );
  }
  if (input?.duplicateIdErrors !== 0) {
    addReason(reasons, "DUPLICATE_ID_FORBIDDEN", input?.duplicateIdErrors);
  }
  const legacy = input?.legacySupersession ?? {};
  if (
    !exactStrings(
      legacy.supersededAssertions,
      policy?.supersededLegacyTopologyAssertions ?? []
    )
  ) {
    addReason(reasons, "LEGACY_SUPERSESSION_MAP_REQUIRED");
  }
  if (legacy.staleTopologyRestoredCount !== 0) {
    addReason(
      reasons,
      "STALE_TOPOLOGY_RESTORED",
      legacy.staleTopologyRestoredCount
    );
  }
  if (legacy.successorIntentFailureCount !== 0) {
    addReason(
      reasons,
      "LEGACY_INTENT_NOT_PRESERVED",
      legacy.successorIntentFailureCount
    );
  }

  return {
    allowed: reasons.length === 0,
    verdict: reasons.length === 0 ? "PASS" : "BLOCKED",
    reasons
  };
}

export function evaluateVpg49StateBoundary(input, policy) {
  const reasons = [];
  if (input?.schema !== VPG49_STATE_SCHEMA) {
    addReason(reasons, "INVALID_STATE_SCHEMA");
  }
  if (!exactStrings(input?.states, policy?.requiredStates ?? [])) {
    addReason(reasons, "STATE_COVERAGE_MISMATCH");
  }
  for (const [state, expected] of Object.entries(
    policy?.requiredNextSteps ?? {}
  )) {
    if (input?.nextSteps?.[state] !== expected) {
      addReason(reasons, "STATE_NEXT_STEP_MISMATCH", {
        state,
        expected,
        actual: input?.nextSteps?.[state]
      });
    }
  }
  if (
    input?.maximumTransientCopyWordsObserved >
    policy?.maximumTransientCopyWords
  ) {
    addReason(reasons, "TRANSIENT_COPY_TOO_DENSE");
  }
  if (
    input?.signedOutDoorwayWords >
    policy?.maximumSignedOutDoorwayWords
  ) {
    addReason(reasons, "SIGNED_OUT_COPY_TOO_DENSE");
  }
  if (input?.exampleFallbackPreserved !== true) {
    addReason(reasons, "EXAMPLE_FALLBACK_REQUIRED");
  }
  if (input?.closedIntakeTruthPreserved !== true) {
    addReason(reasons, "CLOSED_INTAKE_TRUTH_REQUIRED");
  }
  if (input?.custodyTruthPreserved !== true) {
    addReason(reasons, "CUSTODY_TRUTH_REQUIRED");
  }
  if (input?.privateSentinelLeakCount !== 0) {
    addReason(reasons, "PRIVATE_SENTINEL_LEAK");
  }
  if (input?.unsafeReturnCount !== 0) {
    addReason(reasons, "UNSAFE_RETURN_TARGET");
  }

  const auth = input?.auth ?? {};
  if (auth.exactBearer !== true || auth.getUserValidation !== true) {
    addReason(reasons, "AUTH_BEARER_BOUNDARY_WEAKENED");
  }
  if (auth.ownerSource !== "auth.user.id") {
    addReason(reasons, "OWNER_BINDING_WEAKENED");
  }
  if (auth.missingOrInvalidStatus !== 401) {
    addReason(reasons, "PERSONAL_AUTH_STATUS_WEAKENED");
  }

  const routes = input?.routes ?? {};
  if (
    routes.personalMethod !== "GET" ||
    routes.personalWrongMethodStatus !== 405
  ) {
    addReason(reasons, "PERSONAL_METHOD_BOUNDARY_WEAKENED");
  }
  if (routes.packetPostStatus !== 403) {
    addReason(reasons, "PACKET_GATE_WEAKENED");
  }
  if (routes.intakePostStatus !== 503) {
    addReason(reasons, "INTAKE_GATE_WEAKENED");
  }

  const response = input?.response ?? {};
  if (
    response.cacheControl !== "private, no-store" ||
    response.pragma !== "no-cache" ||
    response.vary !== "Authorization"
  ) {
    addReason(reasons, "PRIVATE_CACHE_BOUNDARY_WEAKENED");
  }
  if (response.persisted !== false) {
    addReason(reasons, "PERSISTENCE_BOUNDARY_WEAKENED");
  }
  if (input?.writeCount !== 0 || input?.directStorageCallCount !== 0) {
    addReason(reasons, "WRITE_OR_STORAGE_LEAK");
  }
  if (input?.absoluteNetworkTargetCount !== 0) {
    addReason(reasons, "NETWORK_TARGET_LEAK");
  }
  if (
    !Array.isArray(input?.boundarySourceDrift) ||
    input.boundarySourceDrift.length > 0
  ) {
    addReason(reasons, "BOUNDARY_SOURCE_DRIFT", input?.boundarySourceDrift);
  }

  return {
    allowed: reasons.length === 0,
    verdict: reasons.length === 0 ? "PASS" : "BLOCKED",
    reasons
  };
}

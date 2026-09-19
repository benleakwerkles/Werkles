/**
 * Pooka preordained approval — dormant / synthetic only.
 *
 * Decision payloads bind to the same review_sha256 and catalog_sha256 as
 * the compiled review. This module never creates live signing-key custody,
 * never collects credentials, and never performs provider sign-in or UAC.
 */

import {
  assertCompiledReviewIntegrity,
  buildTrustedDisplayBytes,
  reviewSha256FromDisplayBytes
} from "./pooka-preapp-action-catalog.mjs";

export const PREAPP_DECISION_SCHEMA = "pooka.preapp.decision_payload.v1";

const LIVE_INTENTS = new Set([
  "live_approve",
  "live_sign",
  "uac_elevate",
  "enter_credentials",
  "provider_sign_in",
  "create_signing_key"
]);

export function bindDecisionHashes(compiledReview) {
  assertCompiledReviewIntegrity(compiledReview);
  const displayBytes = buildTrustedDisplayBytes(compiledReview);
  const display_sha256 = reviewSha256FromDisplayBytes(displayBytes);
  if (display_sha256 !== compiledReview.review_sha256) {
    throw new Error("decision_display_binding_mismatch");
  }
  return {
    catalog_sha256: compiledReview.catalog_sha256,
    review_sha256: compiledReview.review_sha256,
    display_sha256,
    selected_requirement_identifiers: [
      ...compiledReview.selected_requirement_identifiers
    ]
  };
}

export function buildSyntheticDecisionPayload(
  compiledReview,
  { intent = "review_only" } = {}
) {
  if (LIVE_INTENTS.has(intent)) {
    throw new Error(`live_approval_unsupported:${intent}`);
  }
  if (intent !== "review_only" && intent !== "synthetic_ack") {
    throw new Error(`unknown_decision_intent:${intent}`);
  }

  const bound = bindDecisionHashes(compiledReview);

  return Object.freeze({
    schema: PREAPP_DECISION_SCHEMA,
    catalog_sha256: bound.catalog_sha256,
    review_sha256: bound.review_sha256,
    display_sha256: bound.display_sha256,
    selected_requirement_identifiers: bound.selected_requirement_identifiers,
    intent: intent === "synthetic_ack" ? "synthetic_ack" : "review_only",
    dormant: true,
    live_signing_key_custody: false,
    executes_selected_actions: false,
    uac_performed: false,
    credentials_collected: false,
    provider_sign_in_performed: false
  });
}

export function assertDecisionBindsToReview(decisionPayload, compiledReview) {
  assertCompiledReviewIntegrity(compiledReview);
  if (!decisionPayload || decisionPayload.schema !== PREAPP_DECISION_SCHEMA) {
    throw new Error("invalid_decision_schema");
  }
  if (decisionPayload.catalog_sha256 !== compiledReview.catalog_sha256) {
    throw new Error("decision_catalog_sha256_mismatch");
  }
  if (decisionPayload.review_sha256 !== compiledReview.review_sha256) {
    throw new Error("decision_review_sha256_mismatch");
  }
  if (decisionPayload.display_sha256 !== compiledReview.review_sha256) {
    throw new Error("decision_display_sha256_mismatch");
  }
  const expectedIds = compiledReview.selected_requirement_identifiers.join("\n");
  const payloadIds = (decisionPayload.selected_requirement_identifiers || []).join(
    "\n"
  );
  if (expectedIds !== payloadIds) {
    throw new Error("decision_selected_ids_mismatch");
  }
  if (decisionPayload.live_signing_key_custody === true) {
    throw new Error("live_signing_key_custody_forbidden");
  }
  if (decisionPayload.dormant !== true) {
    throw new Error("non_dormant_decision_forbidden");
  }
  return true;
}

export function refuseLiveSigningKeyCustody() {
  return Object.freeze({
    ok: false,
    code: "live_signing_key_custody_forbidden",
    live_signing_key_custody: false
  });
}

export function activateApprovalControl({ live = false } = {}) {
  if (live) {
    throw new Error("approval_control_must_remain_dormant");
  }
  return Object.freeze({
    state: "dormant",
    synthetic: true,
    live: false,
    note: "Approval control is dormant. Rendering a checklist does not authorize or execute it."
  });
}

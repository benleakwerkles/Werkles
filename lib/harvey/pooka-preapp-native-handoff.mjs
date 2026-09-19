/**
 * Pooka PreApp native handoff — machine + receiver binding only.
 *
 * Separates internal approval, UAC, credentials, provider sign-in, and
 * unsupported actions. Does not perform elevation, collect secrets, open
 * provider sessions, or create live signing keys.
 */

import {
  PREAPP_ACTION_CHANNELS,
  assertCompiledReviewIntegrity
} from "./pooka-preapp-action-catalog.mjs";

export const PREAPP_NATIVE_HANDOFF_SCHEMA = "pooka.preapp.native_handoff.v1";

export const CHANNEL_ROUTING = Object.freeze({
  internal_approval: "dormant_synthetic_ack_only",
  uac: "operator_owned_supported_windows_elevation",
  credentials: "blocked_no_secret_entry",
  provider_sign_in: "blocked_not_exercised",
  unsupported: "blocked_unsupported"
});

export function routeChannel(channel) {
  if (!PREAPP_ACTION_CHANNELS.includes(channel)) {
    throw new Error(`unknown_channel:${channel}`);
  }
  return CHANNEL_ROUTING[channel];
}

export function buildNativeHandoff(compiledReview) {
  assertCompiledReviewIntegrity(compiledReview);

  const channel_actions = Object.fromEntries(
    PREAPP_ACTION_CHANNELS.map((channel) => [
      channel,
      compiledReview.selected_actions
        .filter((action) => action.channel === channel)
        .map((action) => action.id)
    ])
  );

  return Object.freeze({
    schema: PREAPP_NATIVE_HANDOFF_SCHEMA,
    catalog_sha256: compiledReview.catalog_sha256,
    review_sha256: compiledReview.review_sha256,
    machine: compiledReview.machine,
    receiver: compiledReview.receiver,
    expiration: compiledReview.expiration,
    channel_routing: CHANNEL_ROUTING,
    channel_actions: Object.freeze(channel_actions),
    live_provider_action: false,
    live_signing_key_custody: false,
    uac_automated: false,
    credentials_accepted: false,
    note: "Native handoff binds machine and receiver to the compiled review hashes. It does not execute selected actions."
  });
}

export function assertHandoffBindsToReview(handoff, compiledReview) {
  assertCompiledReviewIntegrity(compiledReview);
  if (!handoff || handoff.schema !== PREAPP_NATIVE_HANDOFF_SCHEMA) {
    throw new Error("invalid_handoff_schema");
  }
  if (handoff.catalog_sha256 !== compiledReview.catalog_sha256) {
    throw new Error("handoff_catalog_sha256_mismatch");
  }
  if (handoff.review_sha256 !== compiledReview.review_sha256) {
    throw new Error("handoff_review_sha256_mismatch");
  }
  if (handoff.machine !== compiledReview.machine) {
    throw new Error("handoff_machine_mismatch");
  }
  if (handoff.receiver !== compiledReview.receiver) {
    throw new Error("handoff_receiver_mismatch");
  }
  if (handoff.live_provider_action === true) {
    throw new Error("live_provider_action_forbidden");
  }
  if (handoff.live_signing_key_custody === true) {
    throw new Error("live_signing_key_custody_forbidden");
  }
  if (handoff.uac_automated === true) {
    throw new Error("automated_uac_forbidden");
  }
  if (handoff.credentials_accepted === true) {
    throw new Error("credential_acceptance_forbidden");
  }
  return true;
}

export function refuseUnsupportedExecution(requirementId) {
  return Object.freeze({
    ok: false,
    code: "unsupported_or_blocked_channel",
    requirement_id: requirementId,
    executed: false
  });
}

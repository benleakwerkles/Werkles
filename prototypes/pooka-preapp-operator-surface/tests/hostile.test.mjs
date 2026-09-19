import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  compileFixtureOperatorReview,
  compilePreappReview,
  catalogSha256,
  DEFAULT_FIXTURE_REVIEW_INPUTS
} from "../../../lib/harvey/pooka-preapp-action-catalog.mjs";
import {
  activateApprovalControl,
  assertDecisionBindsToReview,
  buildSyntheticDecisionPayload,
  refuseLiveSigningKeyCustody
} from "../../../lib/harvey/pooka-preordained-approval.mjs";
import {
  assertHandoffBindsToReview,
  buildNativeHandoff,
  refuseUnsupportedExecution
} from "../../../lib/harvey/pooka-preapp-native-handoff.mjs";
import { renderOperatorSurfaceHtml } from "../src/operator-surface.mjs";
import { bindDisplayedBytesToReview } from "../src/displayed-bytes.mjs";

const review = compileFixtureOperatorReview();

describe("hostile cases — tamper, hide, live keys, channel confusion", () => {
  it("rejects a mutated title as invented display bytes", () => {
    const html = renderOperatorSurfaceHtml(review).replace(
      /<dd id="field-title"[^>]*>[\s\S]*?<\/dd>/,
      '<dd id="field-title" data-trusted-field="title" aria-labelledby="field-title-label" class="field-value">Totally harmless forged title</dd>'
    );
    assert.throws(
      () => bindDisplayedBytesToReview(html, review),
      /visible_fields_do_not_match_display_bytes|displayed_bytes_review_sha256_mismatch/
    );
  });

  it("rejects hiding a selected action from the surface", () => {
    const html = renderOperatorSurfaceHtml(review).replace(
      /<article[\s\S]*data-selected-requirement-id="preapp.unsupported.live_signing_key_custody"[\s\S]*?<\/article>/,
      ""
    );
    assert.throws(
      () => bindDisplayedBytesToReview(html, review),
      /hidden_or_extra_selected_actions|selected_action/
    );
  });

  it("rejects a decision payload bound to a different review hash", () => {
    const other = compilePreappReview({
      ...DEFAULT_FIXTURE_REVIEW_INPUTS,
      machine: "not-doss"
    });
    const forged = {
      ...buildSyntheticDecisionPayload(review),
      review_sha256: other.review_sha256,
      display_sha256: other.review_sha256
    };
    assert.notEqual(other.review_sha256, review.review_sha256);
    assert.throws(
      () => assertDecisionBindsToReview(forged, review),
      /decision_review_sha256_mismatch/
    );
  });

  it("rejects a decision payload bound to a different catalog hash", () => {
    const forged = {
      ...buildSyntheticDecisionPayload(review),
      catalog_sha256: "0".repeat(64)
    };
    assert.notEqual(forged.catalog_sha256, catalogSha256());
    assert.throws(
      () => assertDecisionBindsToReview(forged, review),
      /decision_catalog_sha256_mismatch/
    );
  });

  it("refuses live approval intents, live signing keys, and live approval controls", () => {
    assert.throws(
      () => buildSyntheticDecisionPayload(review, { intent: "live_approve" }),
      /live_approval_unsupported:live_approve/
    );
    assert.throws(
      () => buildSyntheticDecisionPayload(review, { intent: "create_signing_key" }),
      /live_approval_unsupported:create_signing_key/
    );
    assert.throws(
      () => buildSyntheticDecisionPayload(review, { intent: "enter_credentials" }),
      /live_approval_unsupported:enter_credentials/
    );
    assert.throws(
      () => buildSyntheticDecisionPayload(review, { intent: "provider_sign_in" }),
      /live_approval_unsupported:provider_sign_in/
    );
    assert.throws(
      () => buildSyntheticDecisionPayload(review, { intent: "uac_elevate" }),
      /live_approval_unsupported:uac_elevate/
    );
    assert.equal(refuseLiveSigningKeyCustody().ok, false);
    assert.equal(refuseLiveSigningKeyCustody().live_signing_key_custody, false);
    assert.throws(
      () => activateApprovalControl({ live: true }),
      /approval_control_must_remain_dormant/
    );
    const dormant = activateApprovalControl({ live: false });
    assert.equal(dormant.state, "dormant");
    assert.equal(dormant.live, false);
  });

  it("rejects live signing-key custody on a compiled review", () => {
    const html = renderOperatorSurfaceHtml(review);
    bindDisplayedBytesToReview(html, review);
    const poisoned = { ...review, live_signing_key_custody: true };
    assert.throws(
      () => buildSyntheticDecisionPayload(poisoned),
      /live_signing_key_custody_forbidden/
    );
  });

  it("keeps native handoff from performing UAC, credentials, provider, or unsupported execution", () => {
    const handoff = buildNativeHandoff(review);
    assertHandoffBindsToReview(handoff, review);
    assert.equal(handoff.uac_automated, false);
    assert.equal(handoff.credentials_accepted, false);
    assert.equal(handoff.live_provider_action, false);
    assert.equal(handoff.live_signing_key_custody, false);
    assert.equal(
      handoff.channel_routing.internal_approval,
      "dormant_synthetic_ack_only"
    );
    assert.equal(
      handoff.channel_routing.uac,
      "operator_owned_supported_windows_elevation"
    );
    assert.equal(handoff.channel_routing.credentials, "blocked_no_secret_entry");
    assert.equal(
      handoff.channel_routing.provider_sign_in,
      "blocked_not_exercised"
    );
    assert.equal(handoff.channel_routing.unsupported, "blocked_unsupported");
    const refused = refuseUnsupportedExecution(
      "preapp.unsupported.live_signing_key_custody"
    );
    assert.equal(refused.ok, false);
    assert.equal(refused.executed, false);
  });

  it("rejects unknown requirement identifiers instead of inventing display values", () => {
    assert.throws(
      () =>
        compilePreappReview({
          ...DEFAULT_FIXTURE_REVIEW_INPUTS,
          selectedRequirementIdentifiers: ["preapp.forged.invented_action"]
        }),
      /unknown_requirement_id:preapp.forged.invented_action/
    );
  });

  it("does not present credentials or provider actions as internal approval", () => {
    const html = renderOperatorSurfaceHtml(review);
    const credCard = html.match(
      /data-selected-requirement-id="preapp.credentials.private_entry_forbidden"[\s\S]*?<\/article>/
    );
    const providerCard = html.match(
      /data-selected-requirement-id="preapp.provider.sign_in_not_exercised"[\s\S]*?<\/article>/
    );
    const uacCard = html.match(
      /data-selected-requirement-id="preapp.uac.supported_windows_elevation"[\s\S]*?<\/article>/
    );
    assert.ok(credCard);
    assert.ok(providerCard);
    assert.ok(uacCard);
    assert.match(credCard[0], /data-channel="credentials"/);
    assert.doesNotMatch(credCard[0], /data-channel="internal_approval"/);
    assert.match(providerCard[0], /data-channel="provider_sign_in"/);
    assert.doesNotMatch(providerCard[0], /data-channel="internal_approval"/);
    assert.match(uacCard[0], /data-channel="uac"/);
    assert.doesNotMatch(uacCard[0], /data-channel="internal_approval"/);
  });
});

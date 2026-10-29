import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  compileFixtureOperatorReview,
  catalogSha256,
  reviewSha256FromDisplayBytes,
  buildTrustedDisplayBytes
} from "../../../lib/harvey/pooka-preapp-action-catalog.mjs";
import {
  buildSyntheticDecisionPayload,
  assertDecisionBindsToReview
} from "../../../lib/harvey/pooka-preordained-approval.mjs";
import { renderOperatorSurfaceHtml } from "../src/operator-surface.mjs";
import {
  bindDisplayedBytesToReview,
  extractSelectedRequirementIds,
  extractVisibleTrustedFields
} from "../src/displayed-bytes.mjs";

const review = compileFixtureOperatorReview();
const html = renderOperatorSurfaceHtml(review);

describe("accessibility — operator review surface", () => {
  it("exposes a page language, main landmark, and labelled headings", () => {
    assert.match(html, /<html lang="en">/);
    assert.match(html, /role="main"/);
    assert.match(html, /aria-labelledby="review-title"/);
    assert.match(html, /<h1 id="review-title"/);
    assert.match(html, /Skip to selected requirements/);
    assert.match(html, /href="#selected-actions"/);
  });

  it("gives screen-reader labels to trusted fields and the dormant control", () => {
    for (const key of [
      "title",
      "consequence",
      "reversibility",
      "administrator_requirement",
      "channel",
      "resource_digest",
      "expiration",
      "machine",
      "receiver",
      "selected_requirement_identifiers"
    ]) {
      assert.match(html, new RegExp(`id="field-${key}-label"`));
      assert.match(
        html,
        new RegExp(`aria-labelledby="field-${key}-label"`)
      );
    }
    assert.match(html, /id="preapp-synthetic-ack"/);
    assert.match(html, /aria-disabled="true"/);
    assert.match(html, /aria-describedby="ack-dormant-help"/);
    assert.match(html, /aria-label="Channel: Internal approval"/);
    assert.match(html, /aria-label="Channel: UAC"/);
    assert.match(html, /aria-label="Channel: Credentials"/);
    assert.match(html, /aria-label="Channel: Provider sign-in"/);
    assert.match(html, /aria-label="Channel: Unsupported"/);
    assert.match(html, /<span class="visually-hidden">Requirement identifier: <\/span>/);
  });

  it("includes visible focus styles and does not remove focus outlines", () => {
    assert.match(html, /:focus-visible\s*\{/);
    assert.match(html, /outline: 3px solid/);
    assert.doesNotMatch(html, /outline:\s*none/);
    assert.doesNotMatch(html, /outline:\s*0\b/);
  });

  it("places every selected action in the keyboard tab order", () => {
    const cards = html.match(/tabindex="0"/g) || [];
    assert.equal(cards.length, review.selected_requirement_identifiers.length);
    for (const id of review.selected_requirement_identifiers) {
      assert.match(
        html,
        new RegExp(
          `tabindex="0"[\\s\\S]*data-selected-requirement-id="${id}"|data-selected-requirement-id="${id}"[\\s\\S]*tabindex="0"`
        )
      );
    }
    assert.match(html, /class="skip-link"/);
    assert.match(html, /id="preapp-synthetic-ack"/);
  });

  it("stacks into a single column at a narrow/mobile breakpoint", () => {
    assert.match(html, /@media \(max-width: 640px\)/);
    assert.match(html, /grid-template-columns: 1fr/);
    assert.match(html, /name="viewport"/);
  });

  it("shows every selected action and never hides them", () => {
    const visible = extractSelectedRequirementIds(html);
    assert.deepEqual(visible, review.selected_requirement_identifiers);
    assert.equal(visible.length, 5);
    assert.doesNotMatch(html, /data-selected-requirement-id="[^"]+"[^>]*aria-hidden="true"/);
    assert.doesNotMatch(
      html,
      /\[data-selected-requirement-id\]\s*\{[^}]*display:\s*none/
    );
  });

  it("keeps internal approval, UAC, credentials, provider sign-in, and unsupported in separate lanes", () => {
    const lanes = [
      "internal_approval",
      "uac",
      "credentials",
      "provider_sign_in",
      "unsupported"
    ];
    for (const channel of lanes) {
      assert.match(html, new RegExp(`class="lane"[\\s\\S]*data-channel="${channel}"|data-channel="${channel}"`));
    }
    assert.match(html, /This lane is not UAC, credentials, or provider sign-in/);
    assert.match(html, /This surface cannot raise UAC/);
    assert.match(html, /No credential fields are offered/);
    assert.match(html, /Provider login and OAuth are not exercised here/);
    assert.match(html, /Unsupported actions cannot be approved/);
    assert.doesNotMatch(html, /<input[^>]*type="password"/i);
    assert.doesNotMatch(html, /<input[^>]*autocomplete="current-password"/i);
  });
});

describe("hash binding — displayed bytes and decision payload", () => {
  it("binds visible fields, JSON island, and decision payload to the same hashes", () => {
    const bound = bindDisplayedBytesToReview(html, review);
    assert.equal(bound.review_sha256, review.review_sha256);
    assert.equal(bound.catalog_sha256, review.catalog_sha256);
    assert.equal(bound.display_sha256, review.review_sha256);
    assert.equal(bound.catalog_sha256, catalogSha256());

    const visible = extractVisibleTrustedFields(html);
    assert.equal(visible.title, review.title);
    assert.equal(visible.consequence, review.consequence);
    assert.equal(visible.reversibility, review.reversibility);
    assert.equal(visible.administrator_requirement, review.administrator_requirement);
    assert.equal(visible.channel, review.channel);
    assert.equal(visible.resource_digest, review.resource_digest);
    assert.equal(visible.expiration, review.expiration);
    assert.equal(visible.machine, review.machine);
    assert.equal(visible.receiver, review.receiver);
    assert.deepEqual(
      visible.selected_requirement_identifiers,
      review.selected_requirement_identifiers
    );
    assert.equal(
      reviewSha256FromDisplayBytes(buildTrustedDisplayBytes(visible)),
      review.review_sha256
    );

    const decision = buildSyntheticDecisionPayload(review, { intent: "synthetic_ack" });
    assertDecisionBindsToReview(decision, review);
    assert.equal(decision.review_sha256, bound.review_sha256);
    assert.equal(decision.catalog_sha256, bound.catalog_sha256);
    assert.equal(decision.display_sha256, bound.review_sha256);
    assert.equal(decision.dormant, true);
    assert.equal(decision.live_signing_key_custody, false);
  });
});

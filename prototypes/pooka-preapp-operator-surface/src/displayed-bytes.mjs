/**
 * Extract trusted displayed bytes from the Operator surface HTML
 * and bind them to review_sha256 / catalog_sha256.
 */

import {
  TRUSTED_DISPLAY_FIELD_KEYS,
  assertCompiledReviewIntegrity,
  buildTrustedDisplayBytes,
  canonicalJson,
  reviewSha256FromDisplayBytes
} from "../../../lib/harvey/pooka-preapp-action-catalog.mjs";

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

export function extractJsonIsland(html) {
  const match = html.match(
    /<script type="application\/json" id="preapp-trusted-display-bytes">([\s\S]*?)<\/script>/
  );
  if (!match) {
    throw new Error("missing_trusted_display_bytes_island");
  }
  return match[1];
}

export function extractVisibleTrustedFields(html) {
  const fields = {};
  for (const key of TRUSTED_DISPLAY_FIELD_KEYS) {
    const pattern = new RegExp(
      `<dd id="field-${key}"[^>]*data-trusted-field="${key}"[^>]*>([\\s\\S]*?)</dd>`
    );
    const match = html.match(pattern);
    if (!match) {
      throw new Error(`missing_visible_trusted_field:${key}`);
    }
    const raw = decodeHtml(match[1].trim());
    fields[key] =
      key === "selected_requirement_identifiers"
        ? raw.split(", ").filter(Boolean)
        : raw;
  }
  return buildTrustedDisplayBytes(fields);
}

export function extractSelectedRequirementIds(html) {
  const ids = [];
  const pattern = /data-selected-requirement-id="([^"]+)"/g;
  let match;
  while ((match = pattern.exec(html))) {
    ids.push(decodeHtml(match[1]));
  }
  return ids;
}

export function extractBindingHashes(html) {
  const review = html.match(/data-review-sha256="([a-f0-9]{64})"/);
  const catalog = html.match(/data-catalog-sha256="([a-f0-9]{64})"/);
  if (!review || !catalog) {
    throw new Error("missing_binding_hashes");
  }
  return {
    review_sha256: review[1],
    catalog_sha256: catalog[1]
  };
}

export function assertNoHiddenSelectedActions(html, compiledReview) {
  const visibleIds = extractSelectedRequirementIds(html);
  const expected = compiledReview.selected_requirement_identifiers;
  if (visibleIds.length !== expected.length) {
    throw new Error("hidden_or_extra_selected_actions");
  }
  expected.forEach((id, index) => {
    if (visibleIds[index] !== id) {
      throw new Error(`selected_action_not_visible:${id}`);
    }
    const cardPattern = new RegExp(
      `data-selected-requirement-id="${id}"[\\s\\S]*?</article>`
    );
    const card = html.match(cardPattern);
    if (!card) {
      throw new Error(`selected_action_markup_missing:${id}`);
    }
    if (/display\s*:\s*none|visibility\s*:\s*hidden|aria-hidden="true"/i.test(card[0])) {
      throw new Error(`selected_action_hidden:${id}`);
    }
  });
  return true;
}

export function bindDisplayedBytesToReview(html, compiledReview) {
  assertCompiledReviewIntegrity(compiledReview);
  const island = JSON.parse(extractJsonIsland(html));
  const visible = extractVisibleTrustedFields(html);
  const islandCanonical = canonicalJson(buildTrustedDisplayBytes(island));
  const visibleCanonical = canonicalJson(visible);
  if (islandCanonical !== visibleCanonical) {
    throw new Error("visible_fields_do_not_match_display_bytes");
  }
  const displaySha = reviewSha256FromDisplayBytes(visible);
  const hashes = extractBindingHashes(html);
  if (displaySha !== compiledReview.review_sha256) {
    throw new Error("displayed_bytes_review_sha256_mismatch");
  }
  if (hashes.review_sha256 !== compiledReview.review_sha256) {
    throw new Error("html_review_sha256_mismatch");
  }
  if (hashes.catalog_sha256 !== compiledReview.catalog_sha256) {
    throw new Error("html_catalog_sha256_mismatch");
  }
  assertNoHiddenSelectedActions(html, compiledReview);
  return {
    catalog_sha256: hashes.catalog_sha256,
    review_sha256: hashes.review_sha256,
    display_sha256: displaySha
  };
}

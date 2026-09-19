/**
 * Isolated Operator review surface renderer.
 * Read-only-first. Copies trusted compiled-review fields only.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PREAPP_ACTION_CHANNELS,
  TRUSTED_DISPLAY_FIELD_KEYS,
  assertCompiledReviewIntegrity,
  buildTrustedDisplayBytes,
  canonicalJson
} from "../../../lib/harvey/pooka-preapp-action-catalog.mjs";
import { CHANNEL_ROUTING } from "../../../lib/harvey/pooka-preapp-native-handoff.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SURFACE_CSS = readFileSync(join(HERE, "operator-surface.css"), "utf8");

const CHANNEL_LABELS = {
  internal_approval: "Internal approval",
  uac: "UAC",
  credentials: "Credentials",
  provider_sign_in: "Provider sign-in",
  unsupported: "Unsupported"
};

const CHANNEL_SEPARATION = {
  internal_approval:
    "Dormant or synthetic acknowledgement only. This lane is not UAC, credentials, or provider sign-in.",
  uac: "Operator-owned supported Windows elevation. This surface cannot raise UAC or type an administrator password.",
  credentials:
    "Passwords, OTPs, and secrets stay outside this surface. No credential fields are offered.",
  provider_sign_in:
    "Provider login and OAuth are not exercised here.",
  unsupported:
    "Unsupported actions cannot be approved or executed from this review."
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fieldRow(key, value) {
  const id = `field-${key}`;
  const rendered = Array.isArray(value) ? value.join(", ") : value;
  return `<dt id="${id}-label">${escapeHtml(key.replaceAll("_", " "))}</dt>
<dd id="${id}" data-trusted-field="${escapeHtml(key)}" aria-labelledby="${id}-label" class="field-value">${escapeHtml(
    rendered
  )}</dd>`;
}

function actionCard(action, index) {
  const headingId = `selected-action-${index}-title`;
  const channelLabel = CHANNEL_LABELS[action.channel];
  return `<li>
<article
  class="action-card"
  tabindex="0"
  data-selected-requirement-id="${escapeHtml(action.id)}"
  data-channel="${escapeHtml(action.channel)}"
  aria-labelledby="${headingId}"
>
  <div class="channel-pill" aria-label="Channel: ${escapeHtml(channelLabel)}">${escapeHtml(
    channelLabel
  )}</div>
  <h3 id="${headingId}">${escapeHtml(action.title)}</h3>
  <p class="action-id"><span class="visually-hidden">Requirement identifier: </span>${escapeHtml(
    action.id
  )}</p>
  <p><strong>Consequence:</strong> ${escapeHtml(action.consequence)}</p>
  <p><strong>Reversibility:</strong> ${escapeHtml(action.reversibility)}</p>
  <p><strong>Administrator requirement:</strong> ${escapeHtml(
    action.administrator_requirement
  )}</p>
  <p><strong>Resource digest:</strong> <span class="hash">${escapeHtml(
    action.resource_digest
  )}</span></p>
  <p><strong>Approval class:</strong> ${escapeHtml(action.approval_class)}</p>
</article>
</li>`;
}

function channelLane(channel, compiledReview) {
  const ids = compiledReview.selected_actions
    .filter((action) => action.channel === channel)
    .map((action) => action.id);
  const label = CHANNEL_LABELS[channel];
  const headingId = `lane-${channel}-title`;
  const items =
    ids.length === 0
      ? `<p>No selected actions in this lane.</p>`
      : `<ul>${ids
          .map(
            (id) =>
              `<li data-lane-requirement-id="${escapeHtml(id)}">${escapeHtml(id)}</li>`
          )
          .join("")}</ul>`;
  return `<section class="lane" data-channel="${escapeHtml(
    channel
  )}" aria-labelledby="${headingId}">
  <h3 id="${headingId}">${escapeHtml(label)}</h3>
  <p>${escapeHtml(CHANNEL_SEPARATION[channel])}</p>
  <p><strong>Routing:</strong> ${escapeHtml(CHANNEL_ROUTING[channel])}</p>
  ${items}
</section>`;
}

export function renderOperatorSurfaceHtml(compiledReview) {
  assertCompiledReviewIntegrity(compiledReview);
  const displayBytes = buildTrustedDisplayBytes(compiledReview);
  const displayJson = canonicalJson(displayBytes);

  const fieldRows = TRUSTED_DISPLAY_FIELD_KEYS.map((key) =>
    fieldRow(key, displayBytes[key])
  ).join("\n");

  const actionCards = compiledReview.selected_actions
    .map((action, index) => actionCard(action, index))
    .join("\n");

  const lanes = PREAPP_ACTION_CHANNELS.map((channel) =>
    channelLane(channel, compiledReview)
  ).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(compiledReview.title)}</title>
<style>${SURFACE_CSS}</style>
</head>
<body>
<a class="skip-link" href="#selected-actions">Skip to selected requirements</a>
<div class="wrap">
<header class="banner">
  <p><strong>Read-only Operator surface.</strong> Rendering this checklist does not authorize or execute it.</p>
  <p>Approval remains dormant or synthetic. Live signing-key custody is not created. UAC, credentials, and provider sign-in are separated and not exercised here.</p>
</header>
<main id="operator-review" role="main" aria-labelledby="review-title" data-review-sha256="${escapeHtml(
    compiledReview.review_sha256
  )}" data-catalog-sha256="${escapeHtml(compiledReview.catalog_sha256)}">
  <h1 id="review-title" data-trusted-field="title">${escapeHtml(
    compiledReview.title
  )}</h1>

  <section class="hash-strip" aria-labelledby="binding-heading">
    <h2 id="binding-heading">Hash binding</h2>
    <p><strong>review_sha256:</strong> <span class="hash" data-binding="review_sha256">${escapeHtml(
      compiledReview.review_sha256
    )}</span></p>
    <p><strong>catalog_sha256:</strong> <span class="hash" data-binding="catalog_sha256">${escapeHtml(
      compiledReview.catalog_sha256
    )}</span></p>
    <p>Displayed bytes and any decision payload must bind to these same hashes.</p>
  </section>

  <section class="trusted-fields" aria-labelledby="trusted-fields-heading">
    <h2 id="trusted-fields-heading">Trusted compiled fields</h2>
    <dl class="trusted-list">
      ${fieldRows}
    </dl>
  </section>

  <section class="selected-actions" id="selected-actions" aria-labelledby="selected-heading">
    <h2 id="selected-heading">Selected requirement identifiers</h2>
    <p>Every selected identifier is visible. None may be hidden, off-screen, or display:none.</p>
    <ol>
      ${actionCards}
    </ol>
  </section>

  <section class="channel-lanes-wrap" aria-labelledby="lanes-heading">
    <h2 id="lanes-heading">Separated action classes</h2>
    <div class="lanes-grid">
      ${lanes}
    </div>
  </section>

  <section class="dormant-controls" aria-labelledby="dormant-heading">
    <h2 id="dormant-heading">Approval control (dormant)</h2>
    <p id="ack-dormant-help">This control is synthetic and dormant. It cannot sign, elevate, collect credentials, or talk to a provider.</p>
    <button
      type="button"
      id="preapp-synthetic-ack"
      aria-disabled="true"
      aria-describedby="ack-dormant-help"
    >Synthetic ack (dormant)</button>
  </section>
</main>
</div>
<script type="application/json" id="preapp-trusted-display-bytes">${displayJson}</script>
<script>
(function () {
  var button = document.getElementById("preapp-synthetic-ack");
  if (button) {
    function refuse(event) {
      event.preventDefault();
      event.stopPropagation();
      button.setAttribute("data-activation-refused", "true");
    }
    button.addEventListener("click", refuse);
    button.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") refuse(event);
    });
  }
  var params = new URLSearchParams(location.search);
  var focusTarget = params.get("focus");
  if (focusTarget === "selected") {
    var first = document.querySelector("[data-selected-requirement-id]");
    if (first) first.focus();
  } else if (focusTarget === "ack" && button) {
    button.focus();
  }
})();
</script>
</body>
</html>
`;
}

export { CHANNEL_LABELS, CHANNEL_SEPARATION };

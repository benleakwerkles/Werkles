/**
 * Pooka PreApp action catalog — trusted compile source.
 *
 * Isolated, read-only-first. Compiling or rendering a review does not
 * authorize or execute it. No live signing-key custody.
 *
 * Display strings for a compiled review MUST come from this catalog
 * (or from compile inputs machine/receiver/expiration). Do not invent
 * values at the Operator surface.
 */

import { createHash } from "node:crypto";

export const PREAPP_ACTION_CHANNELS = Object.freeze([
  "internal_approval",
  "uac",
  "credentials",
  "provider_sign_in",
  "unsupported"
]);

export const PREAPP_CATALOG_SCHEMA = "pooka.preapp.action_catalog.v1";
export const PREAPP_COMPILED_REVIEW_SCHEMA = "pooka.preapp.compiled_review.v1";

function sha256Hex(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/**
 * Deterministic JSON: sorted object keys, no whitespace, arrays in given order.
 */
export function canonicalJson(value) {
  if (value === null) return "null";
  const type = typeof value;
  if (type === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("canonical_json_non_finite_number");
    }
    return JSON.stringify(value);
  }
  if (type === "boolean") return value ? "true" : "false";
  if (type === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (type === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  throw new Error(`canonical_json_unserializable:${type}`);
}

export function sha256Canonical(value) {
  return sha256Hex(canonicalJson(value));
}

function digestResource(resource) {
  return sha256Canonical(resource);
}

function defineEntry({
  id,
  title,
  consequence,
  reversibility,
  administrator_requirement,
  channel,
  executable,
  approval_class
}) {
  if (!PREAPP_ACTION_CHANNELS.includes(channel)) {
    throw new Error(`unknown_channel:${channel}`);
  }
  const resource = {
    id,
    title,
    consequence,
    reversibility,
    administrator_requirement,
    channel,
    executable,
    approval_class
  };
  return Object.freeze({
    ...resource,
    resource_digest: digestResource(resource)
  });
}

/**
 * Frozen catalog entries. These bytes are the only trusted display source
 * for action-level fields. The specified upstream catalog checkpoint
 * `816fe92a6049beae0766e7e56bfcf1e2fa10aec0` was not present in this
 * checkout; catalog_sha256 is computed from these entries.
 */
export const PREAPP_ACTION_ENTRIES = Object.freeze({
  "preapp.internal.compiled_review_ack": defineEntry({
    id: "preapp.internal.compiled_review_ack",
    title: "Internal PreApp review acknowledgement",
    consequence:
      "Records that the Operator inspected this compiled review. Does not execute actions or create signing-key custody.",
    reversibility: "reversible_until_live_approval_which_this_surface_cannot_grant",
    administrator_requirement: "not_required",
    channel: "internal_approval",
    executable: false,
    approval_class: "dormant_or_synthetic"
  }),
  "preapp.uac.supported_windows_elevation": defineEntry({
    id: "preapp.uac.supported_windows_elevation",
    title: "Supported Windows UAC elevation (Operator-owned)",
    consequence:
      "Any later elevated worker must be opened by the Operator through supported Windows UAC. This surface cannot raise elevation, type a password, or bypass UAC.",
    reversibility: "no_effect_from_this_surface",
    administrator_requirement: "operator_uac_required_outside_this_surface",
    channel: "uac",
    executable: false,
    approval_class: "not_this_surface"
  }),
  "preapp.credentials.private_entry_forbidden": defineEntry({
    id: "preapp.credentials.private_entry_forbidden",
    title: "Credentials remain outside this surface",
    consequence:
      "Passwords, OTPs, and secret values are not collected, displayed, or stored here.",
    reversibility: "no_credential_material_present",
    administrator_requirement: "ben_only_private_entry_if_ever_required",
    channel: "credentials",
    executable: false,
    approval_class: "blocked"
  }),
  "preapp.provider.sign_in_not_exercised": defineEntry({
    id: "preapp.provider.sign_in_not_exercised",
    title: "Provider sign-in is not exercised",
    consequence:
      "OAuth, account login, and provider dashboards are not opened or completed by this review surface.",
    reversibility: "no_provider_session",
    administrator_requirement: "not_applicable_on_this_surface",
    channel: "provider_sign_in",
    executable: false,
    approval_class: "blocked"
  }),
  "preapp.unsupported.live_signing_key_custody": defineEntry({
    id: "preapp.unsupported.live_signing_key_custody",
    title: "Live signing-key custody is unsupported",
    consequence:
      "This review cannot create, import, or use a live signing key.",
    reversibility: "unsupported_no_effect",
    administrator_requirement: "unsupported",
    channel: "unsupported",
    executable: false,
    approval_class: "unsupported"
  })
});

/**
 * Review-level trusted strings live in the catalog so the Operator surface
 * cannot invent title/consequence/channel/etc.
 */
export const PREAPP_REVIEW_BUNDLE = Object.freeze({
  id: "preapp.bundle.operator_review_v1",
  title: "Compiled PreApp Operator review",
  consequence:
    "This surface displays one compiled PreApp review for Operator inspection. Rendering the checklist does not authorize or execute it.",
  reversibility: "review_only",
  administrator_requirement: "not_required_for_read_only_review",
  channel: "internal_approval",
  default_selected_requirement_identifiers: Object.freeze([
    "preapp.internal.compiled_review_ack",
    "preapp.uac.supported_windows_elevation",
    "preapp.credentials.private_entry_forbidden",
    "preapp.provider.sign_in_not_exercised",
    "preapp.unsupported.live_signing_key_custody"
  ])
});

export const PREAPP_ACTION_CATALOG = Object.freeze({
  schema: PREAPP_CATALOG_SCHEMA,
  catalog_id: "pooka-preapp-action-catalog",
  review_bundle: PREAPP_REVIEW_BUNDLE,
  entries: PREAPP_ACTION_ENTRIES
});

export function getCatalogEntry(requirementId) {
  const entry = PREAPP_ACTION_ENTRIES[requirementId];
  if (!entry) {
    throw new Error(`unknown_requirement_id:${requirementId}`);
  }
  return entry;
}

export function catalogDigestSource() {
  return {
    schema: PREAPP_CATALOG_SCHEMA,
    catalog_id: PREAPP_ACTION_CATALOG.catalog_id,
    review_bundle: {
      id: PREAPP_REVIEW_BUNDLE.id,
      title: PREAPP_REVIEW_BUNDLE.title,
      consequence: PREAPP_REVIEW_BUNDLE.consequence,
      reversibility: PREAPP_REVIEW_BUNDLE.reversibility,
      administrator_requirement: PREAPP_REVIEW_BUNDLE.administrator_requirement,
      channel: PREAPP_REVIEW_BUNDLE.channel,
      default_selected_requirement_identifiers: [
        ...PREAPP_REVIEW_BUNDLE.default_selected_requirement_identifiers
      ]
    },
    entries: PREAPP_REVIEW_BUNDLE.default_selected_requirement_identifiers.map((id) => {
      const entry = PREAPP_ACTION_ENTRIES[id];
      return {
        id: entry.id,
        title: entry.title,
        consequence: entry.consequence,
        reversibility: entry.reversibility,
        administrator_requirement: entry.administrator_requirement,
        channel: entry.channel,
        executable: entry.executable,
        approval_class: entry.approval_class,
        resource_digest: entry.resource_digest
      };
    })
  };
}

export function catalogSha256() {
  return sha256Canonical(catalogDigestSource());
}

export const TRUSTED_DISPLAY_FIELD_KEYS = Object.freeze([
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
]);

export function buildTrustedDisplayBytes({
  title,
  consequence,
  reversibility,
  administrator_requirement,
  channel,
  resource_digest,
  expiration,
  machine,
  receiver,
  selected_requirement_identifiers
}) {
  return {
    title,
    consequence,
    reversibility,
    administrator_requirement,
    channel,
    resource_digest,
    expiration,
    machine,
    receiver,
    selected_requirement_identifiers: [...selected_requirement_identifiers]
  };
}

export function reviewSha256FromDisplayBytes(displayBytes) {
  return sha256Canonical(buildTrustedDisplayBytes(displayBytes));
}

function uniqueIdentifiers(identifiers) {
  const seen = new Set();
  const ordered = [];
  for (const id of identifiers) {
    if (seen.has(id)) {
      throw new Error(`duplicate_requirement_id:${id}`);
    }
    seen.add(id);
    ordered.push(id);
  }
  return ordered;
}

export function compilePreappReview({
  selectedRequirementIdentifiers = PREAPP_REVIEW_BUNDLE.default_selected_requirement_identifiers,
  machine,
  receiver,
  expiration
} = {}) {
  if (typeof machine !== "string" || machine.length === 0) {
    throw new Error("machine_required");
  }
  if (typeof receiver !== "string" || receiver.length === 0) {
    throw new Error("receiver_required");
  }
  if (typeof expiration !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(expiration)) {
    throw new Error("expiration_iso_required");
  }

  const selected_requirement_identifiers = uniqueIdentifiers([
    ...selectedRequirementIdentifiers
  ]);
  if (selected_requirement_identifiers.length === 0) {
    throw new Error("selected_requirement_identifiers_required");
  }

  const selected_actions = selected_requirement_identifiers.map((id) => {
    const entry = getCatalogEntry(id);
    return {
      id: entry.id,
      title: entry.title,
      consequence: entry.consequence,
      reversibility: entry.reversibility,
      administrator_requirement: entry.administrator_requirement,
      channel: entry.channel,
      resource_digest: entry.resource_digest,
      executable: entry.executable,
      approval_class: entry.approval_class
    };
  });

  const resource_digest = sha256Canonical(
    selected_actions.map((action) => action.resource_digest)
  );

  const displayBytes = buildTrustedDisplayBytes({
    title: PREAPP_REVIEW_BUNDLE.title,
    consequence: PREAPP_REVIEW_BUNDLE.consequence,
    reversibility: PREAPP_REVIEW_BUNDLE.reversibility,
    administrator_requirement: PREAPP_REVIEW_BUNDLE.administrator_requirement,
    channel: PREAPP_REVIEW_BUNDLE.channel,
    resource_digest,
    expiration,
    machine,
    receiver,
    selected_requirement_identifiers
  });

  const catalog_sha256 = catalogSha256();
  const review_sha256 = reviewSha256FromDisplayBytes(displayBytes);

  return Object.freeze({
    schema: PREAPP_COMPILED_REVIEW_SCHEMA,
    catalog_sha256,
    review_sha256,
    ...displayBytes,
    selected_actions: Object.freeze(selected_actions.map((action) => Object.freeze(action))),
    live_signing_key_custody: false,
    approval_mode: "dormant_or_synthetic",
    rendering_authorizes_execution: false
  });
}

export function assertCompiledReviewIntegrity(compiledReview) {
  if (!compiledReview || compiledReview.schema !== PREAPP_COMPILED_REVIEW_SCHEMA) {
    throw new Error("invalid_compiled_review_schema");
  }
  const expectedCatalog = catalogSha256();
  if (compiledReview.catalog_sha256 !== expectedCatalog) {
    throw new Error("catalog_sha256_mismatch");
  }
  const expectedReview = reviewSha256FromDisplayBytes(
    buildTrustedDisplayBytes(compiledReview)
  );
  if (compiledReview.review_sha256 !== expectedReview) {
    throw new Error("review_sha256_mismatch");
  }
  if (compiledReview.live_signing_key_custody === true) {
    throw new Error("live_signing_key_custody_forbidden");
  }
  const selected = compiledReview.selected_requirement_identifiers;
  if (!Array.isArray(selected) || selected.length === 0) {
    throw new Error("selected_requirement_identifiers_required");
  }
  if (!Array.isArray(compiledReview.selected_actions)) {
    throw new Error("selected_actions_required");
  }
  if (compiledReview.selected_actions.length !== selected.length) {
    throw new Error("hidden_or_extra_selected_actions");
  }
  compiledReview.selected_actions.forEach((action, index) => {
    if (action.id !== selected[index]) {
      throw new Error(`selected_action_order_mismatch:${action.id}`);
    }
    const catalogEntry = getCatalogEntry(action.id);
    if (action.resource_digest !== catalogEntry.resource_digest) {
      throw new Error(`resource_digest_mismatch:${action.id}`);
    }
    if (action.title !== catalogEntry.title) {
      throw new Error(`invented_display_value:${action.id}:title`);
    }
    if (action.consequence !== catalogEntry.consequence) {
      throw new Error(`invented_display_value:${action.id}:consequence`);
    }
    if (action.channel !== catalogEntry.channel) {
      throw new Error(`channel_mismatch:${action.id}`);
    }
  });
  return true;
}

export const DEFAULT_FIXTURE_REVIEW_INPUTS = Object.freeze({
  machine: "doss",
  receiver: "preapp.native",
  expiration: "2026-12-31T23:59:59.000Z"
});

export function compileFixtureOperatorReview(overrides = {}) {
  return compilePreappReview({
    ...DEFAULT_FIXTURE_REVIEW_INPUTS,
    ...overrides
  });
}

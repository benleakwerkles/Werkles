import { createHash, randomBytes as nodeRandomBytes } from "node:crypto";

import { canonicalJson } from "./station-crypto-core.mjs";
import { containsUnsafeHarveyControlCharacters } from "./secret-shape-screen.mjs";

const HASH = /^[a-f0-9]{64}$/;
const PROVIDER = "DISNEY_MYDISNEY";
const INPUT_FIELDS = ["account_ref_sha256", "mailbox_provider", "provider_id", "read_authenticated_mailbox_identity", "route_epoch_sha256"];
const READ_FIELDS = ["authenticated", "direct_security_message_count", "identity_material", "mailbox_session_sha256", "observed_at", "provider_sender_match_count"];

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function exact(value, fields, code) { if (!value || typeof value !== "object" || Array.isArray(value)) fail(code); const actual = Object.keys(value).sort(); const expected = [...fields].sort(); if (actual.length !== expected.length || actual.some((field, index) => field !== expected[index])) fail(code); }
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; for (const child of Object.values(value)) freeze(child); return Object.freeze(value); }
function validIdentity(value) { return typeof value === "string" && value.length >= 3 && value.length <= 320 && value.includes("@") && !/[\u0000-\u001f\u007f]/.test(value) && !containsUnsafeHarveyControlCharacters(value); }

export async function createAuthenticatedInboxIdentityHandle(rawInput, { now = Date.now(), randomBytes = nodeRandomBytes } = {}) {
  exact(rawInput, INPUT_FIELDS, "AUTHENTICATED_INBOX_IDENTITY_INPUT_INVALID");
  if (rawInput.provider_id !== PROVIDER || rawInput.mailbox_provider !== "GMAIL_AUTHENTICATED_BROWSER"
    || !HASH.test(rawInput.account_ref_sha256 ?? "") || !HASH.test(rawInput.route_epoch_sha256 ?? "")
    || typeof rawInput.read_authenticated_mailbox_identity !== "function" || typeof randomBytes !== "function" || !Number.isFinite(now)) fail("AUTHENTICATED_INBOX_IDENTITY_INPUT_INVALID");

  let observed = await rawInput.read_authenticated_mailbox_identity();
  exact(observed, READ_FIELDS, "AUTHENTICATED_INBOX_IDENTITY_READ_INVALID");
  try {
    const observedAt = Date.parse(observed.observed_at);
    if (observed.authenticated !== true || !validIdentity(observed.identity_material)
      || !HASH.test(observed.mailbox_session_sha256 ?? "") || !Number.isFinite(observedAt)
      || observedAt > now || now - observedAt > 30_000
      || !Number.isSafeInteger(observed.direct_security_message_count) || observed.direct_security_message_count < 2
      || !Number.isSafeInteger(observed.provider_sender_match_count) || observed.provider_sender_match_count < 1) fail("AUTHENTICATED_INBOX_IDENTITY_EVIDENCE_INSUFFICIENT");
    const nonce = Buffer.from(randomBytes(32));
    if (nonce.length !== 32) fail("AUTHENTICATED_INBOX_IDENTITY_NONCE_INVALID");
    const handle = freeze({ schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256: digest({ nonce_sha256: createHash("sha256").update(nonce).digest("hex"), provider_id: PROVIDER, account_ref_sha256: rawInput.account_ref_sha256, route_epoch_sha256: rawInput.route_epoch_sha256, mailbox_session_sha256: observed.mailbox_session_sha256, purpose: "IDENTITY" }) });
    nonce.fill(0);
    const mailboxSessionSha256 = observed.mailbox_session_sha256;
    const directSecurityMessageCount = observed.direct_security_message_count;
    const providerSenderMatchCount = observed.provider_sender_match_count;
    let material = observed.identity_material;
    observed.identity_material = null;
    observed = null;
    let consumed = false;
    const resolveHandle = async (candidate) => {
      exact(candidate, ["ref_sha256", "schema"], "AUTHENTICATED_INBOX_IDENTITY_HANDLE_INVALID");
      if (candidate.schema !== handle.schema || candidate.ref_sha256 !== handle.ref_sha256) fail("AUTHENTICATED_INBOX_IDENTITY_HANDLE_CONFLICT");
      if (consumed || material === null) fail("AUTHENTICATED_INBOX_IDENTITY_HANDLE_ALREADY_CONSUMED");
      consumed = true;
      const resolved = material;
      material = null;
      return { resolved: true, material: resolved };
    };
    return freeze({
      handle,
      resolve_handle: resolveHandle,
      receipt: {
        schema: "pookakind.authenticated-inbox-identity-handle-receipt/v1",
        state: "AUTHENTICATED_MAILBOX_IDENTITY_HANDLE_READY",
        provider_id: PROVIDER,
        account_ref_sha256: rawInput.account_ref_sha256,
        route_epoch_sha256: rawInput.route_epoch_sha256,
        mailbox_session_sha256: mailboxSessionSha256,
        direct_security_message_count: directSecurityMessageCount,
        provider_sender_match_count: providerSenderMatchCount,
        handle_ref_sha256: handle.ref_sha256,
        max_uses: 1,
        identity_material_output: false,
        mailbox_content_output: false,
        secret_material_output: false,
      },
    });
  } finally {
    if (observed && typeof observed === "object") observed.identity_material = null;
    observed = null;
  }
}

export function createCompositeDisneyCredentialHandleResolver({ identity_handle, identity_resolver, password_resolver }) {
  exact(identity_handle, ["ref_sha256", "schema"], "DISNEY_COMPOSITE_CREDENTIAL_IDENTITY_HANDLE_INVALID");
  if (identity_handle.schema !== "pookakind.stewart-opaque-credential-handle/v1" || !HASH.test(identity_handle.ref_sha256 ?? "")
    || typeof identity_resolver !== "function" || typeof password_resolver !== "function") fail("DISNEY_COMPOSITE_CREDENTIAL_RESOLVER_INVALID");
  return async (candidate) => {
    exact(candidate, ["ref_sha256", "schema"], "DISNEY_COMPOSITE_CREDENTIAL_HANDLE_INVALID");
    if (candidate.schema !== "pookakind.stewart-opaque-credential-handle/v1" || !HASH.test(candidate.ref_sha256 ?? "")) fail("DISNEY_COMPOSITE_CREDENTIAL_HANDLE_INVALID");
    return candidate.ref_sha256 === identity_handle.ref_sha256
      ? identity_resolver(candidate)
      : password_resolver(candidate);
  };
}

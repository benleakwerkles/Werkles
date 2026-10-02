import { createHash } from "node:crypto";

import { canonicalJson } from "./station-crypto-core.mjs";

export const CREDENTIAL_SOURCE_OBSERVATION_SCHEMA = "pookakind.credential-source-observation/v1";
export const CREDENTIAL_SOURCE_READINESS_SCHEMA = "pookakind.credential-source-readiness/v1";

const HASH = /^[a-f0-9]{64}$/;
const MAX_AGE_MS = 5 * 60 * 1000;
const CACHE_STATES = new Set(["FRESH_RESET", "FRESH_REBUILT", "STALE_OR_UNKNOWN"]);
const OBSERVATION_FIELDS = [
  "account_scope_sha256", "active_match_count", "archived_match_count",
  "browser_profile_sha256", "cache_state", "cursor_keyboard_clipboard_touched",
  "extension_installed", "machine", "observed_at", "provider_scope_sha256",
  "schema", "secret_material_present",
];
const READINESS_FIELDS = [
  "account_scope_sha256", "active_match_count", "browser_profile_sha256",
  "cache_state", "machine", "observation_sha256", "observed_at",
  "provider_scope_sha256", "ready", "schema", "state",
];

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code);
  const actual = Object.keys(value).sort(); const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((field, index) => field !== expected[index])) fail(code);
}
function plain(value, code) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  if (!value || typeof value !== "object" || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
    || Object.getOwnPropertySymbols(value).length) fail(code);
  const output = {};
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail(code);
    output[key] = plain(descriptor.value, code);
  }
  return output;
}
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function freeze(value) { return Object.freeze(structuredClone(value)); }

export function compileCredentialSourceReadiness(rawObservation, now = Date.now()) {
  if (!Number.isFinite(now)) fail("CREDENTIAL_SOURCE_CLOCK_INVALID");
  const observation = plain(rawObservation, "CREDENTIAL_SOURCE_OBSERVATION_INVALID");
  exact(observation, OBSERVATION_FIELDS, "CREDENTIAL_SOURCE_OBSERVATION_INVALID");
  if (observation.schema !== CREDENTIAL_SOURCE_OBSERVATION_SCHEMA
    || typeof observation.machine !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(observation.machine)
    || !HASH.test(observation.browser_profile_sha256 ?? "")
    || !HASH.test(observation.provider_scope_sha256 ?? "")
    || !HASH.test(observation.account_scope_sha256 ?? "")
    || !Number.isSafeInteger(observation.active_match_count) || observation.active_match_count < 0
    || !Number.isSafeInteger(observation.archived_match_count) || observation.archived_match_count < 0
    || !CACHE_STATES.has(observation.cache_state)
    || typeof observation.extension_installed !== "boolean"
    || observation.secret_material_present !== false
    || observation.cursor_keyboard_clipboard_touched !== false) fail("CREDENTIAL_SOURCE_OBSERVATION_INVALID");
  const observed = Date.parse(observation.observed_at);
  if (!Number.isFinite(observed) || observed > now || now - observed > MAX_AGE_MS) fail("CREDENTIAL_SOURCE_OBSERVATION_STALE");

  let state = "READY_EXACT_ONE_CURRENT";
  if (!observation.extension_installed) state = "EXTENSION_UNAVAILABLE";
  else if (observation.cache_state === "STALE_OR_UNKNOWN") state = "CACHE_STALE_OR_UNKNOWN";
  else if (observation.active_match_count === 0) state = "NO_ACTIVE_CREDENTIAL";
  else if (observation.active_match_count > 1) state = "AMBIGUOUS_ACTIVE_CREDENTIALS";
  const receipt = {
    schema: CREDENTIAL_SOURCE_READINESS_SCHEMA,
    machine: observation.machine,
    browser_profile_sha256: observation.browser_profile_sha256,
    provider_scope_sha256: observation.provider_scope_sha256,
    account_scope_sha256: observation.account_scope_sha256,
    observed_at: observation.observed_at,
    observation_sha256: digest(observation),
    cache_state: observation.cache_state,
    active_match_count: observation.active_match_count,
    state,
    ready: state === "READY_EXACT_ONE_CURRENT",
  };
  return freeze(receipt);
}
export function validateCredentialSourceReadiness(rawReadiness, { machine, account_scope_sha256, provider_scope_sha256, now = Date.now(), requireReady = true } = {}) {
  const readiness = plain(rawReadiness, "CREDENTIAL_SOURCE_READINESS_INVALID");
  exact(readiness, READINESS_FIELDS, "CREDENTIAL_SOURCE_READINESS_INVALID");
  if (readiness.schema !== CREDENTIAL_SOURCE_READINESS_SCHEMA
    || typeof readiness.machine !== "string" || !HASH.test(readiness.browser_profile_sha256 ?? "")
    || !HASH.test(readiness.provider_scope_sha256 ?? "") || !HASH.test(readiness.account_scope_sha256 ?? "")
    || !HASH.test(readiness.observation_sha256 ?? "") || !CACHE_STATES.has(readiness.cache_state)
    || !Number.isSafeInteger(readiness.active_match_count) || readiness.active_match_count < 0
    || typeof readiness.state !== "string" || typeof readiness.ready !== "boolean"
    || readiness.ready !== (readiness.state === "READY_EXACT_ONE_CURRENT")) fail("CREDENTIAL_SOURCE_READINESS_INVALID");
  const observed = Date.parse(readiness.observed_at);
  if (!Number.isFinite(now) || !Number.isFinite(observed) || observed > now || now - observed > MAX_AGE_MS) fail("CREDENTIAL_SOURCE_READINESS_STALE");
  if ((machine && readiness.machine !== machine)
    || (account_scope_sha256 && readiness.account_scope_sha256 !== account_scope_sha256)
    || (provider_scope_sha256 && readiness.provider_scope_sha256 !== provider_scope_sha256)) fail("CREDENTIAL_SOURCE_READINESS_SCOPE_MISMATCH");
  if (requireReady && !readiness.ready) fail(`CREDENTIAL_SOURCE_${readiness.state}`);
  return freeze(readiness);
}

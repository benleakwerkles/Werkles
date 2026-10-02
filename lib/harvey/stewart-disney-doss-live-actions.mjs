const HASH = /^[a-f0-9]{64}$/;
const PRIVATE_KEY = /^(?:credential|material|otp|passcode|password|pin|secret|token|value)$/i;
const ORDER = Object.freeze([
  ["observeIdentityRoute", "routeSensor", "observeIdentityRoute"],
  ["bindOpaqueIdentity", "identityCustody", "bindOpaqueIdentity"],
  ["submitRecoveryIdentity", "recovery", "submitRecoveryIdentity"],
  ["captureEmailChallenge", "inbox", "captureEmailChallenge"],
  ["submitEmailChallenge", "challenge", "submitEmailChallenge"],
  ["submitPasswordChange", "passwordChange", "submitPasswordChange"],
  ["clearOwnedSession", "session", "clearOwnedSession"],
  ["submitFreshIdentity", "freshSignIn", "submitFreshIdentity"],
  ["submitFreshSignIn", "freshSignIn", "submitFreshSignIn"],
  ["reconcileExactOneVault", "vault", "reconcileExactOneVault"],
]);
const PRIOR_STAGE_NAMES = Object.freeze(["observeRoute", "bindIdentity", "requestRecovery", "captureChallenge", "submitChallenge", "executeChange", "clearSession", "beginFreshSignIn", "verifyFreshSignIn", "reconcileVault"]);

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function rejectPrivate(value) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return;
  if (!value || typeof value !== "object") fail("STEWART_DISNEY_DOSS_LIVE_OUTPUT_INVALID");
  for (const [key, child] of Object.entries(value)) {
    if (PRIVATE_KEY.test(key)) fail("STEWART_DISNEY_DOSS_LIVE_PRIVATE_OUTPUT_FORBIDDEN");
    rejectPrivate(child);
  }
}
function validateRequest(request, completed) {
  if (!request || request.schema !== "pookakind.password-provider-stage-request/v1"
    || !HASH.test(request.operation_sha256 ?? "") || !HASH.test(request.binding_sha256 ?? "")
    || !HASH.test(request.plan_sha256 ?? "") || !request.prior_receipt_sha256
    || typeof request.prior_receipt_sha256 !== "object" || Array.isArray(request.prior_receipt_sha256)
    || Object.keys(request.prior_receipt_sha256).sort().join("|") !== PRIOR_STAGE_NAMES.slice(0, completed).sort().join("|")) {
    fail("STEWART_DISNEY_DOSS_LIVE_STAGE_ORDER_INVALID");
  }
  for (const value of Object.values(request.prior_receipt_sha256)) if (!HASH.test(value ?? "")) fail("STEWART_DISNEY_DOSS_LIVE_STAGE_ORDER_INVALID");
}

/**
 * Binds the ten Disney stages to named production organs. This deliberately
 * rejects a bag of desired-result callbacks: every action must come from the
 * exact route sensor, custody broker, provider executor, inbox, session, or
 * vault organ assigned to that stage, and the calls are one-shot and ordered.
 */
export function createStewartDisneyDossLiveActions(organs) {
  if (!organs || typeof organs !== "object" || Array.isArray(organs)) fail("STEWART_DISNEY_DOSS_LIVE_ORGANS_INVALID");
  const implementations = ORDER.map(([, organ, method]) => {
    const fn = organs?.[organ]?.[method];
    if (typeof fn !== "function") fail("STEWART_DISNEY_DOSS_LIVE_ORGAN_MISSING");
    return fn.bind(organs[organ]);
  });
  let next = 0;
  const actions = {};
  for (let index = 0; index < ORDER.length; index++) {
    const [action] = ORDER[index];
    actions[action] = async (request) => {
      if (next !== index) fail("STEWART_DISNEY_DOSS_LIVE_STAGE_ORDER_INVALID");
      validateRequest(request, index);
      next += 1;
      const result = await implementations[index](request);
      rejectPrivate(result);
      return result;
    };
  }
  return Object.freeze(actions);
}

export const STEWART_DISNEY_DOSS_LIVE_ORGAN_ORDER = ORDER;

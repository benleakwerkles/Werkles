import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { createStewartDisneyConcreteDeferredDriver } from "../../lib/harvey/stewart-disney-deferred-concrete-driver.mjs";
import { createStewartDisneyBackgroundProviderOrgans } from "../../lib/harvey/stewart-disney-background-provider-organs.mjs";
import { createStewartDisneyDynamicStageOperations } from "../../lib/harvey/stewart-disney-dynamic-stage-authority.mjs";
import { createStewartDisneyDossLiveActions } from "../../lib/harvey/stewart-disney-doss-live-actions.mjs";
import { createStewartDisneyDynamicPlaywrightProviderAdapter } from "../../lib/harvey/stewart-disney-dynamic-playwright-provider-adapter.mjs";
import { createStewartDisneyGmailOtpAdapter } from "../../lib/harvey/stewart-disney-gmail-otp-adapter.mjs";
import { createStewartDisneyAuthenticatedInboxOrgan } from "../../lib/harvey/stewart-disney-authenticated-inbox-organ.mjs";
import { compileStewartDisneyLiveAdapterCapability } from "../../lib/harvey/stewart-disney-deferred-live-adapter.mjs";
import { canonicalJson } from "../../lib/harvey/station-crypto-core.mjs";
import { createDossDurableAppendOnceStore } from "../../lib/harvey/disney-mydisney-doss-durable-dependencies.mjs";
import { observeStewartDisneyDynamicPackage, verifyStewartDisneyDynamicActivation, verifyStewartDisneyDynamicApprovalLog } from "../../lib/harvey/stewart-disney-dynamic-package-custody.mjs";
import { createDossDisneyOnePasswordVaultOrgan, createDossImportedBlindMasterBridge, runVerifiedDisneyMyDisneyDeferredDossExecution } from "./stewart-generalized-disney-doss-one-shot-runtime.mjs";
import { createDossStewartDisneyOwnedBrowserHands, withStewartDisneyOwnedBrowser } from "../../lib/harvey/stewart-disney-owned-browser-session.mjs";

const HASH = /^[a-f0-9]{64}$/;
function fail(code) { const error = new Error(code); error.code = code; throw error; }
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }

/** Reject missing live organs before temporary registration or Disney navigation. */
export function preflightStewartDisneyOwnedProduction(production) {
  if (!production || typeof production !== "object" || Array.isArray(production)
    || !production.ownedBrowser || typeof production.ownedBrowser !== "object"
    || production.playwright || production.observeStage || production.providerAdapter || production.routeSensor
    || Object.keys(production.ownedBrowser.stage_descriptors ?? {}).sort().join("|") !== "challenge|freshIdentity|freshSignIn|passwordChange|recovery"
    || typeof production.ownedBrowser.chrome_executable_path !== "string"
    || typeof production.ownedBrowser.initial_url !== "string") fail("STEWART_DISNEY_ENTRYPOINT_BROWSER_PREFLIGHT_INVALID");
  if (!production.blindMaster || production.credentialHandle
    || typeof production.blindMaster.resolver_executable !== "string"
    || typeof production.blindMaster.allowed_root !== "string"
    || !HASH.test(production.blindMaster.canonical_origin_sha256 ?? "")
    || typeof production.resolveHandle !== "function") fail("STEWART_DISNEY_ENTRYPOINT_BLIND_PREFLIGHT_INVALID");
  if (!production.gmail || production.inbox || typeof production.gmail.getAccessToken !== "function"
    || typeof production.gmail.mailbox !== "string"
    || typeof production.createOpaqueOtpHandle !== "function") fail("STEWART_DISNEY_ENTRYPOINT_INBOX_PREFLIGHT_INVALID");
  if (!production.onepassword || production.vault || !Array.isArray(production.onepassword.scope)
    || !production.onepassword.scope.includes(production.onepassword.target_vault_id)
    || typeof production.onepassword.resolveIdentity !== "function"
    || typeof production.onepassword.resolveCredential !== "function") fail("STEWART_DISNEY_ENTRYPOINT_VAULT_PREFLIGHT_INVALID");
  if (typeof production.identityCustody?.bindOpaqueIdentity !== "function"
    || typeof production.signStageRecord !== "function") fail("STEWART_DISNEY_ENTRYPOINT_SIGNER_PREFLIGHT_INVALID");
  return Object.freeze({ state: "LIVE_ORGAN_SHAPES_BOUND_NOT_EXECUTED", provider_contacted: false, secret_material_output: false });
}

export async function runStewartDisneyDeferredPackageEntrypoint({ package_root, operator_authority, activation_record, approval_log_path, durable_root, plan, operation_sha256, binding_sha256, rehearsal_terminal, production, now = () => Date.now() }) {
  if (typeof package_root !== "string" || !package_root || typeof now !== "function" || !production || typeof production !== "object" || Array.isArray(production)) fail("STEWART_DISNEY_ENTRYPOINT_INPUT_INVALID");
  const package_observation = observeStewartDisneyDynamicPackage(package_root);
  const entrypointSha256 = createHash("sha256").update(readFileSync(new URL(import.meta.url))).digest("hex");
  if (package_observation.files.find((file) => file.relative_path === "scripts/foreman/stewart-disney-deferred-package-entrypoint.mjs")?.sha256 !== entrypointSha256) fail("STEWART_DISNEY_ENTRYPOINT_PACKAGE_BYTES_CONFLICT");
  const activation = verifyStewartDisneyDynamicActivation({ package_observation, operator_authority, activation_record, entrypoint_sha256: entrypointSha256, now: now() });
  verifyStewartDisneyDynamicApprovalLog({ approval_log_path, approval_log_entry_sha256: activation.approval_log_entry_sha256, package_sha256: activation.package_sha256 });
  if (operation_sha256 !== activation.operation_sha256 || plan?.account_ref_sha256 !== activation.account_ref_sha256
    || !HASH.test(binding_sha256 ?? "")) fail("STEWART_DISNEY_ENTRYPOINT_CUSTODY_CONFLICT");
  if (Object.hasOwn(production, "consume")) fail("STEWART_DISNEY_ENTRYPOINT_STAGE_CLAIM_OVERRIDE_FORBIDDEN");
  if (production.ownedBrowser) {
    preflightStewartDisneyOwnedProduction(production);
    if (production.playwright || typeof production.ownedBrowser !== "object" || !production.ownedBrowser.stage_descriptors) fail("STEWART_DISNEY_ENTRYPOINT_BROWSER_BINDING_AMBIGUOUS");
    const hands = createDossStewartDisneyOwnedBrowserHands(production.ownedBrowser);
    hands.prepareProfileParent();
    return withStewartDisneyOwnedBrowser({ ...hands, package_root, package_observation, initial_url: production.ownedBrowser.initial_url },
      ({ context, session_ref_sha256 }) => runBoundProduction({ production: { ...production, ownedBrowser: undefined,
        playwright: { context, owned_session_ref_sha256: session_ref_sha256, stage_descriptors: production.ownedBrowser.stage_descriptors }, session_ref_sha256 },
      activation, operator_authority, durable_root, plan, operation_sha256, binding_sha256, rehearsal_terminal, now, entrypointSha256 }));
  }
  return runBoundProduction({ production, activation, operator_authority, durable_root, plan, operation_sha256, binding_sha256, rehearsal_terminal, now, entrypointSha256 });
}

async function runBoundProduction({ production, activation, operator_authority, durable_root, plan, operation_sha256, binding_sha256, rehearsal_terminal, now, entrypointSha256 }) {
  if (production.blindMaster && production.credentialHandle) fail("STEWART_DISNEY_ENTRYPOINT_CREDENTIAL_BINDING_AMBIGUOUS");
  const blindMaster = production.blindMaster ? createDossImportedBlindMasterBridge({
    ...production.blindMaster, operation_sha256: activation.operation_sha256,
    account_ref_sha256: activation.account_ref_sha256,
  }) : null;
  if (blindMaster && !HASH.test(production.blindMaster.canonical_origin_sha256 ?? "")) fail("STEWART_DISNEY_ENTRYPOINT_BLIND_ORIGIN_INVALID");
  if (blindMaster && typeof production.resolveHandle !== "function") fail("STEWART_DISNEY_ENTRYPOINT_OTHER_HANDLE_RESOLVER_MISSING");
  if (production.playwright && (production.observeStage || production.providerAdapter || production.routeSensor)) fail("STEWART_DISNEY_ENTRYPOINT_PROVIDER_BINDING_AMBIGUOUS");
  const dynamicPlaywright = production.playwright ? createStewartDisneyDynamicPlaywrightProviderAdapter({
    ...production.playwright, account_ref_sha256: activation.account_ref_sha256,
  }) : null;
  if (production.gmail && production.inbox) fail("STEWART_DISNEY_ENTRYPOINT_INBOX_BINDING_AMBIGUOUS");
  if (production.onepassword && production.vault) fail("STEWART_DISNEY_ENTRYPOINT_VAULT_BINDING_AMBIGUOUS");
  const gmailInbox = production.gmail ? createStewartDisneyAuthenticatedInboxOrgan({
    adapter: createStewartDisneyGmailOtpAdapter({ ...production.gmail, now }),
    createOpaqueOtpHandle: production.createOpaqueOtpHandle,
    now,
  }) : null;
  const onepasswordVault = production.onepassword ? await createDossDisneyOnePasswordVaultOrgan(production.onepassword) : null;
  const stageStore = createDossDurableAppendOnceStore({
    root: durable_root,
    owner_id: `DOSS-DISNEY-${activation.account_ref_sha256}`,
    namespace: "credential-stages",
  });
  const boundProduction = { ...production, ...(dynamicPlaywright ?? {}), ...(gmailInbox ? { inbox: gmailInbox } : {}), ...(onepasswordVault ? { vault: onepasswordVault.organ } : {}),
    ...(blindMaster ? {
      credentialHandle: blindMaster.handle,
      assertCredentialStageScope: ({ stage, command }) => blindMaster.authorize_stage({ provider_id: activation.provider_id, stage, command }),
      resolveHandle: (handle, { stage, command }) => handle?.ref_sha256 === blindMaster.handle.ref_sha256
        ? blindMaster.resolve_for_stage({ provider_id: activation.provider_id, stage, command, handle }) : production.resolveHandle(handle),
    } : {}),
    consume: (id) => stageStore.claim_once(id) };
  if (blindMaster) {
    const observeStage = boundProduction.observeStage;
    if (typeof observeStage !== "function") fail("STEWART_DISNEY_ENTRYPOINT_STAGE_OBSERVER_MISSING");
    boundProduction.observeStage = async (...args) => {
      const result = await observeStage(...args);
      if (result?.observation?.canonical_origin_sha256 !== production.blindMaster.canonical_origin_sha256) fail("STEWART_DISNEY_ENTRYPOINT_BLIND_ORIGIN_DRIFT");
      return result;
    };
  }
  const operations = createStewartDisneyDynamicStageOperations({ observeStage: boundProduction.observeStage, signRecord: boundProduction.signStageRecord, now });
  const organs = createStewartDisneyBackgroundProviderOrgans({ ...boundProduction, operations, operatorAuthority: operator_authority, flow_operation_sha256: activation.operation_sha256, account_ref_sha256: activation.account_ref_sha256, now });
  const driver = createStewartDisneyConcreteDeferredDriver(createStewartDisneyDossLiveActions(organs));
  const capability = compileStewartDisneyLiveAdapterCapability({ package_sha256: activation.package_sha256, source_release_sha256: activation.source_release_sha256, rehearsal_terminal, driver });
  const terminal = await runVerifiedDisneyMyDisneyDeferredDossExecution({ activation, durable_root, plan, operation_sha256, binding_sha256, live_adapter: { capability, driver } });
  return Object.freeze({ terminal, custody: Object.freeze({ package_sha256: activation.package_sha256, activation_record_sha256: activation.activation_record_sha256, entrypoint_sha256: entrypointSha256, terminal_sha256: digest(terminal) }) });
}

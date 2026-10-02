import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { compileStewartBackgroundCredentialOperation } from "../../../lib/harvey/stewart-background-credential-operation.mjs";
import { createStewartDisneyDynamicStageOperations } from "../../../lib/harvey/stewart-disney-dynamic-stage-authority.mjs";
import { canonicalJson, generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const hash = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const at = Date.parse("2026-09-22T04:00:00.000Z");
const account = hash("account"); const flow = hash("flow");
const signer = generateIdentity();
const pin = { schema: "pookakind.operator-authority-pin/v1", public_key_pem: signer.public_key_pem, public_key_sha256: signer.public_key_sha256 };
const roles = ["EMAIL_OTP_DIGIT_1", "EMAIL_OTP_DIGIT_2", "EMAIL_OTP_DIGIT_3", "EMAIL_OTP_DIGIT_4", "EMAIL_OTP_DIGIT_5", "EMAIL_OTP_DIGIT_6"];
function surface(rolesForStage = roles) {
  const descriptor = {
    schema: "pookakind.stewart-provider-surface-descriptor/v1",
    field_descriptors: rolesForStage.map((role) => ({ role, control_sha256: hash(role), selector: `#${role}` })),
    final_control_descriptor: { control_sha256: hash("submit"), selector: "#submit" },
    readback_descriptors: [{ response_class: "PROVIDER_ACCEPTED", selector: "#accepted" }],
  };
  const observation = {
    schema: "pookakind.stewart-background-credential-observation/v1", account_ref_sha256: account,
    canonical_origin_sha256: hash("origin"), route_epoch_sha256: hash("route"), tab_id_sha256: hash("tab"),
    form_sha256: hash("form"), field_controls: rolesForStage.map((role) => ({ role, control_sha256: hash(role) })),
    final_control_sha256: hash("submit"), provider_response_contract_sha256: hash(descriptor),
    observed_at: new Date(at).toISOString(), final_control_count: 1, final_control_enabled: true,
    unexpected_field_count: 0, secret_material_present: false,
  };
  return { descriptor, observation };
}
const bound = (handle) => ({ stage: "challenge", handles: [handle], flow_operation_sha256: flow, account_ref_sha256: account });

test("fresh OTP handle is bound into an Operator-signed stage only after observation", async () => {
  const events = []; const actual = { schema: "pookakind.stewart-private-inbox-email-otp-handle/v1", ref_sha256: hash("fresh-handle") };
  const operations = createStewartDisneyDynamicStageOperations({
    observeStage: async () => { events.push("observe"); return surface(); },
    signRecord: async ({ payload, issuer, audience }) => { events.push("sign"); return signDurableRecord(signer.private_key_pem, payload, { issuer, audience }); },
    now: () => at,
  });
  assert.deepEqual(events, []);
  const prepared = await operations.challenge.prepare(bound(actual));
  assert.deepEqual(events, ["observe", "sign"]);
  const compiled = compileStewartBackgroundCredentialOperation({ authorityRecord: prepared.authorityRecord, operatorAuthority: pin, observation: prepared.observation, now: at });
  assert.equal(compiled.admission.decision, "EXECUTE_ONCE");
  assert.deepEqual([...new Set(compiled.admission.command.fields.map((field) => field.handle_ref_sha256))], [actual.ref_sha256]);
  assert.equal(JSON.stringify(prepared).includes("123456"), false);
});

test("stage, account, roles, handle readiness, and signer substitution fail closed", async () => {
  let signs = 0;
  const operations = createStewartDisneyDynamicStageOperations({
    observeStage: async () => surface(),
    signRecord: async ({ payload, issuer, audience }) => { signs++; return signDurableRecord(signer.private_key_pem, payload, { issuer, audience }); },
    now: () => at,
  });
  const handle = { schema: "pookakind.stewart-private-inbox-email-otp-handle/v1", ref_sha256: hash("fresh-handle") };
  await assert.rejects(operations.challenge.prepare({ ...bound(handle), stage: "recovery" }), /STAGE_BINDING_INVALID/);
  await assert.rejects(operations.challenge.prepare({ ...bound(handle), account_ref_sha256: hash("other") }), /STAGE_SURFACE_INVALID/);
  await assert.rejects(operations.challenge.prepare(bound({ ...handle, ref_sha256: "bad" })), /STAGE_BINDING_INVALID/);
  assert.equal(signs, 0);
  const wrongRoles = createStewartDisneyDynamicStageOperations({ observeStage: async () => surface(["IDENTITY"]), signRecord: async () => { signs++; }, now: () => at });
  await assert.rejects(wrongRoles.challenge.prepare(bound(handle)), /STAGE_SURFACE_INVALID/);
  assert.equal(signs, 0);
  const other = generateIdentity();
  const wrongSigner = createStewartDisneyDynamicStageOperations({
    observeStage: async () => surface(),
    signRecord: async ({ payload, issuer, audience }) => signDurableRecord(other.private_key_pem, payload, { issuer, audience }),
    now: () => at,
  });
  const prepared = await wrongSigner.challenge.prepare(bound(handle));
  assert.throws(() => compileStewartBackgroundCredentialOperation({ authorityRecord: prepared.authorityRecord, operatorAuthority: pin, observation: prepared.observation, now: at }), /SIGNER_PIN_MISMATCH/);
});

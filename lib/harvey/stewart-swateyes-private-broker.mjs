import { createHash } from "node:crypto";
import { createConnection } from "node:net";

import { compileStewartBackgroundCredentialOperation } from "./stewart-background-credential-operation.mjs";
import { decideSwateyesPasswordGate } from "./swateyes-password-gate.mjs";

const HASH = /^[a-f0-9]{64}$/;
const PIPE = "\\\\.\\pipe\\PookaKindPrivateCredentialBrokerV1";
const MAX_FRAME = 65_536;
const MAX_REPLY = 128;
const STATES = new Set([
  "SUBMITTED_ONCE_PROVIDER_UNVERIFIED",
  "SUBMISSION_AMBIGUOUS_DO_NOT_RESEND",
  "SUBMISSION_UNKNOWN_DO_NOT_RESEND",
]);

function fail(code) { throw new Error(code); }
function sha(bytes) { return createHash("sha256").update(bytes).digest("hex"); }

function checkScope(command, request, broker, envelope) {
  const expectedAction = command.operation_kind === "SIGN_IN" ? "SIGNED_OUT_PASSWORD_SIGN_IN"
    : command.operation_kind === "PASSWORD_RESET" ? "PASSWORD_CHANGE" : null;
  const passwordRole = command.operation_kind === "SIGN_IN" ? "CURRENT_PASSWORD" : "NEW_PASSWORD";
  const passwordField = command.fields.find((field) => field.role === passwordRole);
  if (!expectedAction || !passwordField || request.action !== expectedAction
    || request.gate_class !== "PROVIDER_PASSWORD"
    || request.machine !== "Doss" || request.project_id !== "PookaKind"
    || request.account_scope_sha256 !== command.account_ref_sha256
    || request.credential_source_readiness?.provider_scope_sha256 !== command.canonical_origin_sha256
    || request.opaque_handle?.handle_id_sha256 !== passwordField.handle_ref_sha256
    || request.opaque_handle?.kind !== "BLIND_PASSWORD"
    || request.provider_control_unbypassable !== false
    || broker.broker_id !== "PookaKindPrivateCredentialBrokerV1"
    || broker.dispatch_sha256 !== sha(envelope)
    || !HASH.test(command.canonical_origin_sha256)) {
    fail("PRIVATE_BROKER_STEWART_SWATEYES_SCOPE_CONFLICT");
  }
  if (command.operation_kind === "PASSWORD_RESET") {
    const confirm = command.fields.find((field) => field.role === "CONFIRM_PASSWORD");
    if (!confirm || confirm.handle_ref_sha256 !== passwordField.handle_ref_sha256) {
      fail("PRIVATE_BROKER_RESET_HANDLE_CONFLICT");
    }
  }
}

function exchangeOnce(envelope, connect, timeoutMs) {
  return new Promise((resolve) => {
    let socket;
    let settled = false;
    let sent = false;
    let response = Buffer.alloc(0);
    const finish = (state) => {
      if (settled) return;
      settled = true;
      if (socket) socket.destroy();
      resolve(state);
    };
    try { socket = connect(PIPE); }
    catch { finish("BROKER_UNAVAILABLE_NO_DISPATCH"); return; }
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => {
      const prefix = Buffer.alloc(4);
      prefix.writeInt32LE(envelope.length);
      sent = true;
      socket.write(Buffer.concat([prefix, envelope]));
    });
    socket.on("data", (part) => {
      response = Buffer.concat([response, part]);
      if (response.length > MAX_REPLY) { finish("SUBMISSION_UNKNOWN_DO_NOT_RESEND"); return; }
    });
    socket.once("error", () => finish(sent ? "SUBMISSION_UNKNOWN_DO_NOT_RESEND" : "BROKER_UNAVAILABLE_NO_DISPATCH"));
    socket.once("timeout", () => finish(sent ? "SUBMISSION_UNKNOWN_DO_NOT_RESEND" : "BROKER_UNAVAILABLE_NO_DISPATCH"));
    socket.once("end", () => {
      const value = response.toString("ascii");
      finish(sent ? (STATES.has(value) && response.equals(Buffer.from(value, "ascii"))
        ? value : "SUBMISSION_UNKNOWN_DO_NOT_RESEND") : "BROKER_UNAVAILABLE_NO_DISPATCH");
    });
  });
}

/** One opaque CMS request; the separate-SID native broker verifies its signature and claims before decrypting. */
export async function runStewartSwateyesPrivateBroker({
  authorityRecord, operatorAuthority, observation, swateyesRequest, swateyesAuthority,
  brokerProof, unspentAuthorityReceiptIds, consumedDispatchSha256s = [], signedEnvelope,
  now = Date.now(), connect = createConnection, timeoutMs = 35_000,
}) {
  if (!Buffer.isBuffer(signedEnvelope) || signedEnvelope.length < 1 || signedEnvelope.length > MAX_FRAME
    || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 35_000) {
    fail("PRIVATE_BROKER_ENVELOPE_INVALID");
  }
  const compiled = compileStewartBackgroundCredentialOperation({ authorityRecord, operatorAuthority, observation, now });
  if (compiled.admission.decision !== "EXECUTE_ONCE") fail("PRIVATE_BROKER_STEWART_NOT_ACTIVATED");
  const command = compiled.admission.command;
  checkScope(command, swateyesRequest, brokerProof, signedEnvelope);
  const decision = decideSwateyesPasswordGate({
    request: swateyesRequest, authority: swateyesAuthority, broker: brokerProof,
    unspent_authority_receipt_ids: unspentAuthorityReceiptIds,
    consumed_dispatch_sha256s: consumedDispatchSha256s, now,
  });
  if (decision.classification !== "REDUNDANT_NON_HUMAN_PERMISSION"
    || decision.broker_route?.dispatch_sha256 !== sha(signedEnvelope)
    || decision.broker_route?.maximum_uses !== 1) fail("PRIVATE_BROKER_SWATEYES_NOT_ADMITTED");

  const state = await exchangeOnce(signedEnvelope, connect, timeoutMs);
  return Object.freeze({
    schema: "pookakind.stewart-swateyes-private-broker-receipt/v1",
    operation_id_sha256: command.operation_id_sha256,
    stewart_request_sha256: command.request_sha256,
    swateyes_dispatch_sha256: brokerProof.dispatch_sha256,
    state,
    password_conversion: false,
    provider_acceptance_proved: false,
    secret_material_returned: false,
    cursor_keyboard_clipboard_touched: false,
    recurring_operation_created: false,
  });
}

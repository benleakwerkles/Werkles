import { createHash } from "node:crypto";

const HASH = /^[a-f0-9]{64}$/;
const ALLOWED_SENDERS = new Set(["disney.com", "disneyplus.com", "email.disney.com", "email.disneyplus.com", "trx.mail2.disneyplus.com"]);
function fail(code) { const error = new Error(code); error.code = code; throw error; }
function digest(value) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function senderDomain(value) { try { return String(value).trim().toLowerCase().split("@").at(-1); } catch { return ""; } }

/**
 * One-shot mailbox organ. The adapter is responsible for an already
 * authenticated inbox read; this organ admits only one fresh Disney OTP
 * message and immediately converts its private material into an opaque handle.
 */
export function createStewartDisneyAuthenticatedInboxOrgan({ adapter, createOpaqueOtpHandle, now = () => Date.now() }) {
  if (typeof adapter?.readDisneyOtpCandidatesOnce !== "function" || typeof createOpaqueOtpHandle !== "function"
    || typeof now !== "function") fail("STEWART_DISNEY_INBOX_ORGAN_INVALID");
  let consumed = false; let recovery = null;
  return Object.freeze({
    bindRecoveryAcceptance({ operation_sha256, binding_sha256, submitted_at }) {
      if (recovery !== null || consumed) fail("STEWART_DISNEY_INBOX_RECOVERY_ALREADY_BOUND");
      const timestamp = Date.parse(submitted_at);
      if (!HASH.test(operation_sha256 ?? "") || !HASH.test(binding_sha256 ?? "")
        || !Number.isFinite(timestamp) || timestamp > now() || now() - timestamp > 120_000) fail("STEWART_DISNEY_INBOX_RECOVERY_BINDING_INVALID");
      recovery = Object.freeze({ operation_sha256, binding_sha256, requestAcceptedAt: timestamp });
      return Object.freeze({ state: "RECOVERY_ACCEPTANCE_BOUND", secret_material_returned: false });
    },
    async captureEmailChallenge(request) {
      if (consumed) fail("STEWART_DISNEY_INBOX_ALREADY_CONSUMED");
      consumed = true;
      if (request?.schema !== "pookakind.password-provider-stage-request/v1" || !HASH.test(request.operation_sha256 ?? "") || !HASH.test(request.binding_sha256 ?? "")) fail("STEWART_DISNEY_INBOX_REQUEST_INVALID");
      if (recovery?.operation_sha256 !== request.operation_sha256 || recovery.binding_sha256 !== request.binding_sha256) fail("STEWART_DISNEY_INBOX_RECOVERY_NOT_BOUND");
      const requestAcceptedAt = recovery.requestAcceptedAt;
      const observedAt = now();
      if (observedAt < requestAcceptedAt || observedAt - requestAcceptedAt > 120_000) fail("STEWART_DISNEY_INBOX_REQUEST_STALE");
      let candidates = null; let material = null;
      try {
        candidates = await adapter.readDisneyOtpCandidatesOnce({ after_ms: requestAcceptedAt, before_ms: observedAt, operation_sha256: request.operation_sha256, binding_sha256: request.binding_sha256 });
        if (!Array.isArray(candidates)) fail("STEWART_DISNEY_INBOX_READ_UNPROVEN");
        const valid = candidates.filter((candidate) => {
          const received = Date.parse(candidate?.received_at);
          return candidate?.provider === "GMAIL_AUTHENTICATED_SESSION" && ALLOWED_SENDERS.has(senderDomain(candidate.sender))
            && typeof candidate.message_ref_sha256 === "string" && HASH.test(candidate.message_ref_sha256)
            && Number.isFinite(received) && received >= requestAcceptedAt && received <= observedAt
            && typeof candidate.otp_material === "string" && /^\d{6}$/.test(candidate.otp_material);
        });
        if (valid.length !== 1 || valid.length !== candidates.length) fail(valid.length > 1 ? "STEWART_DISNEY_INBOX_AMBIGUOUS" : "STEWART_DISNEY_INBOX_EXACT_FRESH_MESSAGE_REQUIRED");
        material = valid[0].otp_material;
        const created = await createOpaqueOtpHandle({
          operation_sha256: request.operation_sha256,
          binding_sha256: request.binding_sha256,
          otp_material: material,
          source: { inbox_provider: "GMAIL_AUTHENTICATED_SESSION", message_ref_sha256: valid[0].message_ref_sha256, sender_ref_sha256: digest(senderDomain(valid[0].sender)), received_at: valid[0].received_at },
        });
        if (created?.handle?.schema !== "pookakind.stewart-private-inbox-email-otp-handle/v1" || !HASH.test(created.handle.ref_sha256 ?? "")
          || created?.receipt?.state !== "CREATED" || created.receipt.secret_material_returned !== false) fail("STEWART_DISNEY_INBOX_HANDLE_INVALID");
        return Object.freeze({ handle: created.handle, receipt: Object.freeze({ state: "CREATED", private_message_count: 1, source_receipt_sha256: digest([valid[0].message_ref_sha256, valid[0].received_at]), secret_material_returned: false }) });
      } finally {
        material = null;
        if (Array.isArray(candidates)) for (const candidate of candidates) if (candidate && typeof candidate === "object" && Object.hasOwn(candidate, "otp_material")) candidate.otp_material = null;
        candidates = null;
      }
    },
  });
}

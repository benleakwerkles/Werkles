import { createHash } from "node:crypto";

const HASH = /^[a-f0-9]{64}$/;
const SENDERS = new Set(["disney.com", "disneyplus.com", "email.disney.com", "email.disneyplus.com", "trx.mail2.disneyplus.com"]);
const API = "https://gmail.googleapis.com/gmail/v1/users/me/messages";

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function header(message, name) {
  const matches = message?.payload?.headers?.filter((entry) => entry?.name?.toLowerCase() === name) ?? [];
  return matches.length === 1 && typeof matches[0].value === "string" ? matches[0].value : null;
}
function senderAddress(value) {
  if (typeof value !== "string") return null;
  const match = /(?:^|<)([A-Z0-9._%+-]+@([A-Z0-9.-]+))(?:>|$)/i.exec(value.trim());
  return match && SENDERS.has(match[2].toLowerCase()) ? match[1].toLowerCase() : null;
}
function senderAuthenticated(message, sender) {
  if (!sender?.endsWith("@trx.mail2.disneyplus.com")) return true;
  const results = message?.payload?.headers?.filter((entry) => entry?.name?.toLowerCase() === "authentication-results") ?? [];
  if (results.length !== 1 || typeof results[0].value !== "string") return false;
  const value = results[0].value.replace(/\s+/g, " ").toLowerCase();
  return value.startsWith("mx.google.com;")
    && /(?:^|;) dkim=pass header\.i=@mail2\.disneyplus\.com(?: |;)/.test(value)
    && /(?:^|;) dmarc=pass(?: |\().*?header\.from=disneyplus\.com(?: |;|$)/.test(value);
}
function addressedTo(value, mailbox) {
  if (typeof value !== "string") return false;
  const addresses = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+/gi) ?? [];
  return addresses.some((address) => address.toLowerCase() === mailbox.toLowerCase());
}
function decodeBody(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,32768}$/.test(value)) return null;
  return Buffer.from(value.replaceAll("-", "+").replaceAll("_", "/"), "base64").toString("utf8");
}
function plainParts(payload) {
  if (!payload || typeof payload !== "object") return [];
  const own = payload.mimeType === "text/plain" ? [decodeBody(payload.body?.data)] : [];
  return [...own, ...(Array.isArray(payload.parts) ? payload.parts.flatMap(plainParts) : [])].filter((part) => part !== null);
}
async function jsonResponse(fetchImpl, url, token) {
  const response = await fetchImpl(url, { method: "GET", redirect: "error", headers: { authorization: `Bearer ${token}`, accept: "application/json" }, cache: "no-store" });
  if (!response?.ok) fail("STEWART_DISNEY_GMAIL_READ_FAILED");
  const body = await response.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) fail("STEWART_DISNEY_GMAIL_RESPONSE_INVALID");
  return body;
}

/** One authenticated Gmail API read after provider recovery acceptance. No token,
 * message body, or OTP is emitted in a receipt or log by this adapter. */
export function createStewartDisneyGmailOtpAdapter({ getAccessToken, fetchImpl = fetch, mailbox, now = () => Date.now() }) {
  if (typeof getAccessToken !== "function" || typeof fetchImpl !== "function" || typeof now !== "function"
    || typeof mailbox !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailbox)) fail("STEWART_DISNEY_GMAIL_ADAPTER_INVALID");
  let used = false;
  return Object.freeze({
    async readDisneyOtpCandidatesOnce({ after_ms, before_ms, operation_sha256, binding_sha256 }) {
      if (used) fail("STEWART_DISNEY_GMAIL_ALREADY_READ");
      used = true;
      if (!HASH.test(operation_sha256 ?? "") || !HASH.test(binding_sha256 ?? "")
        || !Number.isSafeInteger(after_ms) || !Number.isSafeInteger(before_ms)
        || before_ms < after_ms || before_ms - after_ms > 120_000 || before_ms > now()) fail("STEWART_DISNEY_GMAIL_WINDOW_INVALID");
      const token = await getAccessToken();
      if (typeof token !== "string" || token.length < 16 || /\s/.test(token)) fail("STEWART_DISNEY_GMAIL_AUTH_UNAVAILABLE");
      const query = `after:${Math.floor(after_ms / 1000) - 1} to:${mailbox} {from:disney.com from:disneyplus.com from:email.disney.com from:email.disneyplus.com from:trx.mail2.disneyplus.com}`;
      const listing = await jsonResponse(fetchImpl, `${API}?maxResults=20&q=${encodeURIComponent(query)}`, token);
      if (listing.nextPageToken || (listing.resultSizeEstimate ?? 0) > 20 || (listing.messages && !Array.isArray(listing.messages))) fail("STEWART_DISNEY_GMAIL_RESULT_UNBOUNDED");
      const results = [];
      for (const entry of listing.messages ?? []) {
        if (!/^[A-Za-z0-9_-]{1,128}$/.test(entry?.id ?? "")) fail("STEWART_DISNEY_GMAIL_MESSAGE_REF_INVALID");
        const message = await jsonResponse(fetchImpl, `${API}/${encodeURIComponent(entry.id)}?format=full`, token);
        if (message.id !== entry.id || message.labelIds?.includes("TRASH") || message.labelIds?.includes("SPAM")) continue;
        const sender = senderAddress(header(message, "from"));
        const recipient = header(message, "to");
        const subject = header(message, "subject") ?? "";
        const received = Number(message.internalDate);
        if (!sender || !senderAuthenticated(message, sender) || !addressedTo(recipient, mailbox) || !/(code|verif)/i.test(subject)
          || !Number.isSafeInteger(received) || received < after_ms || received > before_ms) continue;
        const parts = plainParts(message.payload);
        const codes = parts.flatMap((part) => [...part.matchAll(/(?:^|\D)(\d{6})(?!\d)/g)].map((match) => match[1]));
        if (codes.length !== 1) fail("STEWART_DISNEY_GMAIL_CODE_AMBIGUOUS");
        results.push({ provider: "GMAIL_AUTHENTICATED_SESSION", sender, received_at: new Date(received).toISOString(),
          message_ref_sha256: createHash("sha256").update(entry.id).digest("hex"), otp_material: codes[0] });
      }
      return results;
    },
  });
}

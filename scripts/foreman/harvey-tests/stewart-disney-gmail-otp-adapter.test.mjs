import assert from "node:assert/strict";
import test from "node:test";

import { createStewartDisneyGmailOtpAdapter } from "../../../lib/harvey/stewart-disney-gmail-otp-adapter.mjs";

const after = Date.parse("2026-09-23T12:00:00.000Z");
const before = after + 30_000;
const binding = { after_ms: after, before_ms: before, operation_sha256: "a".repeat(64), binding_sha256: "b".repeat(64) };
const encoded = (text) => Buffer.from(text).toString("base64url");
const message = (patch = {}) => ({ id: "message-1", internalDate: String(after + 10_000), labelIds: ["INBOX"], payload: {
  headers: [{ name: "From", value: "MyDisney <no-reply@email.disney.com>" }, { name: "To", value: "operator@example.invalid" }, { name: "Subject", value: "Your verification code" }],
  parts: [{ mimeType: "text/plain", body: { data: encoded("Your code is 123456.") } }],
}, ...patch });
function fixture({ listing = { messages: [{ id: "message-1" }], resultSizeEstimate: 1 }, detail = message(), token = "private-test-token-that-is-long", onFetch = () => {} } = {}) {
  const urls = [];
  const fetchImpl = async (url, options) => {
    urls.push(url); onFetch(url, options);
    return { ok: true, json: async () => url.includes("format=full") ? detail : listing };
  };
  return { urls, adapter: createStewartDisneyGmailOtpAdapter({ getAccessToken: async () => token, fetchImpl, mailbox: "operator@example.invalid", now: () => before }) };
}

test("one authenticated read converts one fresh Disney message to the organ's private candidate shape", async () => {
  const { adapter, urls } = fixture({ onFetch: (_url, options) => {
    assert.equal(options.method, "GET"); assert.equal(options.redirect, "error");
    assert.equal(options.headers.authorization, "Bearer private-test-token-that-is-long");
  } });
  const candidates = await adapter.readDisneyOtpCandidatesOnce(binding);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].provider, "GMAIL_AUTHENTICATED_SESSION");
  assert.equal(candidates[0].otp_material, "123456");
  assert.match(candidates[0].message_ref_sha256, /^[a-f0-9]{64}$/);
  assert.equal(urls.length, 2);
  assert.doesNotMatch(JSON.stringify(urls), /123456|private-test-token/);
  await assert.rejects(adapter.readDisneyOtpCandidatesOnce(binding), /GMAIL_ALREADY_READ/);
});

test("fails closed on ambiguous mailbox, stale mail, unknown sender, multiple codes, and missing auth", async () => {
  const cases = [
    [{ listing: { messages: [], nextPageToken: "another", resultSizeEstimate: 21 } }, /GMAIL_RESULT_UNBOUNDED/],
    [{ detail: message({ internalDate: String(after - 1) }) }, null],
    [{ detail: message({ payload: { ...message().payload, headers: [{ name: "From", value: "evil@example.com" }, { name: "To", value: "operator@example.invalid" }, { name: "Subject", value: "Verification code" }], parts: message().payload.parts } }) }, null],
    [{ detail: message({ payload: { ...message().payload, headers: [{ name: "From", value: "no-reply@email.disney.com" }, { name: "To", value: "notoperator@example.invalid" }, { name: "Subject", value: "Verification code" }], parts: message().payload.parts } }) }, null],
    [{ detail: message({ payload: { ...message().payload, parts: [{ mimeType: "text/plain", body: { data: encoded("123456 or 654321") } }] } }) }, /GMAIL_CODE_AMBIGUOUS/],
    [{ token: "" }, /GMAIL_AUTH_UNAVAILABLE/],
  ];
  for (const [input, expected] of cases) {
    const { adapter } = fixture(input);
    if (expected) await assert.rejects(adapter.readDisneyOtpCandidatesOnce(binding), expected);
    else assert.deepEqual(await adapter.readDisneyOtpCandidatesOnce(binding), []);
  }
});

test("invalid binding cannot read the mailbox", async () => {
  let called = false;
  const { adapter } = fixture({ onFetch: () => { called = true; } });
  await assert.rejects(adapter.readDisneyOtpCandidatesOnce({ ...binding, operation_sha256: "bad" }), /GMAIL_WINDOW_INVALID/);
  assert.equal(called, false);
});

test("observed Disney+ sender requires aligned Gmail DKIM and DMARC readback", async () => {
  const headers = [
    { name: "From", value: '"Disney+" <disneyplus@trx.mail2.disneyplus.com>' },
    { name: "To", value: "operator@example.invalid" },
    { name: "Subject", value: "Your verification code" },
    { name: "Authentication-Results", value: "mx.google.com; dkim=pass header.i=@mail2.disneyplus.com; dmarc=pass (p=QUARANTINE) header.from=disneyplus.com" },
  ];
  const detail = message({ payload: { ...message().payload, headers } });
  assert.equal((await fixture({ detail }).adapter.readDisneyOtpCandidatesOnce(binding)).length, 1);
  for (const altered of [
    headers.filter((entry) => entry.name !== "Authentication-Results"),
    headers.map((entry) => entry.name === "Authentication-Results" ? { ...entry, value: entry.value.replace("dkim=pass", "dkim=fail") } : entry),
    headers.map((entry) => entry.name === "Authentication-Results" ? { ...entry, value: entry.value.replace("dmarc=pass", "dmarc=fail") } : entry),
  ]) {
    assert.deepEqual(await fixture({ detail: message({ payload: { ...message().payload, headers: altered } }) }).adapter.readDisneyOtpCandidatesOnce(binding), []);
  }
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../stewart-generalized-extension/content-script.js", import.meta.url), "utf8");

function fixture() {
  let listener;
  const calls = [];
  const runtime = {
    observe(descriptor) { calls.push(`observe:${descriptor.stage}`); return { schema: "pookakind.stewart-extension-dom-observation/v1" }; },
    execute(descriptor) { calls.push(`execute:${descriptor.stage}`); return { schema: "pookakind.stewart-extension-dom-execution/v1", final_control_invoked: true }; },
    readback(descriptor) { calls.push(`readback:${descriptor.stage}`); return { schema: "pookakind.stewart-extension-dom-readback/v1", response_class: "PROVIDER_ACCEPTED" }; },
  };
  const chrome = { runtime: { onMessage: { addListener(value) { listener = value; } }, sendMessage() {} } };
  vm.runInNewContext(source, { globalThis: { PookaKindStewartExtensionRuntime: runtime }, chrome, location: { href: "https://login.disney.com/test", origin: "https://login.disney.com" } });
  function send(message) {
    let response;
    const accepted = listener(message, {}, (value) => { response = value; });
    return { accepted, response };
  }
  return { send, calls };
}

test("one extension document supports ordered distinct stages but never replays a submitted stage", () => {
  const f = fixture();
  const recovery = { stage: "recovery" }; const challenge = { stage: "challenge" };
  assert.equal(f.send({ schema: "pookakind.stewart-extension-describe/v1", descriptor: recovery }).response.schema, "pookakind.stewart-extension-dom-observation/v1");
  assert.equal(f.send({ schema: "pookakind.stewart-extension-execute-fields/v1", fields: [{ role: "IDENTITY", material: "synthetic" }] }).response.final_control_invoked, true);
  assert.equal(f.send({ schema: "pookakind.stewart-extension-bind-readback/v1", descriptor: recovery }).response.schema, "pookakind.stewart-extension-readback-bound/v1");
  assert.equal(f.send({ schema: "pookakind.stewart-extension-readback-request/v1" }).response.response_class, "PROVIDER_ACCEPTED");
  assert.equal(f.send({ schema: "pookakind.stewart-extension-describe/v1", descriptor: recovery }).response.state, "FAILED_CLOSED");
  assert.deepEqual(f.calls, ["observe:recovery", "execute:recovery", "readback:recovery"]);
  const next = fixture();
  next.send({ schema: "pookakind.stewart-extension-describe/v1", descriptor: recovery });
  next.send({ schema: "pookakind.stewart-extension-execute-fields/v1", fields: [] });
  next.send({ schema: "pookakind.stewart-extension-readback-request/v1" });
  assert.equal(next.send({ schema: "pookakind.stewart-extension-describe/v1", descriptor: challenge }).response.schema, "pookakind.stewart-extension-dom-observation/v1");
});

test("new document may bind readback after navigation; conflicting stage fails closed", () => {
  const f = fixture();
  const recovery = { stage: "recovery" };
  assert.equal(f.send({ schema: "pookakind.stewart-extension-bind-readback/v1", descriptor: recovery }).response.schema, "pookakind.stewart-extension-readback-bound/v1");
  assert.equal(f.send({ schema: "pookakind.stewart-extension-readback-request/v1" }).response.response_class, "PROVIDER_ACCEPTED");
  assert.equal(f.send({ schema: "pookakind.stewart-extension-readback-request/v1" }).accepted, false);
  const conflicting = fixture();
  conflicting.send({ schema: "pookakind.stewart-extension-describe/v1", descriptor: recovery });
  assert.equal(conflicting.send({ schema: "pookakind.stewart-extension-bind-readback/v1", descriptor: { stage: "challenge" } }).response.state, "FAILED_CLOSED");
  assert.equal(conflicting.send({ schema: "pookakind.stewart-extension-describe/v1", descriptor: recovery }).accepted, false);
});

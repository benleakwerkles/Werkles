import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { chromium } from "playwright";

const runtimePath = resolve("scripts/foreman/stewart-generalized-extension/content-runtime.js");
const descriptor = {
  schema: "pookakind.stewart-provider-surface-descriptor/v1",
  field_descriptors: [
    { role: "IDENTITY", control_sha256: "1".repeat(64), selector: "#identity" },
    { role: "CURRENT_PASSWORD", control_sha256: "2".repeat(64), selector: "#password" },
  ],
  final_control_descriptor: { control_sha256: "3".repeat(64), selector: "#submit" },
  readback_descriptors: [
    { response_class: "PROVIDER_ACCEPTED", selector: "#accepted" },
    { response_class: "PROVIDER_REJECTED", selector: "#rejected" },
  ],
};

test("headless Chrome executes the provider-neutral runtime on a background tab without focus or input devices", async (t) => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" }); t.after(() => browser.close());
  const context = await browser.newContext(); const target = await context.newPage(); const foreground = await context.newPage();
  const consoleText = []; target.on("console", (message) => consoleText.push(message.text()));
  await target.setContent(`<!doctype html><input id="identity"><input id="password" type="password"><button id="submit">Continue</button><script>document.querySelector('#submit').addEventListener('click',()=>{const x=document.createElement('div');x.id='accepted';document.body.append(x);globalThis.submitCount=(globalThis.submitCount||0)+1})</script>`);
  await target.addScriptTag({ path: runtimePath }); await foreground.setContent("<h1>Foreground sentinel</h1>"); await foreground.bringToFront();
  const observed = await target.evaluate((value) => globalThis.PookaKindStewartExtensionRuntime.observe(value), descriptor);
  assert.equal(observed.unexpected_field_count, 0);
  const fields = [{ role: "IDENTITY", material: "synthetic@example.invalid" }, { role: "CURRENT_PASSWORD", material: "synthetic-password" }];
  const executed = await target.evaluate(({ descriptor: value, fields: supplied }) => globalThis.PookaKindStewartExtensionRuntime.execute(value, supplied), { descriptor, fields });
  assert.equal(executed.final_control_invoked, true); assert.equal(executed.foreground_changed, false); assert.equal(executed.input_devices_touched, false);
  const state = await target.evaluate(() => ({ identity: document.querySelector("#identity").value, password: document.querySelector("#password").value, submitCount: globalThis.submitCount }));
  assert.deepEqual(state, { identity: "synthetic@example.invalid", password: "synthetic-password", submitCount: 1 });
  const readback = await target.evaluate((value) => globalThis.PookaKindStewartExtensionRuntime.readback(value), descriptor);
  assert.equal(readback.response_class, "PROVIDER_ACCEPTED"); assert.equal(readback.secret_material_exposed, false);
  assert.deepEqual(consoleText, []); assert.equal((await foreground.locator("h1").textContent()), "Foreground sentinel");
  const source = await readFile(runtimePath, "utf8");
  for (const forbidden of ["bestbuy", "wisestamp", "amazon", "xfinity", "new york times"]) assert.doesNotMatch(source.toLowerCase(), new RegExp(forbidden));
});

test("synthetic runtime fails closed on duplicate fields, disabled control, drift, and ambiguous readback", async (t) => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" }); t.after(() => browser.close());
  const page = await browser.newPage(); await page.setContent('<input id="identity"><input id="password"><button id="submit" disabled>Continue</button><div id="accepted"></div><div id="rejected"></div>'); await page.addScriptTag({ path: runtimePath });
  await assert.rejects(page.evaluate((value) => globalThis.PookaKindStewartExtensionRuntime.observe(value), descriptor), /FINAL_CONTROL_NOT_AVAILABLE/);
  await page.evaluate(() => { document.querySelector("#submit").disabled = false; const extra = document.createElement("input"); document.body.append(extra); });
  await assert.rejects(page.evaluate((value) => globalThis.PookaKindStewartExtensionRuntime.observe(value), descriptor), /FIELD_SCOPE_NOT_EXACT/);
  await page.evaluate(() => document.querySelector("input:last-of-type").remove());
  const readback = await page.evaluate((value) => globalThis.PookaKindStewartExtensionRuntime.readback(value), descriptor);
  assert.equal(readback.response_class, "OUTCOME_UNKNOWN");
});

test("headless background runtime submits six ordered one-character email OTP controls without input devices", async (t) => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" }); t.after(() => browser.close());
  const context = await browser.newContext(); const target = await context.newPage(); const foreground = await context.newPage();
  const roles = Array.from({ length: 6 }, (_, index) => `EMAIL_OTP_DIGIT_${index + 1}`);
  const otpDescriptor = { schema: "pookakind.stewart-provider-surface-descriptor/v1", field_descriptors: roles.map((role, index) => ({ role, control_sha256: String(index + 1).repeat(64), selector: `#otp-${index + 1}` })), final_control_descriptor: { control_sha256: "a".repeat(64), selector: "#continue" }, readback_descriptors: [{ response_class: "PROVIDER_ACCEPTED", selector: "#accepted" }] };
  await target.setContent(`<!doctype html>${roles.map((_role, index) => `<input id="otp-${index + 1}" maxlength="1">`).join("")}<button id="continue">Continue</button><script>document.querySelector('#continue').addEventListener('click',()=>{const x=document.createElement('div');x.id='accepted';document.body.append(x);globalThis.submitCount=(globalThis.submitCount||0)+1})</script>`);
  await target.addScriptTag({ path: runtimePath }); await foreground.setContent("<h1>Foreground sentinel</h1>"); await foreground.bringToFront();
  const materials = roles.map((role, index) => ({ role, material: String(index + 1) }));
  const executed = await target.evaluate(({ descriptor: value, fields }) => globalThis.PookaKindStewartExtensionRuntime.execute(value, fields), { descriptor: otpDescriptor, fields: materials });
  assert.equal(executed.field_count, 6); assert.equal(executed.final_control_invoked, true); assert.equal(executed.foreground_changed, false); assert.equal(executed.input_devices_touched, false);
  const state = await target.evaluate(() => ({ values: [...document.querySelectorAll("input")].map((input) => input.value), submitCount: globalThis.submitCount }));
  assert.deepEqual(state, { values: ["1", "2", "3", "4", "5", "6"], submitCount: 1 }); assert.equal((await foreground.locator("h1").textContent()), "Foreground sentinel");
  await target.evaluate(() => { for (const input of document.querySelectorAll("input")) input.value = ""; globalThis.submitCount = 0; });
  const failed = await target.evaluate(({ descriptor: value, roles: suppliedRoles }) => {
    const fields = suppliedRoles.map((role, index) => ({ role, material: index === 4 ? "x" : String(index + 1) }));
    let error = null; try { globalThis.PookaKindStewartExtensionRuntime.execute(value, fields); } catch (caught) { error = String(caught?.message || caught); }
    return { error, references: fields.map(({ material }) => material), values: [...document.querySelectorAll("input")].map((input) => input.value), submitCount: globalThis.submitCount };
  }, { descriptor: otpDescriptor, roles });
  assert.match(failed.error, /MATERIAL_SCOPE_INVALID/); assert.deepEqual(failed.references, Array(6).fill(null)); assert.deepEqual(failed.values, Array(6).fill("")); assert.equal(failed.submitCount, 0);
  const wrongLength = await target.evaluate(({ descriptor: value, roles: suppliedRoles }) => {
    const fields = suppliedRoles.slice(0, 5).map((role, index) => ({ role, material: String(index + 1) }));
    let error = null; try { globalThis.PookaKindStewartExtensionRuntime.execute(value, fields); } catch (caught) { error = String(caught?.message || caught); }
    return { error, references: fields.map(({ material }) => material), values: [...document.querySelectorAll("input")].map((input) => input.value), submitCount: globalThis.submitCount };
  }, { descriptor: otpDescriptor, roles });
  assert.match(wrongLength.error, /MATERIAL_SCOPE_INVALID/); assert.deepEqual(wrongLength.references, Array(5).fill(null)); assert.deepEqual(wrongLength.values, Array(6).fill("")); assert.equal(wrongLength.submitCount, 0);
  const drift = await target.evaluate(({ descriptor: value, roles: suppliedRoles }) => {
    const fields = suppliedRoles.map((role, index) => ({ role, material: String(index + 1) })); document.querySelector("#otp-6").remove();
    let error = null; try { globalThis.PookaKindStewartExtensionRuntime.execute(value, fields); } catch (caught) { error = String(caught?.message || caught); }
    return { error, references: fields.map(({ material }) => material), values: [...document.querySelectorAll("input")].map((input) => input.value), submitCount: globalThis.submitCount };
  }, { descriptor: otpDescriptor, roles });
  assert.match(drift.error, /CONTROL_NOT_EXACT|FIELD_SCOPE_NOT_EXACT/); assert.deepEqual(drift.references, Array(6).fill(null)); assert.deepEqual(drift.values, Array(5).fill("")); assert.equal(drift.submitCount, 0);
});

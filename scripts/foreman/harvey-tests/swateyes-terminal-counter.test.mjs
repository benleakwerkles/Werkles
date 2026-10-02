import assert from "node:assert/strict";
import test from "node:test";

import { buildSwateyesTerminalCounter } from "../harvey-swateyes-counter.mjs";

test("McDonald's-style counter is generated only from terminal-backed Swats", async () => {
  const counter = await buildSwateyesTerminalCounter();
  assert.equal(counter.schema, "werkles.harvey-swateyes-terminal-counter/v1");
  assert.equal(counter.sign, "SWATS SERVED");
  assert.equal(counter.confirmed_terminal_swats, 1);
  assert.equal(counter.provider_permission_prompts_swatted, 0);
  assert.equal(counter.technical_blockers_bypassed, 1);
  assert.equal(counter.green + counter.blue, counter.confirmed_terminal_swats);
  assert.equal(counter.red, 0);
  assert.equal(counter.truth, "ONLY_RECEIPT_BACKED_TERMINAL_SWATS_COUNT");
  assert.match(counter.projection_sha256, /^[a-f0-9]{64}$/);
});

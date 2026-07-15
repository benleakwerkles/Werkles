import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { chromium } from "playwright";

import { base, json, signedMachineHeaders } from "./harvey-test-client.mjs";

const chrome = process.env.HARVEY_CHROME_EXE ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const route = "/api/harvey/relay-events";
const sha = (character) => character.repeat(64);

function event(deliveryId, phase, sequence) {
  const observedAt = new Date(Date.now() - 1000 + sequence).toISOString();
  const proofs = {
    QUEUED: { source: "FLOCK_LOG" },
    SESSION_FOUND: { session_id_sha256: sha("1"), audit_start_offset: 10 },
    VISUALLY_CONFIRMED: { window_handle_sha256: sha("2"), visual_snapshot_sha256: sha("3") },
    AWAITING_SEND_CONFIRMATION: { confirmation_id_sha256: sha("4"), confirmation_expires_at: new Date(Date.parse(observedAt) + 60_000).toISOString() },
    SENT: { audit_message_sha256: sha("5"), audit_message_offset: 20 }
  };
  return {
    delivery_id: deliveryId,
    event_id: `harvey_bridge_event_${randomUUID().replaceAll("-", "")}`,
    sequence,
    phase,
    transport: "COWORK_UI_FALLBACK",
    workstream_id: "harvey_ui_proof",
    target_aeye: "Doozer",
    source_repository: "benleakwerkles/OddlyGodly2.0",
    source_workspace_sha256: sha("a"),
    source_git_common_dir_sha256: sha("b"),
    source_worktree_sha256: sha("c"),
    source_branch: "codex/oddly-godly-next-slices",
    source_commit: "d".repeat(40),
    flock_path: "Docs/MakerHandoff/FLOCK_LOG.jsonl",
    flock_offset: 99,
    flock_record_sha256: sha("e"),
    bird_path: "Docs/MakerHandoff/BIRD_DINK_TO_DOOZER_UI_PROOF.md",
    bird_sha256: sha("f"),
    notice_sha256: sha("0"),
    observed_at: observedAt,
    proof: proofs[phase]
  };
}

async function post(value) {
  const body = JSON.stringify(value);
  return json(route, { method: "POST", headers: signedMachineHeaders({ method: "POST", route, machine: "Spanzee", body }), body });
}

test("Harvey relay wall updates without navigation and exposes no write credential", async () => {
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const browserAuth = [];
  page.on("request", (request) => {
    if (request.url().includes(route)) browserAuth.push(request.headers().authorization ?? null);
  });
  try {
    await page.goto(`${base}/harvey`, { waitUntil: "domcontentloaded", timeout: 15_000 });
    const timeOrigin = await page.evaluate(() => performance.timeOrigin);
    await page.getByTestId("relay-automation").getByText("SEND DISABLED", { exact: true }).waitFor();
    await page.getByTestId("relay-transport").getByText("Projection CURRENT", { exact: true }).waitFor({ timeout: 6_000 });

    const delivery = `harvey_bridge_${randomUUID().replaceAll("-", "")}`;
    const phases = ["QUEUED", "SESSION_FOUND", "VISUALLY_CONFIRMED", "AWAITING_SEND_CONFIRMATION", "SENT"];
    for (const [index, phase] of phases.entries()) assert.equal((await post(event(delivery, phase, index + 1))).response.status, 200);

    const card = page.getByTestId(`relay-delivery-${delivery}`);
    await card.getByTestId("relay-phase").getByText("SENT", { exact: true }).waitFor({ timeout: 6_000 });
    await card.getByText("In progress — receiver-side receipt has not closed this loop.", { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => performance.timeOrigin), timeOrigin);
    assert.ok(browserAuth.length >= 2);
    assert.ok(browserAuth.every((value) => value === null));
  } finally {
    await browser.close();
  }
});

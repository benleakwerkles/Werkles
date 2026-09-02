#!/usr/bin/env node
/**
 * Handeye surface attack: Workshop / Intros / Proof / Dues (ghost APIs).
 * Usage: node scripts/foreman/ghost-fleet-surface-attack.mjs [baseUrl]
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const base = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");
const checks = [
  { name: "fleet", path: "/api/ghost-fleet", expect: (j) => j.enabled && j.count >= 150 },
  { name: "workshop", path: "/api/ghost-fleet/workshop", expect: (j) => j.synthetic && j.workshops?.length > 0 },
  {
    name: "intros_no_intake",
    path: "/api/ghost-fleet/intros",
    /* A cookieless caller must get the empty state, never a padded demo queue. */
    expect: (j) => j.synthetic && j.state === "no_intake" && j.result === null
  },
  { name: "proof", path: "/api/ghost-fleet/proof", expect: (j) => j.mode === "sandbox_dry_run" && j.gaps?.length > 0 },
  {
    name: "owner_state_no_intake",
    path: "/api/owner/state",
    expect: (j) => j.state?.hasIntake === false && j.state?.nextSteps?.length > 0
  },
  {
    name: "workshop_page_empty_state",
    path: "/dashboard/blueprints",
    /* Cookieless workshop must invite an intake, not display a stranger's bench. */
    expectHtml: (h) => h.includes("Build my Workshop") && !h.includes("What you said you are carrying")
  },
  {
    name: "proof_page_empty_state",
    path: "/dashboard/crucible",
    /* The 200 response plus rendered card proves the server-authorized preview
       reaches the surface without exposing internal walkthrough instructions. */
    expectHtml: (h) => h.includes("Nothing to check yet") && !h.includes("Ghost Fleet walkthrough session")
  },
  { name: "membership_page", path: "/membership", expectHtml: (h) => h.includes("Foundry") || h.includes("Membership") }
];

const results = [];
let pass = 0;
let fail = 0;

for (const check of checks) {
  const res = await fetch(`${base}${check.path}`);
  const text = await res.text();
  let ok = res.status === 200;
  if (ok && check.expect) {
    try {
      ok = check.expect(JSON.parse(text));
    } catch {
      ok = false;
    }
  }
  if (ok && check.expectHtml) ok = check.expectHtml(text);
  if (ok) pass += 1;
  else fail += 1;
  results.push({ name: check.name, status: res.status, ok });
}

const receiptDir = path.join(process.cwd(), "foreman/receipts");
await mkdir(receiptDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const receiptPath = path.join(receiptDir, `WERKLES_GHOST_FLEET_SURFACE_ATTACK_${stamp}.json`);
await writeFile(receiptPath, `${JSON.stringify({ base, pass, fail, results }, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ pass, fail, receiptPath }, null, 2));
if (fail > 0) process.exit(1);

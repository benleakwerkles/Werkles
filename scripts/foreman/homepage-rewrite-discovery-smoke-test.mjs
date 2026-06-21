#!/usr/bin/env node
/**
 * HOMEPAGE_REWRITE_DISCOVERY_SMOKE_TEST — ENDER, SKYBRO, COMPUTER (Thufir).
 *
 *   npm run HOMEPAGE_REWRITE_DISCOVERY_SMOKE_TEST
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, abs, nowIso } from "./_foreman-core.mjs";
import { RECEIVED_TOKENS, runAutonomousRoundTrip } from "./autonomous-round-trip-lib.mjs";

const TEMPLATE_ID = "HOMEPAGE_REWRITE_DISCOVERY_SMOKE_TEST";
const COUSINS = [
  { id: "ENDER", lens: "product / UX — hero, crucible gate, brand tone" },
  { id: "SKYBRO", lens: "infra / ops — performance, deploy surface, content delivery" },
  { id: "COMPUTER", lens: "research / Thufir — market patterns, homepage conventions, citations" },
];

const missionDescription =
  "Homepage rewrite discovery smoke test. Reply with RECEIVED plus your role and one sentence on your assigned homepage rewrite lens. No drafting yet.";

function buildShortPaste({ packetId, metadata, cousin, role }) {
  const cousinCfg = COUSINS.find((c) => c.id === cousin);
  return [
    `Werkles ${TEMPLATE_ID}`,
    "",
    `To: ${cousin} (${role.platform})`,
    `Packet: ${packetId}`,
    `nextActionHash: ${metadata.nextActionHash}`,
    "",
    "Reply with RECEIVED plus your role and one sentence on your assigned homepage rewrite lens.",
    `Lens: ${cousinCfg?.lens || role.lane}`,
    "",
    "No drafting yet. No deploy, SQL, or billing.",
  ];
}

async function main() {
  const args = process.argv.slice(2);
  const generateOnly = args.includes("--generate-only");
  const execute = args.includes("--execute");
  const proofPath = abs("foreman/crew-dispatch/HOMEPAGE_REWRITE_DISCOVERY_SMOKE_PROOF.json");
  const startedAt = nowIso();
  const results = [];

  for (const target of COUSINS) {
    const proofRel = `foreman/crew-dispatch/HOMEPAGE_REWRITE_DISCOVERY_SMOKE_${target.id}.json`;
    const result = await runAutonomousRoundTrip({
      cousinId: target.id,
      templateId: TEMPLATE_ID,
      missionDescription,
      buildShortPaste,
      packetIdPrefix: `TO_${target.id}_HOMEPAGE_REWRITE_DISCOVERY_SMOKE_TEST`,
      proofManifestRel: proofRel,
      verdictPrefix: "HOMEPAGE_REWRITE_DISCOVERY",
      generateOnly,
      allowSend: execute || undefined,
      tokenMode: "any",
    });
    results.push({
      cousin: target.id,
      status: result.status,
      failureKind: result.failureKind || null,
      inboxResponse: result.artifacts?.inboxResponse || null,
      processedReceipt: result.artifacts?.processedReceipt || null,
      proof: proofRel,
    });
    if (result.status === "PASS") break;
  }

  const anyPass = results.some((r) => r.status === "PASS");
  const summary = {
    template: TEMPLATE_ID,
    startedAt,
    finishedAt: nowIso(),
    status: generateOnly
      ? "GENERATE_ONLY"
      : anyPass
        ? "PASS"
        : "FAIL",
    cousinsAttempted: results.length,
    anyReceiptCaptured: anyPass,
    results,
  };
  fs.writeFileSync(proofPath, JSON.stringify(summary, null, 2), "utf8");

  console.log(JSON.stringify(summary, null, 2));
  console.log(`\n${TEMPLATE_ID}: ${summary.status}`);
  process.exit(
    summary.status === "PASS" || summary.status === "GENERATE_ONLY" ? 0 : 1
  );
}

const isCli =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  main().catch((e) => {
    console.error(e.message || String(e));
    process.exit(1);
  });
}

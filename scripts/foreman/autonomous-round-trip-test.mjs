#!/usr/bin/env node
/**
 * AUTONOMOUS_ROUND_TRIP_TEST — ENDER reliability harness.
 *
 *   npm run AUTONOMOUS_ROUND_TRIP_TEST
 *   node scripts/foreman/autonomous-round-trip-test.mjs --execute
 *   node scripts/foreman/autonomous-round-trip-test.mjs --execute --batch 5
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RECEIVED_TOKENS, runAutonomousRoundTrip, runAutonomousBatch } from "./autonomous-round-trip-lib.mjs";

const TEMPLATE_ID = "AUTONOMOUS_ROUND_TRIP_TEST";
const COUSIN = "ENDER";

const missionDescription =
  "Confirm Sally autonomous relay proof. Reply with AUTONOMOUS_ROUND_TRIP_RECEIVED on its own line, then one sentence of Werkles UX color.";

function buildShortPaste({ packetId, metadata }) {
  return [
    `Werkles ${TEMPLATE_ID} — ${COUSIN} autonomous relay proof.`,
    "",
    `Packet: ${packetId}`,
    `nextActionHash: ${metadata.nextActionHash}`,
    "",
    "Copy this exact line on its own line (required for PASS):",
    RECEIVED_TOKENS.primary,
    "",
    "Then one sentence of Werkles homepage or crucible UX color.",
    "No deploy, SQL, or billing.",
  ];
}

async function main() {
  const args = process.argv.slice(2);
  const generateOnly = args.includes("--generate-only");
  const execute = args.includes("--execute");
  let batch = 0;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--batch" && args[i + 1]) batch = Number(args[++i]);
  }

  const common = {
    cousinId: COUSIN,
    templateId: TEMPLATE_ID,
    missionDescription,
    buildShortPaste,
    packetIdPrefix: `TO_${COUSIN}_${TEMPLATE_ID}`,
    verdictPrefix: "AUTONOMOUS_ROUND_TRIP",
    generateOnly,
    allowSend: execute || undefined,
  };

  if (batch > 0) {
    const summary = await runAutonomousBatch({ ...common, count: batch });
    console.log(JSON.stringify(summary, null, 2));
    console.log(`\nBATCH ${TEMPLATE_ID}: ${summary.allPass ? "PASS" : "FAIL"} (${summary.passed}/${summary.requested})`);
    process.exit(summary.allPass ? 0 : 1);
  }

  const result = await runAutonomousRoundTrip(common);
  console.log(JSON.stringify(result, null, 2));
  const pass = result.status === "PASS";
  const generateOnlyOk = generateOnly && result.status === "GENERATE_ONLY";
  console.log(`\n${TEMPLATE_ID}: ${pass ? "PASS" : result.status}`);
  if (result.failureKind) console.log(`failureKind: ${result.failureKind}`);
  if (result.artifacts) {
    console.log("Artifacts:");
    for (const [k, v] of Object.entries(result.artifacts)) {
      if (v) console.log(`  ${k}: ${v}`);
    }
  }
  process.exit(pass || generateOnlyOk ? 0 : 1);
}

const isCli =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  main().catch((e) => {
    console.error(e.message || String(e));
    process.exit(1);
  });
}

#!/usr/bin/env node
/**
 * AUTONOMOUS_ROUND_TRIP_TEST — SKYBRO (Gemini) path.
 *
 *   npm run AUTONOMOUS_ROUND_TRIP_SKYBRO
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RECEIVED_TOKENS, runAutonomousRoundTrip } from "./autonomous-round-trip-lib.mjs";

const TEMPLATE_ID = "AUTONOMOUS_ROUND_TRIP_TEST_SKYBRO";
const COUSIN = "SKYBRO";

const missionDescription =
  "Confirm Sally autonomous relay proof on Gemini. Reply with AUTONOMOUS_ROUND_TRIP_RECEIVED on its own line, then one sentence of infra/homepage lens.";

function buildShortPaste({ packetId, metadata }) {
  return [
    `Werkles AUTONOMOUS_ROUND_TRIP_TEST — ${COUSIN} (Gemini) autonomous relay proof.`,
    "",
    `Packet: ${packetId}`,
    `nextActionHash: ${metadata.nextActionHash}`,
    "",
    "Copy this exact line on its own line (required for PASS):",
    RECEIVED_TOKENS.primary,
    "",
    "Then one sentence on Werkles homepage rewrite from infra lens.",
    "No deploy, SQL, or billing.",
  ];
}

async function main() {
  const args = process.argv.slice(2);
  const generateOnly = args.includes("--generate-only");
  const execute = args.includes("--execute");

  const result = await runAutonomousRoundTrip({
    cousinId: COUSIN,
    templateId: TEMPLATE_ID,
    missionDescription,
    buildShortPaste,
    packetIdPrefix: `TO_${COUSIN}_AUTONOMOUS_ROUND_TRIP_TEST`,
    proofManifestRel: "foreman/crew-dispatch/AUTONOMOUS_ROUND_TRIP_SKYBRO_PROOF.json",
    verdictPrefix: "AUTONOMOUS_ROUND_TRIP",
    generateOnly,
    allowSend: execute || undefined,
  });

  console.log(JSON.stringify(result, null, 2));
  const pass = result.status === "PASS";
  console.log(`\n${TEMPLATE_ID}: ${pass ? "PASS" : result.status}`);
  if (result.failureKind) console.log(`failureKind: ${result.failureKind}`);
  process.exit(pass || (generateOnly && result.status === "GENERATE_ONLY") ? 0 : 1);
}

const isCli =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  main().catch((e) => {
    console.error(e.message || String(e));
    process.exit(1);
  });
}

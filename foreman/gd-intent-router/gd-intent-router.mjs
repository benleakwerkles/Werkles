#!/usr/bin/env node
/**
 * GD_INTENT_ROUTER_V1 — Ben issues mission class; GD routes cousins.
 *
 * Does NOT modify crew-dispatch proofs or relay-courier routing.
 *
 * Usage (repo root):
 *   node foreman/gd-intent-router/gd-intent-router.mjs list
 *   node foreman/gd-intent-router/gd-intent-router.mjs route HOMEPAGE_VISUAL_NARRATIVE
 *   node foreman/gd-intent-router/gd-intent-router.mjs generate HOMEPAGE_VISUAL_NARRATIVE [--brief "..."]
 *   node foreman/gd-intent-router/gd-intent-router.mjs collect <RUN_ID>
 *   node foreman/gd-intent-router/gd-intent-router.mjs synthesize <RUN_ID> [--force]
 *   node foreman/gd-intent-router/gd-intent-router.mjs runs
 */
import {
  routeIntent,
  listMissionClasses,
  generateRun,
  collectReceipts,
  synthesizeRun,
  listRuns,
  normalizeMissionClass,
} from "./gd-intent-router-lib.mjs";
import { generateThreadRefreshPacket } from "./thread-refresh-lib.mjs";

function usage() {
  console.log(`GD Intent Router v1 — outcomes, not cousins.

Commands:
  list                          Mission class registry
  route <MISSION_CLASS>         Show cousin assignment (no files written)
  generate <MISSION_CLASS>      Create packets + run manifest + outbox copies
      [--brief "operator note"]
  collect <RUN_ID>              Pull matching FROM_* receipts from inbox
  synthesize <RUN_ID>           Build synthesis packet + Operator Brief (definition of done)
      [--force]                 Synthesize even if receipts missing
  thread-refresh                Generate THREAD_REFRESH_PACKET.md from cockpit (no cousins)
  runs                          List router runs

Examples:
  node foreman/gd-intent-router/gd-intent-router.mjs route UX_REVIEW
  node foreman/gd-intent-router/gd-intent-router.mjs generate CAPITAL_ALLOCATION --brief "Gate 05 posture review"
`);
}

function parseBrief(args) {
  const i = args.indexOf("--brief");
  if (i === -1) return "";
  return args.slice(i + 1).join(" ").trim();
}

function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes("--help") || args.includes("-h")) {
    usage();
    process.exit(args.length ? 0 : 1);
  }

  const cmd = args[0];

  if (cmd === "list") {
    console.log(JSON.stringify({ missionClasses: listMissionClasses() }, null, 2));
    return;
  }

  if (cmd === "route") {
    const missionClass = args[1];
    if (!missionClass) {
      console.error("Usage: route <MISSION_CLASS>");
      process.exit(1);
    }
    const route = routeIntent(missionClass);
    console.log(JSON.stringify(route, null, 2));
    return;
  }

  if (cmd === "generate") {
    const missionClass = args[1];
    if (!missionClass) {
      console.error("Usage: generate <MISSION_CLASS> [--brief \"...\"]");
      process.exit(1);
    }
    if (normalizeMissionClass(missionClass) === "THREAD_REFRESH_PACKET") {
      const result = generateThreadRefreshPacket();
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    const brief = parseBrief(args);
    const manifest = generateRun(missionClass, { brief });
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }

  if (cmd === "collect") {
    const runId = args[1];
    if (!runId) {
      console.error("Usage: collect <RUN_ID>");
      process.exit(1);
    }
    const result = collectReceipts(runId);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.allReceived ? 0 : 2);
  }

  if (cmd === "synthesize") {
    const runId = args[1];
    if (!runId) {
      console.error("Usage: synthesize <RUN_ID> [--force]");
      process.exit(1);
    }
    const force = args.includes("--force");
    const manifest = synthesizeRun(runId, { force });
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }

  if (cmd === "thread-refresh") {
    const result = generateThreadRefreshPacket();
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (cmd === "runs") {
    console.log(JSON.stringify({ runs: listRuns() }, null, 2));
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  usage();
  process.exit(1);
}

try {
  main();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}

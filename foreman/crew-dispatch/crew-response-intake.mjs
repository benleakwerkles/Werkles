#!/usr/bin/env node
/**
 * AEYE Crew Relay — response intake (validate + atomic process).
 * Run from repo root:
 *   node foreman/crew-dispatch/crew-response-intake.mjs validate
 *   node foreman/crew-dispatch/crew-response-intake.mjs process
 *   node foreman/crew-dispatch/crew-response-intake.mjs process --dry-run
 *   node foreman/crew-dispatch/crew-response-intake.mjs --self-test
 *   node foreman/crew-dispatch/crew-response-intake.mjs run-fixtures
 */
import { runCockpitHashSelfTest } from "../../scripts/foreman/_foreman-core.mjs";
import {
  validateInbox,
  processInbox,
  formatValidationReport,
  markPacketSent,
  archiveOldSentPackets,
  listOutboxPackets,
  loadSchema,
  inboxStatus,
  formatInboxAlarm,
  consumeReply,
  quarantineReply,
} from "./crew-relay-lib.mjs";

function usage() {
  console.log(`Commands:
  alarm                 Loud report of unread replies; exit 1 if any are waiting
  status                Inbox status as JSON (counts, ages, per-file status)
  validate              Validate inbox (moves nothing)
  process [--dry-run]   Validate all first; move to processed/ only if all pass
  consume <file> --note "..."      Record a hand-delivered receipt as read and acted on
  quarantine <file> --reason "..." Park an unusable reply with the reason recorded
  mark-sent <file>      Move outbox packet to sent/ (rejects stale)
  archive-sent          Move old sent/ packets to archive/
  list-outbox [--sent]  List unsent (default) or include sent
  --self-test           Hash parity on NEXT_ACTION.md
  run-fixtures          Run fixture test suite`);
}

function runSelfTest() {
  const result = runCockpitHashSelfTest();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

async function runFixtures() {
  const { runFixtureTests } = await import("./crew-relay-test.mjs");
  const result = runFixtureTests();
  console.log(result.report);
  process.exit(result.ok ? 0 : 1);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    usage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  if (args.includes("--self-test")) {
    runSelfTest();
    return;
  }

  if (args[0] === "run-fixtures") {
    runFixtures();
    return;
  }

  if (args[0] === "list-outbox") {
    const includeSent = args.includes("--sent");
    const packets = listOutboxPackets(includeSent);
    console.log(JSON.stringify({ includeSent, count: packets.length, packets: packets.map((p) => ({
      file: p.file,
      dir: p.dir,
      sent: p.sent,
      stale: p.metadata ? loadSchema() && null : null,
      parseError: p.parseError,
    })) }, null, 2));
    return;
  }

  if (args[0] === "mark-sent") {
    const file = args[1];
    if (!file) {
      console.error("Usage: mark-sent <TO_COUSIN_*.md>");
      process.exit(1);
    }
    const result = markPacketSent(file);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  if (args[0] === "archive-sent") {
    const result = archiveOldSentPackets();
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (args[0] === "alarm") {
    const status = inboxStatus();
    console.log(formatInboxAlarm(status));
    process.exit(status.total === 0 ? 0 : 1);
  }

  if (args[0] === "status") {
    console.log(JSON.stringify(inboxStatus(), null, 2));
    return;
  }

  if (args[0] === "consume" || args[0] === "quarantine") {
    const file = args[1];
    const flag = args[0] === "consume" ? "--note" : "--reason";
    const idx = args.indexOf(flag);
    const text = idx >= 0 ? args.slice(idx + 1).join(" ") : "";
    if (!file || !text) {
      console.error(`Usage: ${args[0]} <FROM_COUSIN_*.md> ${flag} "..."`);
      process.exit(1);
    }
    const result =
      args[0] === "consume" ? consumeReply(file, text) : quarantineReply(file, text);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  if (args[0] === "validate") {
    const validation = validateInbox();
    console.log(formatValidationReport(validation));
    process.exit(validation.ok ? 0 : 1);
  }

  if (args[0] === "process") {
    const dryRun = args.includes("--dry-run");
    const result = processInbox({ dryRun });
    console.log(formatValidationReport({ ok: result.ok, fileCount: result.summary.length, results: result.summary }));
    console.log("");
    console.log(result.message);
    if (result.moved?.length) {
      console.log("Moved:");
      for (const m of result.moved) console.log(`  ${m.from} -> processed/${m.to}`);
    }
    process.exit(result.ok ? 0 : 1);
  }

  usage();
  process.exit(1);
}

main();

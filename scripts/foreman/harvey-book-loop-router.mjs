#!/usr/bin/env node

import { errorEnvelope, runBookLoopRouter } from "./harvey-book-loop-router-lib.mjs";

function parseArguments(argv) {
  const result = { apply: false };
  const seen = new Set();
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--") || seen.has(argument)) throw new Error("BOOK_LOOP_ARGUMENT_INVALID");
    seen.add(argument);
    if (argument === "--apply") {
      result.apply = true;
      continue;
    }
    if (!["--mailbox-root", "--release-manifest"].includes(argument) || index + 1 >= argv.length || argv[index + 1].startsWith("--")) {
      throw new Error("BOOK_LOOP_ARGUMENT_INVALID");
    }
    const value = argv[index + 1];
    index += 1;
    if (argument === "--mailbox-root") result.mailboxRoot = value;
    if (argument === "--release-manifest") result.releaseManifestPath = value;
  }
  if (!result.mailboxRoot || !result.releaseManifestPath) throw new Error("BOOK_LOOP_ARGUMENT_INVALID");
  return result;
}

let options = { apply: process.argv.includes("--apply") };
try {
  options = parseArguments(process.argv.slice(2));
  const output = await runBookLoopRouter(options);
  process.stdout.write(`${JSON.stringify(output)}\n`);
} catch (error) {
  const normalized = error?.message === "BOOK_LOOP_ARGUMENT_INVALID"
    ? Object.assign(new Error("BOOK_LOOP_ARGUMENT_INVALID"), { code: "BOOK_LOOP_ARGUMENT_INVALID", exitCode: 2 })
    : error;
  const failure = errorEnvelope(normalized, options.apply);
  process.stdout.write(`${JSON.stringify(failure.output)}\n`);
  process.exitCode = failure.exitCode;
}

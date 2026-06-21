#!/usr/bin/env node
/**
 * SoleDash → Petra transport v0 CLI
 *   node scripts/foreman/soledash-petra-deliver.mjs --text "hello Petra"
 *   node scripts/foreman/soledash-petra-deliver.mjs --file foreman/soledash/.petra-transport-pending.txt
 */
import fs from "node:fs";

import { deliverSoleDashTextToPetra } from "./relay-courier-lib.mjs";

function readArg(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

async function main() {
  const file = readArg("--file");
  const inline = readArg("--text");
  let text = inline ?? "";

  if (file) {
    text = fs.readFileSync(file, "utf8");
  }

  if (!text.trim()) {
    console.error("Usage: soledash-petra-deliver.mjs --text \"...\" | --file path");
    process.exit(1);
  }

  const result = await deliverSoleDashTextToPetra(text);
  console.log(JSON.stringify(result));
  process.exit(result.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: err.message }));
  process.exit(1);
});

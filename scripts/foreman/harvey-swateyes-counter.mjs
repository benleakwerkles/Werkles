import { createHash } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { projectHarveySwateyeCounter } from "../../lib/harvey/swateye-counter.ts";
import { compileHarveyOvernightSwateyesReceipt } from "../../lib/harvey/swateyes-authority.ts";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(scriptDirectory, "..", "..");
const streamPath = "foreman/soledash/SWATTER_EVENT_STREAM.json";
const approvalPath = "foreman/gates/APPROVAL_LOG.md";
const gatePath = "foreman/reviews/GATE-harvey-overnight-20-minute-build-20260729-0614.md";
const outputPath = "foreman/soledash/SWATEYES_TERMINAL_COUNTER.json";

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function safeReceiptPath(value) {
  return typeof value === "string"
    && /^foreman\/receipts\/[A-Za-z0-9_.-]+\.json$/.test(value);
}

export async function buildSwateyesTerminalCounter(repositoryRoot = defaultRoot) {
  const [streamText, approvalLog, gateContract] = await Promise.all([
    readFile(path.join(repositoryRoot, streamPath), "utf8"),
    readFile(path.join(repositoryRoot, approvalPath), "utf8"),
    readFile(path.join(repositoryRoot, gatePath), "utf8"),
  ]);
  const stream = JSON.parse(streamText);
  const receipts = {};
  for (const event of Array.isArray(stream.events) ? stream.events : []) {
    if (!safeReceiptPath(event.receipt_path)) continue;
    receipts[event.receipt_path] = JSON.parse(
      await readFile(path.join(repositoryRoot, event.receipt_path), "utf8"),
    );
  }
  const authority = compileHarveyOvernightSwateyesReceipt(approvalLog, gateContract);
  const projection = projectHarveySwateyeCounter(
    stream,
    receipts,
    authority ? [authority] : [],
  );
  const unsigned = {
    schema: "werkles.harvey-swateyes-terminal-counter/v1",
    sign: "SWATS SERVED",
    confirmed_terminal_swats: projection.confirmed_swats,
    provider_permission_prompts_swatted: projection.permissions_swatted,
    technical_blockers_bypassed: projection.technical_blockers_bypassed,
    green: projection.green,
    blue: projection.blue,
    red: projection.red,
    latest_event_id: projection.latest?.event_id ?? null,
    latest_summary: projection.latest?.summary ?? null,
    source_event_stream: streamPath,
    source_event_stream_sha256: sha256(streamText),
    truth: projection.truth,
  };
  return { ...unsigned, projection_sha256: sha256(JSON.stringify(unsigned)) };
}

export async function writeSwateyesTerminalCounter(repositoryRoot = defaultRoot) {
  const counter = await buildSwateyesTerminalCounter(repositoryRoot);
  const destination = path.join(repositoryRoot, outputPath);
  const temporary = `${destination}.tmp`;
  await writeFile(temporary, `${JSON.stringify(counter, null, 2)}\n`, "utf8");
  await rename(temporary, destination);
  return { destination, counter };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes("--write");
  const result = write
    ? await writeSwateyesTerminalCounter(defaultRoot)
    : { counter: await buildSwateyesTerminalCounter(defaultRoot) };
  process.stdout.write(`${JSON.stringify(result.counter, null, 2)}\n`);
}

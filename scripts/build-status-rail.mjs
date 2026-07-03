import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const HANDOFFS_DIR = join(ROOT, "foreman", "handoffs");
const ARTIFACT_REGISTRY = join(ROOT, "foreman", "artifacts", "ARTIFACT_REGISTRY_V0.json");
const OUTPUT = join(ROOT, "foreman", "artifacts", "status_rail_v0.json");

const DISPLAY_STATES = ["DISPATCHED", "RECEIVED", "WORKING", "BLOCKED", "RECEIPT_RETURNED", "UNKNOWN"];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(path));
    } else {
      files.push(path);
    }
  }
  return files;
}

function lineMatching(lines, patterns) {
  return lines.find((line) => patterns.some((pattern) => pattern.test(line)));
}

function hasNonEmptySection(lines, headingPattern) {
  const start = lines.findIndex((line) => headingPattern.test(line));
  if (start === -1) return null;

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (/^#{1,6}\s+/.test(line)) break;
    if (line && line !== "```") return lines[index];
  }

  return null;
}

function classifyReceiptText(text) {
  const lines = text.split(/\r?\n/);
  const nonEmpty = lines.map((line) => line.trim()).filter(Boolean);

  const failLine = lineMatching(nonEmpty, [/^FAIL$/i, /\bPASS\/FAIL:\s*FAIL\b/i]);
  if (failLine) return { status: "BLOCKED", evidence: failLine };

  const blockedLine = lineMatching(nonEmpty, [
    /^Status:\s*BLOCKED\b/i,
    /^BLOCKED\b/i,
    /^##\s+Blocked\b/i,
    /^##\s+Blocked\s*\/\s*Pending\b/i,
  ]);
  if (blockedLine) return { status: "BLOCKED", evidence: blockedLine };

  const blockedSectionEvidence = hasNonEmptySection(lines, /^##\s+Blocked\s*\/\s*Pending\b/i);
  if (blockedSectionEvidence) return { status: "BLOCKED", evidence: blockedSectionEvidence.trim() };

  const passLine = lineMatching(nonEmpty, [/^PASS$/i, /\bPASS\/FAIL:\s*PASS\b/i]);
  if (passLine) return { status: "RECEIPT_RETURNED", evidence: passLine };

  const receiptReturnedLine = lineMatching(nonEmpty, [
    /\bThis receipt confirms\b/i,
    /\breceipt returned\b/i,
    /\bverified after\b/i,
    /\bverified live\b/i,
  ]);
  if (receiptReturnedLine) return { status: "RECEIPT_RETURNED", evidence: receiptReturnedLine };

  const receivedLine = lineMatching(nonEmpty, [/^RECEIVED\b/i, /\breceived\b/i]);
  if (receivedLine) return { status: "RECEIVED", evidence: receivedLine };

  const workingLine = lineMatching(nonEmpty, [/^WORKING\b/i, /^##\s+Working\b/i]);
  if (workingLine) return { status: "WORKING", evidence: workingLine };

  const dispatchedLine = lineMatching(nonEmpty, [/^DISPATCHED\b/i, /^Destination:\s+/i, /^DESTINATION\s*$/i]);
  if (dispatchedLine) return { status: "DISPATCHED", evidence: dispatchedLine };

  return { status: "UNKNOWN", evidence: "proof absent" };
}

function artifactIdFromPath(path) {
  return relative(ROOT, path)
    .replace(/\\/g, "/")
    .replace(/\.[^.]+$/, "")
    .split("/")
    .pop();
}

function railEntryFromReceiptFile(path, text) {
  const classification = classifyReceiptText(text);
  return {
    artifact_id: artifactIdFromPath(path),
    source_receipt: relative(ROOT, path).replace(/\\/g, "/"),
    status: classification.status,
    evidence: classification.evidence,
  };
}

function railEntriesFromRegistry(raw) {
  const registry = JSON.parse(raw);
  return (registry.artifacts || [])
    .filter((artifact) => artifact && artifact.receipt)
    .map((artifact) => ({
      artifact_id: artifact.artifact_id || "UNKNOWN",
      source_receipt: "foreman/artifacts/ARTIFACT_REGISTRY_V0.json",
      status: artifact.status === "WATCH" ? "UNKNOWN" : "RECEIPT_RETURNED",
      evidence: artifact.status === "WATCH" ? "proof absent" : `registry receipt present; status ${artifact.status || "UNKNOWN"}`,
    }));
}

const receiptFiles = (await walk(HANDOFFS_DIR))
  .filter((path) => /receipt/i.test(path))
  .filter((path) => !/STATUS_RAIL_V0_RECEIPT/i.test(path))
  .filter((path) => /\.(md|json)$/i.test(path));

const entries = [];
for (const path of receiptFiles) {
  entries.push(railEntryFromReceiptFile(path, await readFile(path, "utf8")));
}

const registryRaw = await readFile(ARTIFACT_REGISTRY, "utf8").catch(() => "");
if (registryRaw) entries.push(...railEntriesFromRegistry(registryRaw));

const rail = {
  artifact_id: "status-rail-v0",
  generated_at: new Date().toISOString(),
  data_source: "receipt artifacts only",
  display: DISPLAY_STATES,
  entries: entries.sort((left, right) => left.artifact_id.localeCompare(right.artifact_id)),
};

await writeFile(OUTPUT, `${JSON.stringify(rail, null, 2)}\n`, "utf8");
console.log(`wrote ${entries.length} status rail entr${entries.length === 1 ? "y" : "ies"} to ${OUTPUT}`);

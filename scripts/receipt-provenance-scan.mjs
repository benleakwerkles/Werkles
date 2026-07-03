import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUTPUT = join(ROOT, "foreman", "artifacts", "receipt_provenance.json");
const SEARCH_ROOTS = [
  "speaker/receipts",
  "foreman/handoffs",
  "foreman/artifacts",
  "data/organism",
];
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist"]);
const IDENTITY_RE = /\b(Dink(?:2)?@Sally|Dink@Betsy|DINK@SALLY|DINK2@SALLY|Thufir@Sally|Bean@Sally|Ender@Betsy|Codex Foreman|Dink)\b/g;

function rel(path) {
  return relative(ROOT, path).replace(/\\/g, "/");
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

function normalizeIdentity(value) {
  if (!value) return "";
  const text = String(value).trim();
  if (text.toUpperCase() === "DINK@SALLY") return "Dink@Sally";
  if (text.toUpperCase() === "DINK2@SALLY") return "Dink2@Sally";
  if (text === "Dink") return "Dink@Sally";
  return text;
}

function maybeJson(raw, path) {
  if (![".json", ".jsonl"].includes(extname(path).toLowerCase())) return [];
  if (extname(path).toLowerCase() === ".jsonl") {
    return raw.split(/\r?\n/).filter(Boolean).flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function identitiesFromObject(object) {
  const identities = [];
  const candidates = [
    object?.producer,
    object?.consumer,
    object?.source?.aeye,
    object?.source?.machine ? `${object?.source?.aeye || "UNKNOWN"}@${object.source.machine}` : "",
    object?.target_address,
    object?.origin,
    object?.aeye_runtime,
  ];
  for (const candidate of candidates) {
    const identity = normalizeIdentity(candidate);
    if (identity) identities.push(identity);
  }
  return identities;
}

function evidenceType(path, raw, objects) {
  if (objects.some((object) => object?.receipt_id)) return "speaker_receipt_json";
  if (objects.some((object) => object?.event_type === "origin_response_delivered")) return "origin_response_receipt";
  if (/RECEIPT/i.test(path)) return "handoff_receipt";
  if (/receipt/i.test(raw)) return "receipt_reference";
  return "candidate_receipt_context";
}

async function main() {
  const files = [];
  for (const root of SEARCH_ROOTS) files.push(...await walk(join(ROOT, root)));
  const sources = [];
  const candidateMap = new Map();

  for (const file of files.filter((path) => /\.(json|jsonl|md)$/i.test(path)).sort()) {
    const raw = await readFile(file, "utf8").catch(() => "");
    if (!raw.trim()) continue;
    if (!/receipt|Dink|Thufir|Bean|Ender|Codex Foreman|source|producer/i.test(raw) && !/receipt|handoff/i.test(file)) continue;
    const objects = maybeJson(raw, file);
    const identities = new Set();

    for (const object of objects) {
      for (const identity of identitiesFromObject(object)) identities.add(identity);
    }
    for (const match of raw.matchAll(IDENTITY_RE)) identities.add(normalizeIdentity(match[1]));
    if (!identities.size && /receipt/i.test(file)) identities.add("UNKNOWN");

    const source = {
      path: rel(file),
      evidence_type: evidenceType(file, raw, objects),
      identities: [...identities].sort(),
      receipt_ids: objects.map((object) => object?.receipt_id).filter(Boolean),
      packet_ids: objects.map((object) => object?.packet_id).filter(Boolean),
    };
    sources.push(source);

    for (const identity of source.identities) {
      if (!candidateMap.has(identity)) {
        candidateMap.set(identity, {
          identity,
          evidence_count: 0,
          receipt_ids: new Set(),
          packet_ids: new Set(),
          files: [],
        });
      }
      const candidate = candidateMap.get(identity);
      candidate.evidence_count += 1;
      source.receipt_ids.forEach((id) => candidate.receipt_ids.add(id));
      source.packet_ids.forEach((id) => candidate.packet_ids.add(id));
      candidate.files.push(source.path);
    }
  }

  const candidates = [...candidateMap.values()]
    .map((candidate) => ({
      identity: candidate.identity,
      evidence_count: candidate.evidence_count,
      receipt_ids: [...candidate.receipt_ids].sort(),
      packet_ids: [...candidate.packet_ids].sort(),
      files: candidate.files.sort().slice(0, 12),
    }))
    .sort((left, right) => right.evidence_count - left.evidence_count || left.identity.localeCompare(right.identity));

  const output = {
    artifact_id: "RECEIPT_PROVENANCE_V0",
    generated_at: new Date().toISOString(),
    status: candidates.length ? "PASS_RECEIPT_PROVENANCE_INDEXED" : "FAIL_NO_RECEIPT_PROVENANCE",
    note: "This is provenance evidence, not a final human attribution verdict.",
    top_candidates: candidates.slice(0, 8),
    source_count: sources.length,
    sources,
  };
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`${output.status}: ${candidates.length} candidate identities, ${sources.length} source files`);
}

await main();

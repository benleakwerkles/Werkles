import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DEFAULT_INPUT = join(ROOT, "foreman", "artifacts", "inheritance_detector_events.sample.json");
const DEFAULT_OUTPUT = join(ROOT, "foreman", "artifacts", "candidate_inheritance_events.json");

function hasProof(event) {
  return event.verified === true || event.proof !== undefined;
}

function clampConfidence(value) {
  return Math.max(0.05, Math.min(0.95, Number(value.toFixed(2))));
}

function scoreCandidate({ read, action, write, missingProof }) {
  let score = 0.62;
  if (write.derived_from === read.artifact_id) score += 0.16;
  if (action.derived_artifact === write.artifact_id) score += 0.12;
  if (read.author && read.author !== write.author) score += 0.05;
  if (read.timestamp && action.timestamp && write.timestamp) score += 0.05;
  score -= missingProof.length * 0.05;
  return clampConfidence(score);
}

function normalizeInput(raw) {
  if (Array.isArray(raw)) {
    return {
      reads: raw.filter((event) => event.event_type === "ReadEvent"),
      derived_actions: raw.filter((event) => event.event_type === "DerivedActionEvent"),
      writes: raw.filter((event) => event.event_type === "WriteEvent"),
    };
  }

  return {
    reads: raw.reads || raw.ReadEvent || [],
    derived_actions: raw.derived_actions || raw.DerivedActionEvent || [],
    writes: raw.writes || raw.WriteEvent || [],
  };
}

function detectInheritanceEventCandidates(input) {
  const candidates = [];

  for (const read of input.reads) {
    for (const action of input.derived_actions) {
      if (action.actor !== read.reader) continue;
      if (action.source_artifact_id !== read.artifact_id) continue;

      for (const write of input.writes) {
        if (write.author !== read.reader) continue;
        if (action.derived_artifact && action.derived_artifact !== write.artifact_id) continue;
        if (write.derived_from && write.derived_from !== read.artifact_id) continue;

        const missingProof = [
          hasProof(read) ? "" : "read_event_proof",
          hasProof(action) ? "" : "derived_action_event_proof",
          hasProof(write) ? "" : "write_event_proof",
          read.author ? "" : "source_author",
        ].filter(Boolean);

        if (!missingProof.length) continue;

        candidates.push({
          artifact_id: read.artifact_id,
          reader: read.reader,
          author: read.author || "UNKNOWN",
          derived_artifact: write.artifact_id,
          confidence: scoreCandidate({ read, action, write, missingProof }),
          missing_proof: missingProof,
        });
      }
    }
  }

  const deduped = new Map();
  for (const candidate of candidates) {
    const key = [
      candidate.artifact_id,
      candidate.reader,
      candidate.author,
      candidate.derived_artifact,
    ].join("::");
    const existing = deduped.get(key);
    if (!existing || candidate.confidence > existing.confidence) {
      deduped.set(key, candidate);
    }
  }

  return [...deduped.values()].sort((left, right) => right.confidence - left.confidence);
}

const inputPath = process.argv[2] ? join(ROOT, process.argv[2]) : DEFAULT_INPUT;
const outputPath = process.argv[3] ? join(ROOT, process.argv[3]) : DEFAULT_OUTPUT;
const raw = JSON.parse(await readFile(inputPath, "utf8"));
const candidates = detectInheritanceEventCandidates(normalizeInput(raw));

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(candidates, null, 2)}\n`, "utf8");
console.log(`wrote ${candidates.length} candidate inheritance event(s) to ${outputPath}`);

#!/usr/bin/env node
import { readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..", "..");
const manuscriptPath = path.join(repoRoot, "book", "architecture", "STREAM_SPLIT_AND_PROOF_BOUNDARIES_V0.md");
const text = readFileSync(manuscriptPath, "utf8");

const requiredSections = [
  "## 1. Why Streams Must Stay Separate",
  "## 2. TinkerDen / Medulla Command Surface",
  "## 3. Nerdkle / NMCLR Proof Body",
  "## 4. Book / Architecture Manuscript",
  "## 5. Feral / TinkerDen Cockpit Membrane",
  "## 6. What Manuscript Can Prove",
  "## 7. What Manuscript Cannot Prove",
  "## 8. Forbidden Crossings",
  "## 9. Receipt Discipline",
  "## 10. Open Questions",
];

const requiredPhrases = [
  "Manuscript doctrine cannot prove automation.",
  "Build specs cannot be treated as working software.",
  "Feral proof cannot canonize NMCLR.",
  "NMCLR proof cannot canonize Feral.",
  "No packet is complete without ACK / BLOCKER / ARTIFACT.",
  "Ender@Sally is retired and receives no work.",
];

const forbiddenClaims = [
  "automation is built",
  "NMCLR is proven",
  "Feral/TinkerDen is proven",
  "SENT is a receipt",
];

const missingSections = requiredSections.filter((section) => !text.includes(section));
const missingPhrases = requiredPhrases.filter((phrase) => !text.includes(phrase));
const forbiddenHits = forbiddenClaims.filter((claim) => text.toLowerCase().includes(claim.toLowerCase()));
const hash = createHash("sha256").update(readFileSync(manuscriptPath)).digest("hex").toUpperCase();

const result = {
  check_id: "STREAM_SPLIT_MANUSCRIPT_BOUNDARY_CHECK",
  status: missingSections.length || missingPhrases.length || forbiddenHits.length ? "BLOCKER" : "ARTIFACT",
  manuscript_path: "book/architecture/STREAM_SPLIT_AND_PROOF_BOUNDARIES_V0.md",
  manuscript_hash: hash,
  byte_count: statSync(manuscriptPath).size,
  sections_found: requiredSections.length - missingSections.length,
  required_sections: requiredSections.length,
  missing_sections: missingSections,
  phrases_found: requiredPhrases.length - missingPhrases.length,
  required_phrases: requiredPhrases.length,
  missing_phrases: missingPhrases,
  forbidden_hits: forbiddenHits,
  proof_boundary: "Manuscript artifact only; not automation proof.",
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (result.status !== "ARTIFACT") process.exit(1);

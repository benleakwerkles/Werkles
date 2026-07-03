#!/usr/bin/env sh
set -eu

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if [ "$#" -gt 0 ]; then
  STAGED_FILES="$(printf '%s\n' "$@")"
else
  STAGED_FILES="$(git diff --cached --name-only --diff-filter=ACMR)"
fi

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

printf '%s\n' "$STAGED_FILES" | while IFS= read -r file_path; do
  case "$file_path" in
    speaker/receipts/*.json|speaker/receipts/*/*.json)
      node - "$file_path" <<'NODE'
const fs = require("node:fs");
const path = process.argv[2];
const receipt = JSON.parse(fs.readFileSync(path, "utf8"));

function fail(message) {
  console.error(`SPEAKER VALIDATION ERROR: ${path}: ${message}`);
  process.exit(1);
}

for (const field of ["receipt_id", "receipt_type", "timestamp", "owner", "status", "evidence"]) {
  if (receipt[field] === undefined || receipt[field] === null || receipt[field] === "") {
    fail(`missing required field '${field}'`);
  }
}

if (!["ACK", "BLOCKER", "ARTIFACT", "VALIDATION", "OPERATOR_DECISION", "CHANGE_CAPSULE"].includes(receipt.receipt_type)) {
  fail(`invalid receipt_type '${receipt.receipt_type}'`);
}

if (!["ACK", "BLOCKER", "ARTIFACT"].includes(receipt.status)) {
  fail(`invalid status '${receipt.status}'`);
}

if (!receipt.evidence || typeof receipt.evidence !== "object" || Array.isArray(receipt.evidence)) {
  fail("evidence must be an object");
}

if (!receipt.evidence.path && !receipt.evidence.summary && !receipt.evidence.sha256) {
  fail("evidence must include path, summary, or sha256");
}
NODE
      ;;
    speaker/doctrine/*.md|speaker/doctrine/*/*.md)
      node - "$file_path" <<'NODE'
const fs = require("node:fs");
const path = process.argv[2];
const text = fs.readFileSync(path, "utf8");

function fail(message) {
  console.error(`SPEAKER VALIDATION ERROR: ${path}: ${message}`);
  process.exit(1);
}

const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
if (!match) fail("missing YAML frontmatter");

const frontmatter = Object.create(null);
for (const line of match[1].split(/\r?\n/)) {
  const pair = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
  if (pair) frontmatter[pair[1]] = pair[2].trim();
}

for (const field of ["doctrine_id", "status", "source_receipt_id", "hash"]) {
  if (!frontmatter[field]) fail(`missing required frontmatter field '${field}'`);
}

if (!["DRAFT", "ACTIVE", "SUPERSEDED", "QUARANTINED", "GRAVEYARD", "DEPRECATED"].includes(frontmatter.status)) {
  fail(`invalid status '${frontmatter.status}'`);
}
NODE
      ;;
  esac
done

exit 0

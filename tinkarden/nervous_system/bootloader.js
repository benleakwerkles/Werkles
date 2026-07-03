#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const NERVOUS_SYSTEM_ROOT = __dirname;
const TINKARDEN_ROOT = path.resolve(NERVOUS_SYSTEM_ROOT, "..");
const REPO_ROOT = path.resolve(TINKARDEN_ROOT, "..");
const OUTPUT_PATH = path.join(NERVOUS_SYSTEM_ROOT, "active_context.txt");

const SOURCES = [
  {
    id: "CORE_DOCTRINE",
    label: "Core Doctrine",
    path: path.join(REPO_ROOT, "docs", "tinkularity", "PEARL_0000_THE_TINKULARITY.md")
  },
  {
    id: "ORGANISM_FRONTIER",
    label: "Current Rules",
    path: path.join(REPO_ROOT, "docs", "tinkularity", "ORGANISM_FRONTIER.md")
  },
  {
    id: "CORPUS_CALLOSUM_STATE",
    label: "Corpus Callosum State",
    path: path.join(NERVOUS_SYSTEM_ROOT, "shared_frontier.json")
  },
  {
    id: "WORMEYES_WORLD_STATE",
    label: "Wormeyes Reality Sensor",
    path: path.join(NERVOUS_SYSTEM_ROOT, "world_state.json")
  }
];

function slash(value) {
  return value.split(path.sep).join("/");
}

function rel(value) {
  return slash(path.relative(REPO_ROOT, value));
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readSource(source) {
  if (!fs.existsSync(source.path)) {
    throw new Error(`BOOTLOADER_SOURCE_MISSING: ${rel(source.path)}`);
  }

  const raw = fs.readFileSync(source.path, "utf8");
  if (!raw.trim()) {
    throw new Error(`BOOTLOADER_SOURCE_EMPTY: ${rel(source.path)}`);
  }

  return {
    ...source,
    relPath: rel(source.path),
    raw,
    bytes: Buffer.byteLength(raw, "utf8"),
    sha256: sha256(raw)
  };
}

function buildMasterSystemPrompt(sources) {
  const manifest = {
    schema: "tinkarden_master_system_prompt_v0",
    generated_at: new Date().toISOString(),
    output_path: rel(OUTPUT_PATH),
    rule: "Raw source concatenation only. No summarization.",
    sources: sources.map((source) => ({
      id: source.id,
      label: source.label,
      path: source.relPath,
      bytes: source.bytes,
      sha256: source.sha256
    }))
  };

  const sections = sources.map((source) => [
    `===== ${source.id} BEGIN =====`,
    `LABEL: ${source.label}`,
    `PATH: ${source.relPath}`,
    `SHA256: ${source.sha256}`,
    "",
    source.raw.trimEnd(),
    "",
    `===== ${source.id} END =====`
  ].join("\n"));

  return [
    "MASTER_SYSTEM_PROMPT",
    "",
    "BOOTLOADER MANIFEST",
    JSON.stringify(manifest, null, 2),
    "",
    ...sections,
    ""
  ].join("\n");
}

function runBootloader() {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  const sources = SOURCES.map(readSource);
  const MASTER_SYSTEM_PROMPT = buildMasterSystemPrompt(sources);
  fs.writeFileSync(OUTPUT_PATH, MASTER_SYSTEM_PROMPT, "utf8");

  return {
    ok: true,
    status: "ACTIVE_CONTEXT_WRITTEN",
    output_path: rel(OUTPUT_PATH),
    bytes: Buffer.byteLength(MASTER_SYSTEM_PROMPT, "utf8"),
    sha256: sha256(MASTER_SYSTEM_PROMPT),
    sources: sources.map((source) => ({
      id: source.id,
      path: source.relPath,
      bytes: source.bytes,
      sha256: source.sha256
    }))
  };
}

if (require.main === module) {
  try {
    console.log(JSON.stringify(runBootloader(), null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      status: "BOOTLOADER_BLOCKED",
      error: error instanceof Error ? error.message : String(error)
    }, null, 2));
    process.exitCode = 1;
  }
}

module.exports = {
  OUTPUT_PATH,
  SOURCES,
  buildMasterSystemPrompt,
  runBootloader
};

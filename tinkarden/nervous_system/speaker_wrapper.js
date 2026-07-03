#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const TINKARDEN_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TINKARDEN_ROOT, "..");
const CHANGE_CAPSULE_DIR = path.join(TINKARDEN_ROOT, "change_capsules");
const CANONICAL_CAPSULE_DIR = path.join(REPO_ROOT, "docs", "tinkularity", "change_capsules");
const SPEAKER_PROTOCOL_PATH = path.join(REPO_ROOT, "foreman", "speaker", "SPEAKER_DOCTRINE.md");
const SPEAKER_CHARTER_PATH = path.join(REPO_ROOT, "foreman", "speaker", "SPEAKER_CHARTER.md");

function slash(value) {
  return value.split(path.sep).join("/");
}

function rel(value) {
  return slash(path.relative(REPO_ROOT, value));
}

function ensureDirs() {
  fs.mkdirSync(CHANGE_CAPSULE_DIR, { recursive: true });
  fs.mkdirSync(CANONICAL_CAPSULE_DIR, { recursive: true });
}

function readText(filePath, fallback = "") {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return fallback;
  }
}

function sectionBody(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) return "";
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n").trim();
}

function replaceSection(markdown, heading, body) {
  const newline = markdown.includes("\r\n") ? "\r\n" : "\n";
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) throw new Error(`SECTION_NOT_FOUND: ${heading}`);

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) {
      end = index;
      break;
    }
  }

  return [
    ...lines.slice(0, start + 1),
    body.trim(),
    "",
    ...lines.slice(end)
  ].join(newline);
}

function extractSourceReceipt(markdown) {
  const source = sectionBody(markdown, "source_receipt");
  const codeBlock = source.match(/```json\s*([\s\S]*?)```/i);
  let parsed = null;
  if (codeBlock) {
    try {
      parsed = JSON.parse(codeBlock[1]);
    } catch {
      parsed = null;
    }
  }
  return { raw: source, parsed };
}

function isBlankCapsule(markdown) {
  return !sectionBody(markdown, "why_it_changed") && !sectionBody(markdown, "what_is_next");
}

function buildSpeakerPrompt(markdown, sourceReceipt) {
  const doctrine = readText(SPEAKER_PROTOCOL_PATH, "SPEAKER_DOCTRINE.md missing");
  const charter = readText(SPEAKER_CHARTER_PATH, "SPEAKER_CHARTER.md missing");

  return [
    "SPEAKER_ASSIMILATION_PROTOCOL",
    "",
    "You are Speaker. Preserve causal memory. Do not rewrite Dink-generated facts.",
    "Return JSON only with exactly these keys: why_it_changed, what_is_next.",
    "",
    "Rules:",
    "- Do not alter what_changed.",
    "- Do not alter source_receipt.",
    "- why_it_changed must explain cause -> effect -> lesson in 2-4 bullets.",
    "- what_is_next must name the next practical follow-up in 1-3 bullets.",
    "- Do not ratify doctrine on Ben's behalf.",
    "",
    "SPEAKER_CHARTER_BEGIN",
    charter,
    "SPEAKER_CHARTER_END",
    "",
    "SPEAKER_DOCTRINE_BEGIN",
    doctrine,
    "SPEAKER_DOCTRINE_END",
    "",
    "SOURCE_RECEIPT_BEGIN",
    JSON.stringify(sourceReceipt.parsed || sourceReceipt.raw, null, 2),
    "SOURCE_RECEIPT_END",
    "",
    "CHANGE_CAPSULE_BEGIN",
    markdown,
    "CHANGE_CAPSULE_END"
  ].join("\n");
}

function parseJsonFromText(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      try {
        return JSON.parse(fenced[1]);
      } catch {
        return null;
      }
    }
    const object = trimmed.match(/\{[\s\S]*\}/);
    if (object) {
      try {
        return JSON.parse(object[0]);
      } catch {
        return null;
      }
    }
  }
  return null;
}

async function callOllama(prompt) {
  const model = process.env.SPEAKER_LLM_MODEL || process.env.OLLAMA_MODEL;
  if (!model) return null;

  const host = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
  const response = await fetch(`${host.replace(/\/$/, "")}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.2 }
    })
  }).catch(() => null);

  if (!response || !response.ok) return null;
  const payload = await response.json().catch(() => null);
  return payload && typeof payload.response === "string" ? payload.response : null;
}

async function callConfiguredAeyeProvider(prompt) {
  const provider = process.env.SPEAKER_PROVIDER || process.env.AEYE_PROVIDER;
  if (!provider) return null;

  const { callAeye } = require("./aeye_client.js");
  const result = await callAeye({
    provider,
    model: process.env.SPEAKER_LLM_MODEL,
    aeye: process.env.SPEAKER_AEYE || "Speaker@Betsy",
    prompt
  }).catch(() => null);

  return result && result.ok ? result.response_text : null;
}

function callCommandProvider(prompt) {
  const command = process.env.SPEAKER_LLM_COMMAND;
  if (!command) return null;

  const result = spawnSync(command, {
    input: prompt,
    encoding: "utf8",
    shell: true,
    timeout: 120000,
    windowsHide: true
  });

  if (result.status !== 0) return null;
  return result.stdout;
}

function deterministicSpeakerFallback(sourceReceipt) {
  const receipt = sourceReceipt.parsed || {};
  const packetId = receipt.packet_id || "UNKNOWN_PACKET";
  const action = receipt.action_taken || "the recorded change";
  const artifact = receipt.artifact_path || receipt.path || "the generated artifact";

  return {
    why_it_changed: [
      `- ${packetId} turned a raw receipt into a reusable Change Capsule path instead of leaving Speaker memory trapped in transient queue data.`,
      `- ${action} matters because the organism needs causal memory attached to build artifacts, not only a sender-side proof that something happened.`,
      `- The lesson is capture before expansion: Dink can scaffold facts, then Speaker can add why without overwriting the receipt or the builder's evidence.`
    ].join("\n"),
    what_is_next: [
      `- Use ${artifact} as the intake generator for future raw receipts that need Speaker assimilation.`,
      "- Keep Dink-owned `what_changed` and `source_receipt` immutable while Speaker fills only the causal fields.",
      "- Run the wrapper in watch mode once the local LLM provider is configured so blank capsules flow into canonical docs automatically."
    ].join("\n")
  };
}

async function getSpeakerFields(markdown, sourceReceipt) {
  const prompt = buildSpeakerPrompt(markdown, sourceReceipt);
  const commandOutput = callCommandProvider(prompt);
  const ollamaOutput = commandOutput || await callOllama(prompt);
  const aeyeOutput = commandOutput || ollamaOutput ? null : await callConfiguredAeyeProvider(prompt);
  const parsed = parseJsonFromText(commandOutput || ollamaOutput || aeyeOutput);

  if (parsed && parsed.why_it_changed && parsed.what_is_next) {
    return {
      provider: commandOutput ? "SPEAKER_LLM_COMMAND" : ollamaOutput ? "OLLAMA" : "AEYE_CLIENT",
      why_it_changed: String(parsed.why_it_changed).trim(),
      what_is_next: String(parsed.what_is_next).trim()
    };
  }

  return {
    provider: "DETERMINISTIC_LOCAL_SPEAKER_FALLBACK",
    ...deterministicSpeakerFallback(sourceReceipt)
  };
}

async function processCapsule(filePath) {
  if (!filePath.endsWith(".md") || !fs.existsSync(filePath)) return null;

  const original = readText(filePath);
  if (!isBlankCapsule(original)) return null;

  const whatChanged = sectionBody(original, "what_changed");
  const sourceReceipt = extractSourceReceipt(original);
  const speakerFields = await getSpeakerFields(original, sourceReceipt);

  let next = replaceSection(original, "why_it_changed", speakerFields.why_it_changed);
  next = replaceSection(next, "what_is_next", speakerFields.what_is_next);

  if (sectionBody(next, "what_changed") !== whatChanged) {
    throw new Error("SAFETY_ABORT: what_changed mutated during Speaker assimilation");
  }
  if (sectionBody(next, "source_receipt") !== sourceReceipt.raw) {
    throw new Error("SAFETY_ABORT: source_receipt mutated during Speaker assimilation");
  }

  fs.writeFileSync(filePath, next, "utf8");

  const destination = path.join(CANONICAL_CAPSULE_DIR, path.basename(filePath));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (fs.existsSync(destination)) fs.rmSync(destination, { force: true });
  fs.renameSync(filePath, destination);

  return {
    status: "ARTIFACT",
    provider: speakerFields.provider,
    source_path: rel(filePath),
    destination_path: rel(destination)
  };
}

async function processExisting() {
  ensureDirs();
  const results = [];
  for (const name of fs.readdirSync(CHANGE_CAPSULE_DIR).filter((entry) => entry.endsWith(".md")).sort()) {
    const result = await processCapsule(path.join(CHANGE_CAPSULE_DIR, name));
    if (result) results.push(result);
  }
  return results;
}

function debounce(fn, delayMs) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

async function watch() {
  ensureDirs();
  await processExisting();
  console.log(`[speaker_wrapper] watching ${rel(CHANGE_CAPSULE_DIR)}`);
  fs.watch(CHANGE_CAPSULE_DIR, debounce(async (_eventType, filename) => {
    if (!filename || !filename.toString().endsWith(".md")) return;
    try {
      const result = await processCapsule(path.join(CHANGE_CAPSULE_DIR, filename.toString()));
      if (result) console.log(JSON.stringify(result));
    } catch (error) {
      console.error(`[speaker_wrapper] BLOCKER ${filename}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, 250));
}

async function main() {
  const command = process.argv[2] || "watch";
  ensureDirs();

  if (command === "watch") {
    await watch();
    return;
  }

  if (command === "process") {
    console.log(JSON.stringify({ ok: true, results: await processExisting() }, null, 2));
    return;
  }

  throw new Error("Usage: node tinkarden/nervous_system/speaker_wrapper.js [watch|process]");
}

if (require.main === module) {
  main().catch((error) => {
    console.error(JSON.stringify({
      ok: false,
      status: "BLOCKER",
      error: error instanceof Error ? error.message : String(error)
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  buildSpeakerPrompt,
  processCapsule,
  processExisting
};

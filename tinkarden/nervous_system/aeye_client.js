#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const TINKARDEN_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TINKARDEN_ROOT, "..");
const SERVER_ROOT = path.join(TINKARDEN_ROOT, "server");
const DB_PATH = path.join(SERVER_ROOT, "circulation.db");
const SPEAKER_BOOTPACK_OUT_DIR = path.join(REPO_ROOT, "speaker", "bootpacks", "out");
const WRAPPER_LOG_PATH = path.join(__dirname, "aeye-wrapper-events.jsonl");

const DEFAULT_MODELS = {
  openai: "gpt-4.1-mini",
  anthropic: "claude-3-5-haiku-latest",
  gemini: "gemini-1.5-flash"
};

function stamp() {
  return new Date().toISOString();
}

function id(prefix) {
  const time = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `${prefix}_${time}_${crypto.randomBytes(4).toString("hex")}`;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function slash(value) {
  return value.split(path.sep).join("/");
}

function rel(value) {
  return slash(path.relative(REPO_ROOT, value));
}

function loadDatabaseDriver() {
  const localDriver = path.join(SERVER_ROOT, "node_modules", "better-sqlite3");
  try {
    return require(localDriver);
  } catch {
    return require("better-sqlite3");
  }
}

function openCirculationDb() {
  const Database = loadDatabaseDriver();
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS aeye_api_calls (
      call_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      finished_at TEXT,
      aeye TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT,
      prompt_hash TEXT NOT NULL,
      active_context_path TEXT NOT NULL,
      active_context_hash TEXT,
      request_json TEXT NOT NULL,
      response_json TEXT,
      response_text TEXT,
      status TEXT NOT NULL,
      error TEXT
    );
  `);
  return db;
}

function logCallStart(db, record) {
  db.prepare(`
    INSERT INTO aeye_api_calls (
      call_id,
      created_at,
      aeye,
      provider,
      model,
      prompt_hash,
      active_context_path,
      active_context_hash,
      request_json,
      status
    )
    VALUES (
      @call_id,
      @created_at,
      @aeye,
      @provider,
      @model,
      @prompt_hash,
      @active_context_path,
      @active_context_hash,
      @request_json,
      @status
    )
  `).run(record);
}

function logCallFinish(db, callId, status, responseText, responseJson, error) {
  db.prepare(`
    UPDATE aeye_api_calls
    SET finished_at = @finished_at,
        response_json = @response_json,
        response_text = @response_text,
        status = @status,
        error = @error
    WHERE call_id = @call_id
  `).run({
    call_id: callId,
    finished_at: stamp(),
    response_json: responseJson ? JSON.stringify(responseJson) : null,
    response_text: responseText || null,
    status,
    error: error || null
  });
}

function logBlockedCall(options, error) {
  const db = openCirculationDb();
  const callId = options.callId || id("aeye_call");
  logCallStart(db, {
    call_id: callId,
    created_at: stamp(),
    aeye: options.aeye || "UNKNOWN_AEYE",
    provider: options.provider || "UNKNOWN_PROVIDER",
    model: options.model || null,
    prompt_hash: sha256(options.prompt || ""),
    active_context_path: options.bootpackPath || "SPEAKER_BOOTPACK_NOT_RESOLVED",
    active_context_hash: null,
    request_json: "{}",
    status: "BLOCKED_BEFORE_BOOTPACK_INJECTION"
  });
  logCallFinish(db, callId, "BLOCKED_BEFORE_BOOTPACK_INJECTION", "", null, error.message);
  db.close();
  return callId;
}

function appendWrapperLog(event) {
  fs.mkdirSync(path.dirname(WRAPPER_LOG_PATH), { recursive: true });
  fs.appendFileSync(WRAPPER_LOG_PATH, `${JSON.stringify(event)}\n`, "utf8");
}

function parseAeyeMachine(aeye, explicitMachine) {
  const value = text(aeye);
  const [name, machineFromAeye] = value.includes("@") ? value.split("@", 2) : [value, ""];
  return {
    aeyeName: text(name) || value,
    machine: text(explicitMachine) || text(machineFromAeye) || "Betsy"
  };
}

function bootpackSuffix(stream) {
  const normalized = text(stream) || "BOOTPACK";
  return normalized.toUpperCase() === "BOOTPACK" ? "BOOTPACK" : `${normalized}.BOOTPACK`;
}

function bootpackPathFor(aeyeName, machine, stream) {
  return path.join(SPEAKER_BOOTPACK_OUT_DIR, `${aeyeName}.${machine}.${bootpackSuffix(stream)}.md`);
}

function readSpeakerBootpack({ aeye, machine, stream }) {
  const { aeyeName, machine: resolvedMachine } = parseAeyeMachine(aeye, machine);
  const bootpackPath = bootpackPathFor(aeyeName, resolvedMachine, stream);

  if (!fs.existsSync(bootpackPath)) {
    return {
      aeyeName,
      machine: resolvedMachine,
      stream: text(stream) || "BOOTPACK",
      path: bootpackPath,
      relPath: rel(bootpackPath),
      loaded: false,
      content: "Speaker memory not loaded in this session.",
      hash: sha256("Speaker memory not loaded in this session.")
    };
  }

  const content = fs.readFileSync(bootpackPath, "utf8");
  return {
    aeyeName,
    machine: resolvedMachine,
    stream: text(stream) || "BOOTPACK",
    path: bootpackPath,
    relPath: rel(bootpackPath),
    loaded: true,
    content,
    hash: sha256(content)
  };
}

function buildSystemMessage(aeye, bootpack) {
  return [
    "AEYE COMMUNICATION HUB HARD LIMIT:",
    "You must treat the Speaker bootpack below as required working memory before responding.",
    "Do not answer as an isolated intelligence. Do not override explicit current instructions.",
    "Speaker is deterministic rendered text, not an active LLM or Aeye.",
    "You may not claim \"Speaker told me\", \"Speaker believes\", or \"Speaker wants\".",
    "When citing Speaker memory, reference the bootpack text, heading, receipt, or lock directly.",
    `Current Aeye: ${aeye}`,
    `Bootpack path: ${bootpack.relPath}`,
    `Bootpack loaded: ${bootpack.loaded ? "true" : "false"}`,
    "SPEAKER_BOOTPACK_BEGIN",
    bootpack.content,
    "SPEAKER_BOOTPACK_END"
  ].join("\n\n");
}

function buildProviderPayload(provider, model, systemContent, prompt) {
  const systemMessage = { role: "system", content: systemContent };
  const userMessage = { role: "user", content: prompt };

  if (provider === "openai") {
    return {
      model,
      messages: [systemMessage, userMessage]
    };
  }

  if (provider === "anthropic") {
    return {
      model,
      max_tokens: 2048,
      system: systemContent,
      messages: [userMessage],
      system_context_message: systemMessage
    };
  }

  if (provider === "gemini") {
    return {
      model,
      systemInstruction: {
        role: "system",
        parts: [{ text: systemContent }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      system_context_message: systemMessage
    };
  }

  throw new Error(`UNSUPPORTED_PROVIDER: ${provider}`);
}

function normalizeProvider(provider) {
  const normalized = text(provider).toLowerCase();
  if (["openai", "anthropic", "gemini"].includes(normalized)) return normalized;
  throw new Error("PROVIDER_REQUIRED: expected openai, anthropic, or gemini");
}

function providerAuth(provider) {
  if (provider === "openai") {
    const apiKey = text(process.env.OPENAI_API_KEY);
    if (!apiKey) throw new Error("OPENAI_API_KEY_MISSING");
    return {
      url: "https://api.openai.com/v1/chat/completions",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    };
  }

  if (provider === "anthropic") {
    const apiKey = text(process.env.ANTHROPIC_API_KEY);
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY_MISSING");
    return {
      url: "https://api.anthropic.com/v1/messages",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      }
    };
  }

  const apiKey = text(process.env.GEMINI_API_KEY);
  if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");
  return {
    url: null,
    geminiApiKey: apiKey,
    headers: {
      "Content-Type": "application/json"
    }
  };
}

function providerUrl(provider, model, auth) {
  if (provider === "gemini") {
    return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(auth.geminiApiKey)}`;
  }

  return auth.url;
}

function extractResponseText(provider, responseJson) {
  if (provider === "openai") {
    return text(responseJson?.choices?.[0]?.message?.content) || JSON.stringify(responseJson);
  }

  if (provider === "anthropic") {
    const chunks = Array.isArray(responseJson?.content) ? responseJson.content : [];
    return chunks.map((part) => text(part?.text)).filter(Boolean).join("\n") || JSON.stringify(responseJson);
  }

  const parts = responseJson?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts.map((part) => text(part?.text)).filter(Boolean).join("\n") || JSON.stringify(responseJson);
  }

  return JSON.stringify(responseJson);
}

async function sendProviderRequest(provider, model, payload) {
  const auth = providerAuth(provider);
  const url = providerUrl(provider, model, auth);
  const response = await fetch(url, {
    method: "POST",
    headers: auth.headers,
    body: JSON.stringify(payload)
  });
  const responseJson = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`PROVIDER_HTTP_${response.status}: ${JSON.stringify(responseJson)}`);
  }

  return {
    responseJson,
    responseText: extractResponseText(provider, responseJson)
  };
}

async function callAeye(input) {
  const provider = normalizeProvider(input.provider);
  const aeye = text(input.aeye);
  const prompt = text(input.prompt);
  const model = text(input.model) || DEFAULT_MODELS[provider];
  const callId = id("aeye_call");
  const bootpack = readSpeakerBootpack({
    aeye,
    machine: input.machine,
    stream: input.stream
  });

  if (!aeye) throw new Error("AEYE_REQUIRED");
  if (!prompt) throw new Error("PROMPT_REQUIRED");

  try {
    const systemContent = buildSystemMessage(aeye, bootpack);
    const payload = buildProviderPayload(provider, model, systemContent, prompt);
    const db = openCirculationDb();
    const startStatus = input.dryRun ? "BOOTPACK_INJECTED_DRY_RUN" : "BOOTPACK_INJECTED_PROVIDER_CALL_STARTED";

    logCallStart(db, {
      call_id: callId,
      created_at: stamp(),
      aeye,
      provider,
      model,
      prompt_hash: sha256(prompt),
      active_context_path: bootpack.relPath,
      active_context_hash: bootpack.hash,
      request_json: JSON.stringify(payload),
      status: startStatus
    });

    appendWrapperLog({
      event: "speaker_bootpack_injected",
      timestamp: stamp(),
      call_id: callId,
      aeye,
      aeye_name: bootpack.aeyeName,
      machine: bootpack.machine,
      stream: bootpack.stream,
      provider,
      model,
      bootpack_loaded: bootpack.loaded,
      bootpack_path: bootpack.relPath,
      bootpack_sha256: bootpack.hash,
      system_payload_sha256: sha256(systemContent),
      status: startStatus
    });

    if (input.dryRun) {
      logCallFinish(db, callId, "BOOTPACK_INJECTED_DRY_RUN_COMPLETE", "", { dry_run: true, payload }, null);
      db.close();
      return {
        ok: true,
        call_id: callId,
        aeye,
        provider,
        model,
        status: "BOOTPACK_INJECTED_DRY_RUN_COMPLETE",
        bootpack_loaded: bootpack.loaded,
        bootpack_path: bootpack.relPath,
        bootpack_sha256: bootpack.hash,
        system_payload_contains_bootpack: systemContent.includes(bootpack.content)
      };
    }

    try {
      const { responseJson, responseText } = await sendProviderRequest(provider, model, payload);
      logCallFinish(db, callId, "RESPONSE_LOGGED_BEFORE_DISPLAY", responseText, responseJson, null);
      db.close();

      return {
        ok: true,
        call_id: callId,
        aeye,
        provider,
        model,
        status: "RESPONSE_LOGGED_BEFORE_DISPLAY",
        response_text: responseText
      };
    } catch (error) {
      logCallFinish(db, callId, "PROVIDER_CALL_BLOCKED_OR_FAILED", "", null, error.message);
      db.close();
      throw error;
    }
  } catch (error) {
    if (!/AEYE_REQUIRED|PROMPT_REQUIRED/.test(error.message)) {
      logBlockedCall({ callId, aeye, provider, model, prompt, bootpackPath: bootpack.relPath }, error);
    }
    throw error;
  }
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2).replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
    result[key] = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : true;
  }
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log("Usage: node tinkarden/nervous_system/aeye_client.js --provider openai|anthropic|gemini --aeye Aeye@Machine --prompt \"text\" [--machine Betsy] [--stream BOOTPACK] [--model model] [--dry-run]");
    return;
  }

  const result = await callAeye({
    provider: args.provider,
    aeye: args.aeye,
    machine: args.machine,
    stream: args.stream,
    model: args.model,
    prompt: args.prompt,
    dryRun: Boolean(args.dryRun)
  });

  console.log(JSON.stringify(result, null, 2));
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
  DB_PATH,
  SPEAKER_BOOTPACK_OUT_DIR,
  WRAPPER_LOG_PATH,
  buildProviderPayload,
  buildSystemMessage,
  callAeye,
  readSpeakerBootpack
};

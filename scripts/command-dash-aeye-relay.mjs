import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSpeakerEntries } from "../foreman/speaker/speaker-lib.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ROUTE_MAP_PATH = join(ROOT, "tinkarden", "relay", "aeye_routes.json");
const THINKIT_PATH = join(ROOT, "foreman", "artifacts", "thinkit_questions.json");
const COMMAND_DASH_INBOX = join(ROOT, "tinkarden", "command_dash", "inbox");
const TINKARDEN_COMMANDS = join(ROOT, "tinkarden", "dispatch", "commands");
const TINKERDEN_COMMANDS = join(ROOT, "tinkerden", "dispatch", "commands");
const PRIMARY_PACKET_DIR = join(ROOT, "tinkerden", "dispatch", "packets");
const TINKARDEN_PACKET_MIRROR = join(ROOT, "tinkarden", "dispatch", "packets");
const MANIFEST_PATH = join(ROOT, "foreman", "artifacts", "aeye_relay_manifest.json");
const DISPATCH_LOG = join(ROOT, "data", "organism", "aeye_dispatch.jsonl");
const OUTBOUND_BUS = join(ROOT, "data", "organism", "aeye_outbox.jsonl");
const RELAY_VERSION = "COMMAND_DASH_AEYE_RELAY_V0";
const SPEAKER_CONSULTATION_VERSION = "SPEAKER_CONTEXT_CONSULT_V0";
const ACTIVE_SOURCE_STATUSES = new Set(["", "NEW", "OPEN", "WORKING", "READY", "QUEUED"]);
const RUN_TIME = new Date().toISOString();

const FALLBACK_ROUTES = {
  version: RELAY_VERSION,
  default_target: "Dink@Sally",
  targets: {
    "Dink@Sally": {
      aeye: "Dink",
      machine: "Sally",
      inbox: "tinkarden/aeyes/Dink@Sally/inbox",
    },
    "Thufir@Sally": {
      aeye: "Thufir",
      machine: "Sally",
      inbox: "tinkarden/aeyes/Thufir@Sally/inbox",
    },
    "Bean@Sally": {
      aeye: "Bean",
      machine: "Sally",
      inbox: "tinkarden/aeyes/Bean@Sally/inbox",
    },
    "Ender@Betsy": {
      aeye: "Ender",
      machine: "Betsy",
      inbox: "tinkarden/aeyes/Ender@Betsy/inbox",
    },
  },
  rules: [
    {
      target: "Thufir@Sally",
      match: ["validation", "validate", "pre-flight", "preflight", "gpg", "governance", "proof", "receipt"],
    },
    {
      target: "Bean@Sally",
      match: ["attack", "exploit", "red-team", "red team", "drift", "threat", "security"],
    },
    {
      target: "Ender@Betsy",
      match: ["architecture", "schema", "decision", "copy", "long-form", "longform", "apoptosis"],
    },
  ],
};

function rel(path) {
  return relative(ROOT, path).replace(/\\/g, "/");
}

function asString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function sourceStatus(value) {
  return asString(value).toUpperCase();
}

function isActiveSource(value) {
  return ACTIVE_SOURCE_STATUSES.has(sourceStatus(value));
}

function slug(value) {
  return asString(value, "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "unknown";
}

function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 12);
}

async function readJson(path, fallback = null) {
  const raw = await readFile(path, "utf8").catch(() => "");
  if (!raw.trim()) return fallback;
  return JSON.parse(raw);
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function listFiles(dir, extensions) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile() && extensions.some((extension) => entry.name.toLowerCase().endsWith(extension)))
    .map((entry) => join(dir, entry.name))
    .sort();
}

function parseMarkdownCommand(raw, sourcePath) {
  const lines = raw.split(/\r?\n/);
  const title = asString(lines.find((line) => /^#\s+/.test(line))?.replace(/^#\s+/, ""), slug(sourcePath));
  const targetLine = lines.find((line) => /^TO:\s*/i.test(line));
  const tags = lines
    .filter((line) => /^TAGS?:\s*/i.test(line))
    .flatMap((line) => line.replace(/^TAGS?:\s*/i, "").split(",").map((tag) => tag.trim()).filter(Boolean));

  return {
    source_id: slug(sourcePath),
    title,
    action: title,
    body: raw.trim(),
    target_address: targetLine ? targetLine.replace(/^TO:\s*/i, "").trim() : "",
    tags,
    status: "NEW",
  };
}

async function loadCommandFiles(dir, surface) {
  const files = await listFiles(dir, [".json", ".md"]);
  const commands = [];

  for (const file of files) {
    const raw = await readFile(file, "utf8");
    if (/\.md$/i.test(file)) {
      commands.push({
        surface,
        source_path: rel(file),
        raw: parseMarkdownCommand(raw, file),
      });
      continue;
    }

    const parsed = JSON.parse(raw);
    const values = Array.isArray(parsed) ? parsed : [parsed];
    for (const value of values) {
      commands.push({
        surface,
        source_path: rel(file),
        raw: value,
      });
    }
  }

  return commands;
}

async function loadThinkItQuestions() {
  const parsed = await readJson(THINKIT_PATH, []);
  const questions = Array.isArray(parsed) ? parsed : [];
  return questions
    .filter((question) => isActiveSource(question?.status))
    .map((question) => ({
      surface: "ThinkIt",
      source_path: rel(THINKIT_PATH),
      raw: {
        source_id: asString(question.question_id),
        title: asString(question.question, "ThinkIt question"),
        action: "Answer ThinkIt question",
        body: asString(question.question),
        target_address: asString(question.owner),
        tags: ["thinkit", "question"],
        created_at: asString(question.created_at),
        status: asString(question.status, "OPEN"),
      },
    }));
}

function mergeRouteMap(routeMap) {
  const merged = {
    ...FALLBACK_ROUTES,
    ...(routeMap || {}),
    targets: {
      ...FALLBACK_ROUTES.targets,
      ...(routeMap?.targets || {}),
    },
    rules: Array.isArray(routeMap?.rules) ? routeMap.rules : FALLBACK_ROUTES.rules,
  };
  return merged;
}

async function loadRouteMap() {
  return mergeRouteMap(await readJson(ROUTE_MAP_PATH, null));
}

function targetFromAddress(routeMap, address) {
  const cleanAddress = asString(address);
  if (!cleanAddress) return null;

  const explicit = routeMap.targets?.[cleanAddress];
  if (explicit) {
    return {
      address: cleanAddress,
      aeye: asString(explicit.aeye, cleanAddress.split("@")[0]),
      machine: asString(explicit.machine, cleanAddress.split("@")[1] || "UNKNOWN"),
      inbox: asString(explicit.inbox, `tinkarden/aeyes/${cleanAddress}/inbox`),
    };
  }

  const byAeye = Object.entries(routeMap.targets || {}).find(([, value]) => {
    return asString(value.aeye).toLowerCase() === cleanAddress.toLowerCase();
  });
  if (byAeye) return targetFromAddress(routeMap, byAeye[0]);

  if (cleanAddress.includes("@")) {
    const [aeye, machine] = cleanAddress.split("@");
    return {
      address: cleanAddress,
      aeye: asString(aeye, "UNKNOWN"),
      machine: asString(machine, "UNKNOWN"),
      inbox: `tinkarden/aeyes/${cleanAddress}/inbox`,
    };
  }

  return null;
}

function commandText(command) {
  return [
    command.title,
    command.action,
    command.body,
    command.lane,
    command.target_address,
    command.target_aeye,
    command.owner,
    ...asArray(command.tags),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildSpeakerContext(command, target) {
  const text = commandText(command);
  const entries = loadSpeakerEntries(ROOT).filter((entry) => entry.status !== "SUPERSEDED");
  const matched = entries
    .map((entry) => {
      const triggers = [...(entry.warning_triggers || []), ...(entry.tags || [])]
        .filter((trigger) => text.includes(String(trigger).toLowerCase()));
      return { entry, triggers };
    })
    .filter((match) => match.triggers.length > 0);

  const fallbackIds = new Set([
    "DRAFT_20260607-human-adaptation-thesis",
    "DRAFT_20260608-gd-command-console",
    "DRAFT_20260608-thread-registry",
    "DRAFT_20260608-ai-compression-soul-loss",
  ]);
  const fallback = entries
    .filter((entry) => fallbackIds.has(entry.id))
    .map((entry) => ({ entry, triggers: ["kernel-default"] }));

  const seen = new Set();
  const warnings = [...matched, ...fallback]
    .filter(({ entry }) => {
      if (seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    })
    .slice(0, 6)
    .map(({ entry, triggers }) => ({
      id: entry.id,
      title: entry.title,
      status: entry.status,
      path: entry.path,
      matched_triggers: triggers,
    }));

  return {
    version: SPEAKER_CONSULTATION_VERSION,
    consulted_at: RUN_TIME,
    evidence_scope: "local_speaker_files",
    office: "Speaker",
    advisory_only: true,
    ratification_rule: "Ben ratifies Speaker truth; relay only consults.",
    source_files: [
      "foreman/speaker/SPEAKER_CHARTER.md",
      "foreman/speaker/SPEAKER_DOCTRINE.md",
      "foreman/speaker/CAUSAL_LEDGER.md",
      "foreman/speaker/AEYE_ROLE_REGISTRY.md",
    ],
    target_address: target.address,
    warning_entries: warnings,
  };
}

function resolveTarget(routeMap, command) {
  const explicit = [
    command.target_address,
    command.target,
    command.target_aeye,
    command.owner,
  ].map((value) => targetFromAddress(routeMap, value)).find(Boolean);

  if (explicit) return explicit;

  const text = commandText(command);
  for (const rule of routeMap.rules || []) {
    const matches = asArray(rule.match).map((value) => value.toLowerCase());
    if (matches.some((match) => text.includes(match))) {
      const target = targetFromAddress(routeMap, rule.target);
      if (target) return target;
    }
  }

  return targetFromAddress(routeMap, routeMap.default_target) || targetFromAddress(FALLBACK_ROUTES, FALLBACK_ROUTES.default_target);
}

function normalizeCommand(source) {
  const raw = source.raw && typeof source.raw === "object" ? source.raw : {};
  const sourceId = asString(raw.source_id || raw.command_id || raw.packet_id || raw.question_id || raw.id, stableHash({ source }));
  const title = asString(raw.title || raw.question || raw.action || raw.summary, `${source.surface} command ${sourceId}`);

  return {
    source_surface: source.surface,
    source_path: source.source_path,
    source_id: sourceId,
    title,
    action: asString(raw.action, title),
    body: asString(raw.body || raw.message || raw.question || raw.details || raw.description, title),
    target_address: asString(raw.target_address || raw.target || raw.to || raw.owner),
    target_aeye: asString(raw.target_aeye || raw.aeye),
    owner: asString(raw.owner),
    lane: asString(raw.lane || raw.stream),
    tags: asArray(raw.tags),
    created_at: asString(raw.created_at || raw.timestamp, RUN_TIME),
    status: asString(raw.status, "NEW"),
  };
}

function makePacket(command, target) {
  const hashInput = {
    source_surface: command.source_surface,
    source_path: command.source_path,
    source_id: command.source_id,
    target_address: target.address,
    title: command.title,
    action: command.action,
    body: command.body,
  };
  const packetId = `AEYE_RELAY_${slug(command.source_surface).toUpperCase()}_${slug(command.source_id).toUpperCase()}_${stableHash(hashInput).toUpperCase()}`;
  const fileName = `${packetId}.json`;
  const packetPath = join(PRIMARY_PACKET_DIR, fileName);
  const mirrorPacketPath = join(TINKARDEN_PACKET_MIRROR, fileName);
  const aeyeInboxPath = join(ROOT, target.inbox, fileName);

  return {
    packet_id: packetId,
    action: command.action,
    created_at: command.created_at,
    status: "NEW",
    source_surface: command.source_surface,
    source_path: command.source_path,
    source_id: command.source_id,
    target_aeye: target.aeye,
    target_machine: target.machine,
    target_address: target.address,
    lane: command.lane,
    tags: command.tags,
    payload: {
      title: command.title,
      body: command.body,
    },
    speaker_context: buildSpeakerContext(command, target),
    relay: {
      version: RELAY_VERSION,
      relay_status: "DELIVERED_TO_LOCAL_AEYE_INBOX",
      dispatched_at: RUN_TIME,
      packet_path: rel(packetPath),
      mirror_packet_path: rel(mirrorPacketPath),
      aeye_inbox_path: rel(aeyeInboxPath),
    },
  };
}

async function sourceCommands() {
  return [
    ...await loadThinkItQuestions(),
    ...await loadCommandFiles(COMMAND_DASH_INBOX, "CommandDash"),
    ...await loadCommandFiles(TINKARDEN_COMMANDS, "TinkerDen"),
    ...await loadCommandFiles(TINKERDEN_COMMANDS, "TinkerDen"),
  ];
}

async function appendDispatchLog(packets) {
  const currentIds = new Set(packets.map((packet) => packet.packet_id));
  const raw = await readFile(DISPATCH_LOG, "utf8").catch(() => "");
  const keptLines = raw.split(/\r?\n/).filter(Boolean).filter((line) => {
    try {
      const parsed = JSON.parse(line);
      return !currentIds.has(parsed.packet_id);
    } catch {
      return true;
    }
  });

  const lines = packets
    .map((packet) => JSON.stringify({
      event_type: "packet_dispatched",
      packet_id: packet.packet_id,
      target_address: packet.target_address,
      dispatch_time: RUN_TIME,
      packet_path: packet.relay.packet_path,
      mirror_packet_path: packet.relay.mirror_packet_path,
      aeye_inbox_path: packet.relay.aeye_inbox_path,
      source_surface: packet.source_surface,
      source_id: packet.source_id,
    }));

  await mkdir(dirname(DISPATCH_LOG), { recursive: true });
  await writeFile(DISPATCH_LOG, `${[...keptLines, ...lines].join("\n")}\n`, "utf8");
  return lines.length;
}

async function writeOutboundBus(packets) {
  const currentIds = new Set(packets.map((packet) => packet.packet_id));
  const raw = await readFile(OUTBOUND_BUS, "utf8").catch(() => "");
  const keptLines = raw.split(/\r?\n/).filter(Boolean).filter((line) => {
    try {
      const parsed = JSON.parse(line);
      return !currentIds.has(parsed.packet_id);
    } catch {
      return true;
    }
  });

  const lines = packets.map((packet) => JSON.stringify({
    event_type: "packet_left_relay_boundary",
    evidence_scope: "local_daemon",
    packet_id: packet.packet_id,
    target_address: packet.target_address,
    emitted_at: RUN_TIME,
    origin: "Nerdkle Organism",
    source_surface: packet.source_surface,
    source_id: packet.source_id,
    packet_path: packet.relay.packet_path,
    mirror_packet_path: packet.relay.mirror_packet_path,
    aeye_inbox_path: packet.relay.aeye_inbox_path,
    query: {
      title: packet.payload.title,
      body: packet.payload.body,
      action: packet.action,
    },
    speaker_context: packet.speaker_context,
  }));

  await mkdir(dirname(OUTBOUND_BUS), { recursive: true });
  await writeFile(OUTBOUND_BUS, `${[...keptLines, ...lines].join("\n")}\n`, "utf8");
  return lines.length;
}

async function writePackets(packets) {
  await mkdir(PRIMARY_PACKET_DIR, { recursive: true });
  await mkdir(TINKARDEN_PACKET_MIRROR, { recursive: true });
  for (const packet of packets) {
    await writeJson(join(ROOT, packet.relay.packet_path), packet);
    await writeJson(join(ROOT, packet.relay.mirror_packet_path), packet);
    await writeJson(join(ROOT, packet.relay.aeye_inbox_path), packet);
  }
}

function manifestFor(commands, packets, dispatchEventsWritten, outboundEventsWritten) {
  const byTarget = {};
  for (const packet of packets) {
    byTarget[packet.target_address] ||= [];
    byTarget[packet.target_address].push({
      packet_id: packet.packet_id,
      source_surface: packet.source_surface,
      source_id: packet.source_id,
      packet_path: packet.relay.packet_path,
      mirror_packet_path: packet.relay.mirror_packet_path,
      aeye_inbox_path: packet.relay.aeye_inbox_path,
    });
  }

  return {
    artifact_id: "COMMAND_DASH_AEYE_RELAY_V0",
    generated_at: RUN_TIME,
    route_map: rel(ROUTE_MAP_PATH),
    sources_seen: commands.length,
    packets_written: packets.length,
    dispatch_events_written: dispatchEventsWritten,
    outbound_events_written: outboundEventsWritten,
    canonical_packet_dir: rel(PRIMARY_PACKET_DIR),
    local_packet_mirror_dir: rel(TINKARDEN_PACKET_MIRROR),
    dispatch_log: rel(DISPATCH_LOG),
    outbound_bus: rel(OUTBOUND_BUS),
    targets: byTarget,
  };
}

async function ensureSmokeCommand() {
  const smokePath = join(COMMAND_DASH_INBOX, "command_dash_relay_smoke_001.json");
  const existing = await readFile(smokePath, "utf8").catch(() => "");
  if (existing.trim()) return smokePath;

  await writeJson(smokePath, {
    command_id: "command-dash-smoke-001",
    title: "Validate Command Dash to Aeye relay",
    action: "Validate that Command Dash can reach a local Aeye inbox",
    body: "Local smoke packet proving Command Dash writes a canonical dispatch packet and mirrors it into an Aeye inbox.",
    lane: "Topology Validation",
    tags: ["command-dash", "relay", "validation", "smoke"],
    target_address: "Thufir@Sally",
    created_at: "2026-06-27T17:30:00-04:00",
    status: "NEW",
  });
  return smokePath;
}

async function runOnce({ smoke = false } = {}) {
  if (smoke) await ensureSmokeCommand();

  const routeMap = await loadRouteMap();
  const commands = (await sourceCommands())
    .map(normalizeCommand)
    .filter((command) => isActiveSource(command.status));

  const packets = commands.map((command) => makePacket(command, resolveTarget(routeMap, command)));
  await writePackets(packets);
  const dispatchEventsWritten = await appendDispatchLog(packets);
  const outboundEventsWritten = await writeOutboundBus(packets);
  await writeJson(MANIFEST_PATH, manifestFor(commands, packets, dispatchEventsWritten, outboundEventsWritten));

  console.log(`wrote ${packets.length} Aeye relay packet${packets.length === 1 ? "" : "s"} to ${rel(PRIMARY_PACKET_DIR)}`);
  console.log(`mirrored packet${packets.length === 1 ? "" : "s"} to ${rel(TINKARDEN_PACKET_MIRROR)}`);
  console.log(`published ${outboundEventsWritten} outbound bus event${outboundEventsWritten === 1 ? "" : "s"} to ${rel(OUTBOUND_BUS)}`);
  console.log(`manifest: ${rel(MANIFEST_PATH)}`);
  return { commands, packets, dispatchEventsWritten };
}

function parseArgs(argv) {
  return {
    smoke: argv.includes("--smoke"),
    watch: argv.includes("--watch"),
  };
}

const options = parseArgs(process.argv.slice(2));

await runOnce(options);

if (options.watch) {
  console.log("watch mode active; polling local relay sources every 5000ms");
  setInterval(() => {
    runOnce(options).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }, 5000);
}

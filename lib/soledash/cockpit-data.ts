import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import "server-only";

const ROOT = process.cwd();
const STATUS_DIR = path.join(ROOT, "foreman", "soledash");
const STATUS_FILE = path.join(STATUS_DIR, "LAST_LOCALHOST_STATUS.json");

export type HandoffEntry = {
  name: string;
  relPath: string;
  modifiedAt: string;
  excerpt: string;
};

export type LocalhostStatusRecord = {
  ok: boolean;
  port: string;
  checkedAt: string;
  url: string;
  httpStatus: number;
};

export type CrewBlock = {
  id: string;
  label: string;
  note: string;
  outbox: HandoffEntry[];
};

export type SoleDashData = {
  readback: {
    machine: string;
    werklesName: string;
    repo: string;
    branch: string;
    commit: string;
    commitSubject: string;
    workingTree: string;
    executionContext: string;
  };
  mission: {
    effectiveGate: string;
    title: string;
    why: string;
    hardStops: string[];
  };
  humanGate: {
    effectiveGate: string;
    labels: readonly string[];
    note: string;
    conflictPrecedence: string[];
    benMustApprove: string[];
    activeConditions: string[];
    doctrineRef: string;
  };
  localhost: {
    current: LocalhostStatusRecord;
    lastSuccess: LocalhostStatusRecord | null;
  };
  crew: CrewBlock[];
  outbox: HandoffEntry[];
  inbox: HandoffEntry[];
  receipts: HandoffEntry[];
  plumbing: {
    foreman: string;
    gimpdash: string;
    speaker: string;
  };
  sources: { path: string; loaded: boolean }[];
};

const CREW_DEFINITIONS: {
  id: string;
  label: string;
  protocolHeading: RegExp;
  outboxFilter: RegExp;
  fallbackNote: string;
}[] = [
  {
    id: "maker",
    label: "Maker (Cursor)",
    protocolHeading: /### Codex \/ Foreman|Maker/i,
    outboxFilter: /^TO_(CURSOR|MAKER|CODEX)_/i,
    fallbackNote: "Bounded app/UI implementation on local build machine."
  },
  {
    id: "dink",
    label: "Dink (local hands)",
    protocolHeading: /LOCAL HANDS READBACK/i,
    outboxFilter: /^TO_DINK_/i,
    fallbackNote: "Local hands operator — LOCAL HANDS READBACK required at session start."
  },
  {
    id: "petra",
    label: "Petra (Comptroller)",
    protocolHeading: /### ChatGPT \/ Comptroller/i,
    outboxFilter: /^TO_PETRA_/i,
    fallbackNote: "Scope, gates, GO/NO-GO, lane law."
  },
  {
    id: "ender",
    label: "Ender (Claude)",
    protocolHeading: /### Claude \/ Ender/i,
    outboxFilter: /^TO_ENDER_/i,
    fallbackNote: "Prose, UX flows, narrative structure, product language."
  },
  {
    id: "skybro",
    label: "Skybro (Gemini)",
    protocolHeading: /### Gemini \/ Skybro/i,
    outboxFilter: /^TO_SKYBRO_/i,
    fallbackNote: "Architecture and product exploration."
  },
  {
    id: "bean",
    label: "Bean (DeepSeek)",
    protocolHeading: /### DeepSeek \/ Bean/i,
    outboxFilter: /^TO_BEAN_/i,
    fallbackNote: "Adversarial audit — engineering, compliance, exploit paths."
  },
  {
    id: "thufir",
    label: "Thufir (Computer / Perplexity)",
    protocolHeading: /### Perplexity \/ Computer/i,
    outboxFilter: /^TO_COMPUTER_/i,
    fallbackNote: "Research and current-world checks — vendors, docs, pricing, policy."
  }
];

function readRepoFile(relPath: string): string | null {
  try {
    return fs.readFileSync(path.join(ROOT, relPath), "utf8");
  } catch {
    return null;
  }
}

function git(args: string[]): string {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function excerpt(text: string, max = 220): string {
  const flat = text.replace(/\r\n/g, "\n").trim();
  const slice = flat.slice(0, max);
  return flat.length > max ? `${slice}…` : slice;
}

function listHandoffsInDir(
  absDir: string,
  relPrefix: string,
  filter: (name: string) => boolean,
  limit = 6
): HandoffEntry[] {
  if (!fs.existsSync(absDir)) return [];

  return fs
    .readdirSync(absDir)
    .filter((name) => name.endsWith(".md") && filter(name))
    .map((name) => {
      const abs = path.join(absDir, name);
      const stat = fs.statSync(abs);
      const raw = fs.readFileSync(abs, "utf8");
      return {
        name,
        relPath: `${relPrefix}/${name}`,
        modifiedAt: stat.mtime.toISOString(),
        excerpt: excerpt(raw)
      };
    })
    .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
    .slice(0, limit);
}

function listOutbox(filter: (name: string) => boolean, limit = 6): HandoffEntry[] {
  return listHandoffsInDir(
    path.join(ROOT, "foreman", "handoffs", "outbox"),
    "foreman/handoffs/outbox",
    filter,
    limit
  );
}

function listInbox(filter: (name: string) => boolean, limit = 6): HandoffEntry[] {
  return listHandoffsInDir(
    path.join(ROOT, "foreman", "handoffs", "inbox"),
    "foreman/handoffs/inbox",
    filter,
    limit
  );
}

function listAllOutbox(limit = 10): HandoffEntry[] {
  return listOutbox((name) => /^TO_[A-Z]/i.test(name) && !name.startsWith("OPEN_"), limit);
}

function listAllInbox(limit = 10): HandoffEntry[] {
  return listInbox((name) => !["README.md", "FROM_CURSOR_READ_ME.md"].includes(name), limit);
}

function listReceipts(limit = 10): HandoffEntry[] {
  const inbox = listInbox((name) => /^FROM_/i.test(name), limit);
  const processed = listHandoffsInDir(
    path.join(ROOT, "foreman", "handoffs", "inbox", "processed"),
    "foreman/handoffs/inbox/processed",
    (name) => /^FROM_/i.test(name) || name.includes("__FROM_"),
    limit
  );
  return [...inbox, ...processed]
    .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
    .slice(0, limit);
}

function parseWerklesMachine(topology: string | null): string {
  if (!topology) return "UNKNOWN";
  const host = os.hostname();
  if (topology.includes(`| **Betsy** | \`${host}\``)) return "Betsy";
  if (topology.includes(`| **Sally** | \`${host}\``)) return "Sally";
  if (host.toLowerCase().includes("betsy")) return "Betsy";
  return host;
}

function parseEffectiveGate(nextAction: string | null): string {
  if (!nextAction) return "UNKNOWN";
  const match = nextAction.match(/\*\*Effective gate:\*\*\s*`?\[([^\]]+)\]`?/i);
  return match?.[1]?.trim() ?? "UNKNOWN";
}

function parseMission(nextAction: string | null): { title: string; why: string; hardStops: string[] } {
  if (!nextAction) {
    return {
      title: "Review foreman/NEXT_ACTION.md",
      why: "Cockpit next-action file missing or unreadable.",
      hardStops: []
    };
  }

  const benBlock = nextAction.match(/## Ben \(Operator\)[\s\S]*?(?=## Maker|## Petra|## Conditions|$)/i);
  const primary =
    benBlock?.[0].match(/^\d+\.\s+\*\*(.+?)\*\*/m)?.[1] ??
    benBlock?.[0].match(/^\d+\.\s+(.+)$/m)?.[1] ??
    "Review Operator next hands in foreman/NEXT_ACTION.md";

  const why =
    benBlock?.[0].match(/Primary lane:[^\n]+/i)?.[0]?.replace(/^Primary lane:\s*/i, "") ??
    "Keeps localhost build lanes moving while production gates stay closed.";

  const hardStopsBlock = nextAction.match(/## Hard stops[\s\S]*?(?=##|$)/i)?.[0] ?? "";
  const hardStops = hardStopsBlock
    .replace(/## Hard stops/i, "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  return { title: primary, why, hardStops };
}

function parseMarkdownBullets(section: string | null | undefined): string[] {
  if (!section) return [];
  return section
    .split("\n")
    .map((line) => line.replace(/^-\s+/, "").trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function parseNumberedList(section: string | null | undefined): string[] {
  if (!section) return [];
  return section
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s+/, "").trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function parseHumanGateContext(humanGates: string | null, nextAction: string | null, effectiveGate: string) {
  const precedenceBlock = humanGates?.match(/## Conflict Precedence[\s\S]*?(?=##|$)/i)?.[0];
  const approveBlock = humanGates?.match(/## Ben Must Approve[\s\S]*?(?=##|$)/i)?.[0];
  const conditionsBlock = nextAction?.match(/## Conditions \(active\)[\s\S]*?(?=##|$)/i)?.[0];

  return {
    effectiveGate,
    labels: ["APPROVE", "REDIRECT", "DEFER"],
    note: "v1 read-only. Buttons label Operator intent — write-back wiring is a later gate.",
    conflictPrecedence: parseNumberedList(precedenceBlock),
    benMustApprove: parseMarkdownBullets(approveBlock),
    activeConditions: parseMarkdownBullets(conditionsBlock),
    doctrineRef: "foreman/HUMAN_GATES.md"
  };
}

function readLastSuccess(): LocalhostStatusRecord | null {
  try {
    const raw = JSON.parse(fs.readFileSync(STATUS_FILE, "utf8")) as { lastSuccess?: LocalhostStatusRecord };
    return raw.lastSuccess ?? null;
  } catch {
    return null;
  }
}

function writeLastSuccess(record: LocalhostStatusRecord) {
  try {
    fs.mkdirSync(STATUS_DIR, { recursive: true });
    fs.writeFileSync(
      STATUS_FILE,
      JSON.stringify({ lastSuccess: record, updatedAt: record.checkedAt }, null, 2),
      "utf8"
    );
  } catch {
    /* local status file is best-effort */
  }
}

async function probeLocalhost(): Promise<{ current: LocalhostStatusRecord; lastSuccess: LocalhostStatusRecord | null }> {
  const port = process.env.PORT?.trim() || "3000";
  const url = `http://127.0.0.1:${port}/`;
  const checkedAt = new Date().toISOString();
  const lastSuccess = readLastSuccess();

  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(1200),
      cache: "no-store"
    });
    const ok = res.ok || res.status < 500;
    const current: LocalhostStatusRecord = {
      ok,
      port,
      checkedAt,
      url: `http://localhost:${port}/`,
      httpStatus: res.status
    };
    if (ok) writeLastSuccess(current);
    return { current, lastSuccess: ok ? current : lastSuccess };
  } catch {
    return {
      current: { ok: false, port, checkedAt, url: `http://localhost:${port}/`, httpStatus: 0 },
      lastSuccess
    };
  }
}

function buildCrewBlocks(cousins: string | null, nextAction: string | null): CrewBlock[] {
  return CREW_DEFINITIONS.map((def) => {
    const protocolSection = cousins?.match(
      new RegExp(`${def.protocolHeading.source}[\\s\\S]*?(?=###|$)`, "i")
    )?.[0];
    const nextSection =
      def.id === "maker"
        ? nextAction?.match(/## Maker \(Cursor\)[\s\S]*?(?=##|$)/i)?.[0]
        : def.id === "dink"
          ? cousins?.match(/LOCAL HANDS READBACK[\s\S]*?(?=##|$)/i)?.[0]
          : null;

    return {
      id: def.id,
      label: def.label,
      note: excerpt(nextSection ?? protocolSection ?? def.fallbackNote, 200),
      outbox: listOutbox((name) => def.outboxFilter.test(name), 3)
    };
  });
}

export async function loadSoleDashData(): Promise<SoleDashData> {
  const nextAction = readRepoFile("foreman/NEXT_ACTION.md");
  const humanGates = readRepoFile("foreman/HUMAN_GATES.md");
  const topology = readRepoFile("foreman/MACHINE_TOPOLOGY.md");
  const cousins = readRepoFile("foreman/AI_COUSINS_PROTOCOL.md");

  const branch = git(["branch", "--show-current"]) || "UNKNOWN";
  const commit = git(["rev-parse", "HEAD"]) || "UNKNOWN";
  const commitSubject = git(["log", "-1", "--format=%s"]) || "UNKNOWN";
  const porcelain = git(["status", "--porcelain"]);
  const workingTree = porcelain
    ? `dirty (${porcelain.split("\n").filter(Boolean).length} entries)`
    : "clean";

  const localhost = await probeLocalhost();
  const host = os.hostname();
  const werklesName = parseWerklesMachine(topology);
  const missionParsed = parseMission(nextAction);
  const effectiveGate = parseEffectiveGate(nextAction);

  return {
    readback: {
      machine: host,
      werklesName,
      repo: ROOT,
      branch,
      commit,
      commitSubject,
      workingTree,
      executionContext: "LOCAL_SALLY_WINDOWS"
    },
    mission: {
      effectiveGate,
      title: missionParsed.title,
      why: missionParsed.why,
      hardStops: missionParsed.hardStops
    },
    humanGate: parseHumanGateContext(humanGates, nextAction, effectiveGate),
    localhost,
    crew: buildCrewBlocks(cousins, nextAction),
    outbox: listAllOutbox(12),
    inbox: listAllInbox(10),
    receipts: listReceipts(12),
    plumbing: {
      foreman: "http://127.0.0.1:4317",
      gimpdash: "http://127.0.0.1:4317/#gimpdash",
      speaker: "http://127.0.0.1:4317/#gd-speaker"
    },
    sources: [
      { path: "foreman/NEXT_ACTION.md", loaded: Boolean(nextAction) },
      { path: "foreman/HUMAN_GATES.md", loaded: Boolean(humanGates) },
      { path: "foreman/MACHINE_TOPOLOGY.md", loaded: Boolean(topology) },
      { path: "foreman/handoffs/inbox/", loaded: fs.existsSync(path.join(ROOT, "foreman/handoffs/inbox")) },
      { path: "foreman/handoffs/outbox/", loaded: fs.existsSync(path.join(ROOT, "foreman/handoffs/outbox")) },
      { path: "foreman/AI_COUSINS_PROTOCOL.md", loaded: Boolean(cousins) },
      { path: "foreman/EXECUTION_CONTEXT_RULES.md", loaded: Boolean(readRepoFile("foreman/EXECUTION_CONTEXT_RULES.md")) }
    ]
  };
}

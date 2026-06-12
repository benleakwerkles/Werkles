import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import "server-only";

const ROOT = process.cwd();

export type HandoffEntry = {
  name: string;
  relPath: string;
  modifiedAt: string;
  excerpt: string;
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
    terminal: string;
    localhost: string;
    port: string;
    executionContext: string;
  };
  mission: {
    effectiveGate: string;
    title: string;
    why: string;
    hardStops: string[];
  };
  humanGate: {
    summary: string;
    labels: ["APPROVE", "REDIRECT", "DEFER"];
    note: string;
  };
  crew: {
    maker: { label: string; items: HandoffEntry[]; note: string };
    dink: { label: string; items: HandoffEntry[]; note: string };
    ender: { label: string; items: HandoffEntry[]; note: string };
    petra: { label: string; items: HandoffEntry[]; note: string };
  };
  receipts: HandoffEntry[];
  sources: { path: string; loaded: boolean }[];
};

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

function excerpt(text: string, max = 280): string {
  const flat = text.replace(/\r\n/g, "\n").trim();
  const slice = flat.slice(0, max);
  return flat.length > max ? `${slice}…` : slice;
}

function listHandoffs(
  subdir: "inbox" | "outbox",
  filter: (name: string) => boolean,
  limit = 4
): HandoffEntry[] {
  const dir = path.join(ROOT, "foreman", "handoffs", subdir);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md") && filter(name))
    .map((name) => {
      const abs = path.join(dir, name);
      const stat = fs.statSync(abs);
      const raw = fs.readFileSync(abs, "utf8");
      return {
        name,
        relPath: `foreman/handoffs/${subdir}/${name}`,
        modifiedAt: stat.mtime.toISOString(),
        excerpt: excerpt(raw)
      };
    })
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
    benBlock?.[0].match(/Primary lane:[^\n]+/i)?.[0] ??
    nextAction.match(/\| Homepage rewrite v1 \|[^\n]+/i)?.[0] ??
    "Keeps localhost build lanes moving while production gates stay closed.";

  const hardStopsBlock = nextAction.match(/## Hard stops[\s\S]*?(?=##|$)/i)?.[0] ?? "";
  const hardStops = hardStopsBlock
    .replace(/## Hard stops/i, "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  return { title: primary, why, hardStops };
}

async function probeLocalhost(): Promise<{ running: boolean; port: string }> {
  for (const port of ["3000", "3001"]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/soledash`, {
        signal: AbortSignal.timeout(1200),
        cache: "no-store"
      });
      if (res.ok || res.status < 500) return { running: true, port };
    } catch {
      /* try next port */
    }
  }
  return { running: false, port: "none" };
}

export async function loadSoleDashData(): Promise<SoleDashData> {
  const nextAction = readRepoFile("foreman/NEXT_ACTION.md");
  const humanGates = readRepoFile("foreman/HUMAN_GATES.md");
  const topology = readRepoFile("foreman/MACHINE_TOPOLOGY.md");
  const cousins = readRepoFile("foreman/AI_COUSINS_PROTOCOL.md");
  const executionRules = readRepoFile("foreman/EXECUTION_CONTEXT_RULES.md");

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

  const makerNote =
    nextAction?.match(/## Maker \(Cursor\)[\s\S]*?(?=##|$)/i)?.[0]?.trim().slice(0, 400) ??
    "Maker (Cursor) — bounded app/UI on local build machine.";

  const dinkNote =
    executionRules?.match(/Any \*\*hands-capable\*\* agent[\s\S]*?before taking any action/m)?.[0]?.slice(0, 320) ??
    "Dink — local hands operator; LOCAL HANDS READBACK required at session start.";

  return {
    readback: {
      machine: host,
      werklesName,
      repo: ROOT,
      branch,
      commit,
      commitSubject,
      workingTree,
      terminal: "available (Next.js server)",
      localhost: localhost.running ? "running" : "not running",
      port: localhost.port,
      executionContext: "LOCAL_SALLY_WINDOWS"
    },
    mission: {
      effectiveGate,
      title: missionParsed.title,
      why: missionParsed.why,
      hardStops: missionParsed.hardStops
    },
    humanGate: {
      summary: excerpt(humanGates ?? "foreman/HUMAN_GATES.md unavailable.", 520),
      labels: ["APPROVE", "REDIRECT", "DEFER"],
      note: `v0 read-only. Current gate: ${effectiveGate}. Buttons label intent — wire to cockpit later.`
    },
    crew: {
      maker: {
        label: "Maker (Cursor)",
        items: listHandoffs("outbox", (n) => /TO_CURSOR|TO_MAKER|TO_CODEX|OPEN_THIS/i.test(n)),
        note: excerpt(makerNote, 360)
      },
      dink: {
        label: "Dink (local hands)",
        items: listHandoffs("outbox", (n) => /TO_DINK|DINK/i.test(n)),
        note: excerpt(dinkNote, 360)
      },
      ender: {
        label: "Ender (Claude)",
        items: listHandoffs("outbox", (n) => /^TO_ENDER_/i.test(n)),
        note: excerpt(cousins?.match(/### Claude \/ Ender[\s\S]*?(?=###|$)/i)?.[0] ?? "", 280)
      },
      petra: {
        label: "Petra (Comptroller)",
        items: listHandoffs("outbox", (n) => /^TO_PETRA_/i.test(n)),
        note: excerpt(cousins?.match(/### ChatGPT \/ Comptroller[\s\S]*?(?=###|$)/i)?.[0] ?? "", 280)
      }
    },
    receipts: listHandoffs("inbox", (n) => /^FROM_/i.test(n), 8),
    sources: [
      { path: "foreman/NEXT_ACTION.md", loaded: Boolean(nextAction) },
      { path: "foreman/HUMAN_GATES.md", loaded: Boolean(humanGates) },
      { path: "foreman/MACHINE_TOPOLOGY.md", loaded: Boolean(topology) },
      { path: "foreman/handoffs/inbox/", loaded: fs.existsSync(path.join(ROOT, "foreman/handoffs/inbox")) },
      { path: "foreman/handoffs/outbox/", loaded: fs.existsSync(path.join(ROOT, "foreman/handoffs/outbox")) },
      { path: "foreman/AI_COUSINS_PROTOCOL.md", loaded: Boolean(cousins) },
      { path: "foreman/EXECUTION_CONTEXT_RULES.md", loaded: Boolean(executionRules) }
    ]
  };
}

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { MachineCapsule } from "./types";

const ROOT = process.cwd();

function git(args: string[]): string {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function readTopology(): string | null {
  try {
    return fs.readFileSync(path.join(ROOT, "foreman/MACHINE_TOPOLOGY.md"), "utf8");
  } catch {
    return null;
  }
}

function parseWerklesName(topology: string | null): string {
  const host = os.hostname();
  if (!topology) return host;
  if (topology.includes(`| **Betsy** | \`${host}\``)) return "Betsy";
  if (topology.includes(`| **Sally** | \`${host}\``)) return "Sally";
  if (host.toLowerCase().includes("betsy")) return "Betsy";
  return host;
}

function unpushedCount(): number {
  const count = git(["rev-list", "--count", "@{u}..HEAD"]);
  const n = Number.parseInt(count, 10);
  return Number.isFinite(n) ? n : 0;
}

async function probeLocalhost(port: string): Promise<{ ok: boolean; url: string }> {
  const url = `http://127.0.0.1:${port}/`;
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(1200), cache: "no-store" });
    return { ok: res.ok || res.status < 500, url: `http://localhost:${port}/` };
  } catch {
    return { ok: false, url: `http://localhost:${port}/` };
  }
}

export function formatHandoffBlock(capsule: Omit<MachineCapsule, "handoffBlock">): string {
  const { machine, git: g, runtime } = capsule;
  return `## Machine State Capsule (SoleDash v0)

- **Machine:** ${machine.werklesName} (\`${machine.hostname}\`)
- **Repo:** \`${machine.repo}\`
- **Execution context:** ${machine.executionContext}
- **Branch:** \`${g.branch}\`
- **Commit:** \`${g.commit.slice(0, 12)}\` — ${g.commitSubject}
- **Working tree:** ${g.workingTree}${g.unpushedCommits > 0 ? ` · ${g.unpushedCommits} unpushed` : ""}
- **Runtime:** Node ${runtime.nodeVersion} · ${runtime.localhostOk ? "localhost up" : "localhost down"} · ${runtime.localhostUrl}
- **Generated:** ${capsule.generatedAt}

Paste this block at the top of cousin packets so cloud agents do not guess local state.
`;
}

export async function buildMachineCapsule(): Promise<MachineCapsule> {
  const topology = readTopology();
  const hostname = os.hostname();
  const werklesName = parseWerklesName(topology);
  const branch = git(["branch", "--show-current"]) || "UNKNOWN";
  const commit = git(["rev-parse", "HEAD"]) || "UNKNOWN";
  const commitSubject = git(["log", "-1", "--format=%s"]) || "UNKNOWN";
  const porcelain = git(["status", "--porcelain"]);
  const dirtyCount = porcelain.split("\n").filter(Boolean).length;
  const workingTreeDirty = dirtyCount > 0;
  const workingTree = workingTreeDirty ? `dirty (${dirtyCount} entries)` : "clean";
  const port = process.env.PORT?.trim() || "3000";
  const localhost = await probeLocalhost(port);
  const executionContext =
    process.env.EXECUTION_CONTEXT?.trim() ||
    (process.env.CURSOR_CLOUD === "1" ? "CURSOR_CLOUD_CONTAINER" : "LOCAL_SALLY_WINDOWS");

  const generatedAt = new Date().toISOString();
  const base = {
    version: "v0" as const,
    capsuleType: "machine_state" as const,
    generatedAt,
    machine: {
      werklesName,
      hostname,
      repo: ROOT,
      executionContext
    },
    git: {
      branch,
      commit,
      commitSubject,
      workingTree,
      workingTreeDirty,
      unpushedCommits: unpushedCount()
    },
    runtime: {
      nodeVersion: process.version,
      port,
      localhostOk: localhost.ok,
      localhostUrl: localhost.url
    }
  };

  return {
    ...base,
    handoffBlock: formatHandoffBlock(base)
  };
}

export function saveCapsuleSnapshot(capsule: MachineCapsule): string {
  const dir = path.join(ROOT, "foreman", "soledash", "capsules");
  fs.mkdirSync(dir, { recursive: true });
  const filename = `capsule_${capsule.generatedAt.replace(/[:.]/g, "-").slice(0, 19)}.json`;
  const abs = path.join(dir, filename);
  fs.writeFileSync(abs, JSON.stringify(capsule, null, 2), "utf8");
  return `foreman/soledash/capsules/${filename}`;
}

import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { NextStepOverride, NextStepOwner } from "./types";

const ROOT = process.cwd();
const OVERRIDE_FILE = path.join(ROOT, "foreman", "soledash", "NEXT_STEP_OVERRIDE.json");

const OWNERS = new Set<NextStepOwner>(["MAKER", "DINK", "PETRA", "ENDER", "BEAN", "BEN"]);

export function readNextStepOverride(): NextStepOverride | null {
  try {
    const raw = JSON.parse(fs.readFileSync(OVERRIDE_FILE, "utf8")) as NextStepOverride;
    if (!raw.owner || !raw.machine) return null;
    return raw;
  } catch {
    return null;
  }
}

export function writeNextStepOverride(input: {
  owner: string;
  machine: string;
  note?: string | null;
}): NextStepOverride {
  const owner = input.owner.trim().toUpperCase() as NextStepOwner;
  if (!OWNERS.has(owner)) {
    throw new Error(`Unknown owner: ${input.owner}`);
  }
  const machine = input.machine.trim();
  if (!machine) {
    throw new Error("machine required");
  }

  fs.mkdirSync(path.dirname(OVERRIDE_FILE), { recursive: true });
  const entry: NextStepOverride = {
    owner,
    machine,
    note: input.note?.trim() || null,
    updated_at: new Date().toISOString(),
    updated_by: "operator"
  };
  fs.writeFileSync(OVERRIDE_FILE, `${JSON.stringify(entry, null, 2)}\n`, "utf8");
  return entry;
}

export function nextStepOwnerLabel(override: NextStepOverride): string {
  return `${override.owner} @ ${override.machine}`;
}

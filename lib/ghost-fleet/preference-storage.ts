import "server-only";

import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { parseGhostSeekerLocation, type GhostSeekerLocation } from "@/lib/ghost-fleet/proximity";
import { isValidBellowsOwnerId } from "@/lib/squibb/bellows-owner-session";

const PREFERENCE_PATH = "data/ghost-fleet/member-location-preferences.jsonl";

type StoredPreference = Readonly<{
  ownerId: string;
  updatedAt: string;
  location: GhostSeekerLocation;
}>;

export async function readGhostLocationPreference(ownerId: string): Promise<GhostSeekerLocation | null> {
  if (!isValidBellowsOwnerId(ownerId)) return null;
  try {
    const rows = (await readFile(path.join(process.cwd(), PREFERENCE_PATH), "utf8"))
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => {
        try { return [JSON.parse(line) as StoredPreference]; } catch { return []; }
      });
    const row = rows.filter((item) => item.ownerId === ownerId).at(-1);
    return row ? parseGhostSeekerLocation(row.location) : null;
  } catch {
    return null;
  }
}

export async function storeGhostLocationPreference(
  ownerId: string,
  value: unknown
): Promise<GhostSeekerLocation> {
  if (!isValidBellowsOwnerId(ownerId)) throw new Error("Walkthrough owner is invalid.");
  const location = parseGhostSeekerLocation(value);
  if (!location) throw new Error("Enter a city and two-letter state.");
  await mkdir(path.dirname(path.join(process.cwd(), PREFERENCE_PATH)), { recursive: true });
  await appendFile(path.join(process.cwd(), PREFERENCE_PATH), `${JSON.stringify({
    ownerId,
    updatedAt: new Date().toISOString(),
    location
  })}\n`, "utf8");
  return location;
}


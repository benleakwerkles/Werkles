import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  discoveryAssetValues,
  discoveryLaneValues,
  discoveryResponseSpeedValues,
  type DiscoveryAsset,
  type DiscoveryIntakeInput,
  type DiscoveryIntakeRecord
} from "@/lib/discovery/schema";
import { persistDiscoveryIntakeCustody } from "@/lib/discovery/intake-custody";

function text(value: unknown, max = 800): string {
  return String(value ?? "").trim().slice(0, max);
}

function oneOf<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  const candidate = text(value);
  return (allowed as readonly string[]).includes(candidate) ? (candidate as T[number]) : fallback;
}

function assetList(value: unknown): DiscoveryAsset[] {
  const raw = Array.isArray(value) ? value : [];
  const allowed = new Set<string>(discoveryAssetValues);
  return raw.map((item) => text(item)).filter((item): item is DiscoveryAsset => allowed.has(item));
}

export function normalizeDiscoveryIntake(body: unknown): DiscoveryIntakeInput {
  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  return {
    name: text(record.name, 120),
    contact: text(record.contact, 160),
    situation: text(record.situation, 800),
    goal: text(record.goal, 600),
    why_now: text(record.why_now, 600),
    assets: assetList(record.assets),
    stated_blocker: text(record.stated_blocker, 600),
    tried: text(record.tried, 600),
    constraints: text(record.constraints, 600),
    one_thing: text(record.one_thing, 160),
    lane: oneOf(record.lane, discoveryLaneValues, "Unsure"),
    response_speed: oneOf(record.response_speed, discoveryResponseSpeedValues, "Few days"),
    notes: text(record.notes, 800)
  };
}

export function validateDiscoveryIntake(input: DiscoveryIntakeInput): string[] {
  const missing: string[] = [];
  if (!input.name) missing.push("name");
  if (!input.contact) missing.push("contact");
  if (!input.situation) missing.push("situation");
  if (!input.goal) missing.push("goal");
  if (!input.stated_blocker) missing.push("stated_blocker");
  if (!input.one_thing) missing.push("one_thing");
  if (input.assets.length === 0) missing.push("assets");
  return missing;
}

export async function writeDiscoveryIntake(input: DiscoveryIntakeInput): Promise<DiscoveryIntakeRecord> {
  const now = new Date();
  const shortId = randomUUID().slice(0, 8);
  const dateSlug = now.toISOString().slice(0, 10).replace(/-/g, "");
  const userId = `WZ-${dateSlug}-${shortId}`;
  const recordRelativePath = path.join("data", "discovery", "records", `${userId}.md`).replaceAll("\\", "/");
  const record: DiscoveryIntakeRecord = {
    schema: "werkles_discovery_intake_v1",
    user_id: userId,
    intake_date: now.toISOString(),
    state: "Received",
    record_path: recordRelativePath,
    ...input
  };

  await persistDiscoveryIntakeCustody(record);
  return record;
}

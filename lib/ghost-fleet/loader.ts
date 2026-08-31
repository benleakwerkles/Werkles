import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  GhostFleetFile,
  GhostMatchResult,
  GhostMember,
  GhostWorkshopSnapshot
} from "@/lib/ghost-fleet/types";
import { GHOST_FLEET_DISCLOSURE, isGhostFleetEnabled } from "@/lib/ghost-fleet/enabled";
import { rankGhostsForSignals } from "@/lib/ghost-fleet/match";
import { readLatestSpeakerIntakeForOwner } from "@/lib/squibb/concierge-intake-storage";
import { signalsFromConcierge } from "@/lib/matching/signals";
import { readGhostLocationPreference } from "@/lib/ghost-fleet/preference-storage";
import type { GhostSeekerLocation } from "@/lib/ghost-fleet/proximity";
import {
  CONCIERGE_INTAKE_QUESTIONS,
  EMPTY_INTAKE_ANSWERS,
  type ConciergeIntakeAnswers
} from "@/lib/squibb/concierge-intake-v0";

const FLEET_PATH = "data/ghost-fleet/members.json";

let cache: GhostFleetFile | null = null;

export async function loadGhostFleetFile(): Promise<GhostFleetFile | null> {
  if (!isGhostFleetEnabled()) return null;
  if (cache) return cache;

  try {
    const raw = await readFile(path.join(process.cwd(), FLEET_PATH), "utf8");
    const parsed = JSON.parse(raw) as GhostFleetFile;
    if (!parsed?.synthetic || !Array.isArray(parsed.members)) return null;
    cache = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export async function listGhostMembers(): Promise<GhostMember[]> {
  const fleet = await loadGhostFleetFile();
  return fleet?.members ?? [];
}

export async function getGhostMember(id: string): Promise<GhostMember | null> {
  const members = await listGhostMembers();
  return members.find((m) => m.id === id) ?? null;
}

export async function ghostFleetMeta() {
  const fleet = await loadGhostFleetFile();
  if (!fleet) return null;
  return {
    enabled: true,
    synthetic: true as const,
    label: fleet.label,
    disclosure: fleet.disclosure || GHOST_FLEET_DISCLOSURE,
    count: fleet.members.length,
    targetCount: fleet.targetCount,
    facesReady: fleet.members.filter((m) => m.faceStatus === "ready").length
  };
}

export async function workshopSnapshotsForFleet(limit = 12): Promise<GhostWorkshopSnapshot[]> {
  const members = await listGhostMembers();
  return members.slice(0, limit).map((m) => ({
    ghostId: m.id,
    displayName: m.displayName,
    headline: m.workshopHeadline,
    rows: m.workshopRows,
    lane: m.lane,
    synthetic: true as const
  }));
}

function answersFromPacketSymptoms(
  symptoms: { id: string; answer: string }[]
): ConciergeIntakeAnswers {
  const byId = new Map(symptoms.map((s) => [s.id, s.answer]));
  return CONCIERGE_INTAKE_QUESTIONS.reduce<ConciergeIntakeAnswers>(
    (next, question) => ({ ...next, [question.id]: byId.get(question.id) ?? "" }),
    { ...EMPTY_INTAKE_ANSWERS }
  );
}

/**
 * Rank the fleet against one owner's own latest intake. Returns null when the
 * owner has not submitted yet — callers must not invent a queue in that case.
 */
export async function matchGhostsForOwner(
  ownerId: string,
  limit = 12,
  seekerLocation?: GhostSeekerLocation | null
): Promise<GhostMatchResult | null> {
  if (!ownerId) return null;
  const latest = await readLatestSpeakerIntakeForOwner(ownerId);
  if (!latest) return null;

  const answers = answersFromPacketSymptoms(latest.packet.symptoms);
  const signals = signalsFromConcierge(latest.stored.intakeId, answers);
  const location = seekerLocation === undefined ? await readGhostLocationPreference(ownerId) : seekerLocation;
  return rankGhostsForSignals(signals, await listGhostMembers(), limit, location);
}

export function intakeAnswersFromGhost(member: GhostMember) {
  return {
    heaviest_lift: member.statedNeed,
    business_stage: "Synthetic profile",
    already_tried: member.alreadyTried,
    time_cost: member.timeCost,
    stuck_decision: member.stuckDecision,
    success_twelve_months: member.successTwelveMonths,
    resources_on_hand: [...member.skills, ...member.offers].join(", "),
    what_you_offer: member.offers.join(", "),
    constraints: ""
  };
}

import type { StructuredSignals } from "@/lib/matching/types";
import { starterProfileForSignals } from "@/lib/matching/starter-profile";

import type {
  GhostMatchCandidate,
  GhostMatchReason,
  GhostMatchResult,
  GhostMember
} from "@/lib/ghost-fleet/types";
import { ghostProximityFor, type GhostSeekerLocation } from "@/lib/ghost-fleet/proximity";

const FIT_TIER_SIZE = 10;

/** Versioned, deliberately narrow input to person-ranking. Rich member records,
 * capital eligibility, provider evidence, and operational metadata never cross
 * this boundary. */
export const GHOST_RANKING_INPUT_VERSION = "ghost-ranking-input/v1" as const;

export type GhostRankingProfile = Readonly<{
  id: string;
  displayName: string;
  city: string;
  region: string;
  lane: GhostMember["lane"];
  roleLabel: string;
  skills: readonly string[];
  offers: readonly string[];
  seeks: readonly string[];
  openToPartner: boolean;
  statedNeed: string;
  stuckDecision: string;
  proofGaps: readonly string[];
  introEligibility: GhostMember["introEligibility"];
}>;

function toGhostRankingProfile(member: GhostMember): GhostRankingProfile {
  return Object.freeze({
    id: member.id,
    displayName: member.displayName,
    city: member.city,
    region: member.region,
    lane: member.lane,
    roleLabel: member.roleLabel,
    skills: Object.freeze([...member.skills]),
    offers: Object.freeze([...member.offers]),
    seeks: Object.freeze([...member.seeks]),
    openToPartner: member.openToPartner,
    statedNeed: member.statedNeed,
    stuckDecision: member.stuckDecision,
    proofGaps: Object.freeze([...member.proofGaps]),
    introEligibility: member.introEligibility
  });
}

/**
 * Person-to-person ranking of synthetic members against one seeker's intake
 * signals. Deterministic and rules-only — no LLM, no probability claim.
 * A high score means "worth a guarded look", never "verified" or "eligible".
 */

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "have", "has", "was", "were",
  "are", "but", "not", "can", "cannot", "get", "got", "out", "our", "you",
  "your", "they", "them", "from", "into", "some", "just", "still", "need",
  "needs", "want", "wants", "one", "two", "three", "who", "what", "when",
  "how", "why", "would", "could", "should", "about", "than", "then", "over",
  /* Pronouns and filler read as fake evidence when quoted back as a reason. */
  "someone", "somebody", "something", "anyone", "everyone", "myself",
  "really", "other", "others", "another", "where", "which", "while",
  "there", "their", "these", "those", "been", "does", "done", "much",
  "more", "most", "into", "keep", "going", "thing", "things", "same",
  "already", "instead", "because", "every", "half", "back", "take",
  "make", "made", "give", "will", "with",
  /* Quoted back as a shared "signal" these read as invented evidence. */
  "write", "wrote", "real", "trust", "night", "myself", "years", "year",
  "month", "months", "week", "weeks", "days", "time", "times", "away",
  "partner", "partners", "company", "companies", "business", "businesses",
  "whatever", "idea", "ideas", "building", "build", "work", "working"
]);

function meaningfulTokens(...parts: string[]): Set<string> {
  const blob = parts.join(" ").toLowerCase();
  const tokens = blob
    .split(/[^a-z0-9]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 3 && !STOP_WORDS.has(t));
  return new Set(tokens);
}

function overlap(a: Set<string>, b: Set<string>): string[] {
  const shared: string[] = [];
  for (const token of a) {
    if (b.has(token)) shared.push(token);
  }
  return shared;
}

function scoreGhost(signals: StructuredSignals, ghost: GhostRankingProfile): {
  score: number;
  reasons: GhostMatchReason[];
  blockers: string[];
} {
  const starterProfile = starterProfileForSignals(signals);
  const reasons: GhostMatchReason[] = [];
  const blockers: string[] = [];

  /* 1. Partner complementarity — coverage the seeker is missing. Financial
     eligibility is deliberately absent from scoring; it belongs to the
     purpose-specific filter in backer-equality.ts. */
  if (signals.partnerSeeking && ghost.openToPartner) {
    reasons.push({
      label: "Open to partnership",
      detail: `${ghost.displayName} has partnership language in their own intake and is currently open.`,
      points: 18
    });
  }

  /* 2. Offer-to-blocker match — what they carry vs what is stopping you. */
  const blockerTokens = meaningfulTokens(...starterProfile.seeks);
  const offerTokens = meaningfulTokens(...ghost.offers, ...ghost.skills);
  const offerHits = overlap(blockerTokens, offerTokens);
  /* One shared common noun ("shop", "work") is not evidence. Quoted back at the
     member it reads as invented proof, so a reason needs at least two hits. */
  if (offerHits.length >= 2) {
    reasons.push({
      label: "Carries what is blocking you",
      detail: `Their stated coverage touches your blocker language: ${offerHits.slice(0, 4).join(", ")}.`,
      points: Math.min(24, offerHits.length * 8)
    });
  }

  /* 3. Reciprocity — you may answer their need too. */
  const offerFromSeeker = meaningfulTokens(...starterProfile.offers);
  const seekTokens = meaningfulTokens(...ghost.seeks);
  const reciprocalHits = overlap(offerFromSeeker, seekTokens);
  if (reciprocalHits.length >= 2) {
    reasons.push({
      label: "Two-way, not extractive",
      detail: `What you said you can offer overlaps what they are missing: ${reciprocalHits.slice(0, 4).join(", ")}.`,
      points: Math.min(16, reciprocalHits.length * 6)
    });
  }

  /* 4. Situation overlap — same shape of problem, different seat. */
  const needTokens = meaningfulTokens(ghost.statedNeed, ghost.stuckDecision);
  const situationHits = overlap(
    meaningfulTokens(signals.statedNeed, signals.intakeTextBlob),
    needTokens
  );
  if (situationHits.length >= 3) {
    reasons.push({
      label: "Has stood where you are",
      detail: `Shared situation language: ${situationHits.slice(0, 4).join(", ")}.`,
      points: Math.min(14, situationHits.length * 4)
    });
  }

  /* 5. Training need vs teachable skill. */
  if (signals.trainingSeeking && ghost.offers.some((o) => /train|licen|certif|teach|apprentic/i.test(o))) {
    reasons.push({
      label: "Can close a credential gap",
      detail: "They list training or licensing coverage against your skill-gap language.",
      points: 12
    });
  }

  /* Blockers never reduce score to zero silently — they surface as text. */
  if (ghost.proofGaps.length > 0) {
    blockers.push(`Unverified: ${ghost.proofGaps.join("; ")}.`);
  }
  blockers.push("Werkles cannot send, apply, introduce, or commit anything for you.");

  const raw = reasons.reduce((sum, r) => sum + r.points, 0);
  /* Unverified members are capped — proof is not implied by ranking. */
  const capped = Math.max(0, Math.min(92, raw));

  return { score: capped, reasons, blockers };
}

/** Keep the strongest result first, then prefer genuinely different kinds of
 * help when they remain reasonably close to the strongest score. Never pad a
 * shortlist with another copy of the same contribution archetype. */
function variedShortlist<T extends { ghost: GhostRankingProfile; score: number; rankingScore: number; member: GhostMember }>(
  rows: readonly T[],
  limit: number
): T[] {
  if (limit <= 0 || rows.length === 0) return [];

  const selected: T[] = [rows[0]];
  const usedIds = new Set([rows[0].ghost.id]);
  const contributionSignature = (ghost: GhostRankingProfile) => [
    ghost.lane,
    ghost.roleLabel,
    ...ghost.offers.slice(0, 2),
    ...ghost.seeks.slice(0, 2)
  ].map((value) => value.replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase()).join("|");
  const usedSignatures = new Set([contributionSignature(rows[0].ghost)]);
  const reasonableFloor = Math.max(1, Math.ceil(rows[0].score * 0.4));
  const closeRows = rows.filter((row) => row.score >= reasonableFloor);

  const takeFirst = (pool: readonly T[], predicate: (row: T) => boolean) => {
    const next = pool.find((row) => !usedIds.has(row.ghost.id) && predicate(row));
    if (!next) return false;
    selected.push(next);
    usedIds.add(next.ghost.id);
    usedSignatures.add(contributionSignature(next.ghost));
    return true;
  };

  while (selected.length < Math.min(limit, rows.length)) {
    const lanes = new Set(selected.map((row) => row.ghost.lane));
    const roles = new Set(selected.map((row) => row.ghost.roleLabel.toLowerCase()));
    if (takeFirst(closeRows, (row) => !lanes.has(row.ghost.lane) && !roles.has(row.ghost.roleLabel.toLowerCase()) && !usedSignatures.has(contributionSignature(row.ghost)))) continue;
    if (takeFirst(closeRows, (row) => !roles.has(row.ghost.roleLabel.toLowerCase()))) continue;
    if (takeFirst(closeRows, (row) => !usedSignatures.has(contributionSignature(row.ghost)))) continue;
    if (takeFirst(closeRows, (row) => !lanes.has(row.ghost.lane))) continue;
    if (takeFirst(rows, (row) => !roles.has(row.ghost.roleLabel.toLowerCase()))) continue;
    if (takeFirst(rows, (row) => !usedSignatures.has(contributionSignature(row.ghost)))) continue;
    break;
  }

  return selected;
}

export function rankGhostsForSignals(
  signals: StructuredSignals,
  ghosts: GhostMember[],
  limit = 12,
  seekerLocation?: GhostSeekerLocation | null
): GhostMatchResult {
  const eligible = ghosts.filter((g) => g.introEligibility !== "blocked");
  const excludedBlocked = ghosts.length - eligible.length;

  const scored = eligible
    .map((ghost) => {
      const rankingProfile = toGhostRankingProfile(ghost);
      const { score, reasons, blockers } = scoreGhost(signals, rankingProfile);
      const proximity = ghostProximityFor(seekerLocation, { city: rankingProfile.city, state: rankingProfile.region });
      return { ghost: rankingProfile, member: ghost, score, rankingScore: score + proximity.rankingAdjustment, reasons, blockers, proximity };
    })
    /* No reasons means no honest introduction — drop rather than pad the list. */
    .filter((row) => row.score > 0 && row.reasons.some((r) => r.points > 0))
    /* Fit remains primary. Geography may reorder genuinely close fits inside
       the same ten-point fit tier, but cannot lift a weak nearby profile over
       a materially stronger distant one. */
    .sort((a, b) =>
      Math.floor(b.score / FIT_TIER_SIZE) - Math.floor(a.score / FIT_TIER_SIZE) ||
      b.rankingScore - a.rankingScore ||
      b.score - a.score ||
      a.ghost.id.localeCompare(b.ghost.id)
    );

  const candidates: GhostMatchCandidate[] = variedShortlist(scored, limit).map((row, index) => {
    const scoreOrder = scored.findIndex((candidate) => candidate.member.id === row.member.id) + 1;
    const orderReason = index === 0
      ? "Strongest current fit from the information you submitted."
      : scoreOrder !== index + 1
        ? "Shown ahead of a near fit to add a meaningfully different kind of help."
        : "Next strongest current fit after the profiles above.";
    return {
      ghostId: row.member.id,
      displayName: row.member.displayName,
      lane: row.member.lane,
      city: row.member.city,
      region: row.member.region,
      score: row.score,
      rank: index + 1,
      orderReason,
      reasons: row.reasons.filter((r) => r.points > 0),
      blockers: row.blockers,
      eligibility: row.member.introEligibility === "review_required" ? "review_required" : "open",
      faceAsset: row.member.faceAsset,
      faceStatus: row.member.faceStatus,
      synthetic: true,
      proximity: Object.freeze({ band: row.proximity.band, label: row.proximity.label })
    };
  });

  return {
    intakeId: signals.intakeId,
    statedNeed: signals.statedNeed,
    scored: scored.length,
    excludedBlocked,
    candidates
  };
}

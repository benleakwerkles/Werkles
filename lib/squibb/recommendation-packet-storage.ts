import "server-only";

import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { SquibbRecommendation, SquibbRecommendationSessionSource } from "@/lib/squibb/recommendations";
import type { BellowsLedgerOptionRow } from "@/lib/squibb/bellows-ledger";

export type SquibbRecommendationPacketAction = "pursue_path" | "keep_original_path" | "request_more_proof";

export type StoredSquibbRecommendationPacket = {
  packetId: string;
  state: "StagedForOperator";
  action: SquibbRecommendationPacketAction;
  createdAt: string;
  recommendationId: string;
  packetPath: string;
  speakerEntryPath: string;
  indexPath: string;
  sourceMode?: string | null;
  sourceIntakeId?: string | null;
  sourcePacketPath?: string | null;
  sourceSpeakerEntryPath?: string | null;
  meaning: string;
};

export type StoredSquibbRecommendationPacketIndexRow = BellowsLedgerOptionRow;

const INDEX_PATH = "data/squibb/recommendation-packets.jsonl";
const PACKET_DIR = "data/squibb/recommendation-packets";
const SPEAKER_ENTRY_DIR = "foreman/speaker/entries";

const ACTION_LABELS: Record<SquibbRecommendationPacketAction, string> = {
  pursue_path: "Pursue this path",
  keep_original_path: "Keep original path",
  request_more_proof: "Request more proof"
};

function repoPath(relativePath: string): string {
  return path.join(process.cwd(), relativePath);
}

function slash(value: string): string {
  return value.replace(/\\/g, "/");
}

function markdownForRecommendationPacket(
  recommendation: SquibbRecommendation,
  stored: StoredSquibbRecommendationPacket
): string {
  return `# Squibb Optional Packet ${stored.packetId}

State: ${stored.state}
Created: ${stored.createdAt}
Action: ${ACTION_LABELS[stored.action]}
Recommendation: ${recommendation.title}
Packet path: \`${stored.packetPath}\`
Source mode: ${stored.sourceMode ?? "none"}
Source intake: ${stored.sourceIntakeId ?? "none"}
Source packet path: \`${stored.sourcePacketPath ?? "none"}\`
Source Speaker entry: \`${stored.sourceSpeakerEntryPath ?? "none"}\`

## Boundary

This optional packet records an operator-facing next move only. No intro, match, capital move, contract, profile, or external message was sent automatically.

## Move

- Kind: ${recommendation.kind}
- Rank: ${recommendation.rank > 0 ? recommendation.rank : "catalog"}
- Confidence: ${recommendation.confidence.score}% (${recommendation.confidence.label})
- Suggested crew: ${recommendation.suggestedAgent}
- Suggested tool: ${recommendation.suggestedTool ?? "none"}

## Reasoning

${recommendation.reasoning.rationale.map((reason) => `- ${reason}`).join("\n")}

## Human Gates

${recommendation.humanGates
  .map((gate) => `- ${gate.label}: ${gate.reason}${gate.benMustApprove ? " Ben approval required." : ""}`)
  .join("\n")}
`;
}

export async function storeSquibbRecommendationPacket(
  recommendation: SquibbRecommendation,
  action: SquibbRecommendationPacketAction,
  source?: SquibbRecommendationSessionSource
): Promise<StoredSquibbRecommendationPacket> {
  const createdAt = new Date().toISOString();
  const packetId = `squibb_option_${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}_${randomUUID().slice(0, 8)}`;
  const packetPath = slash(path.join(PACKET_DIR, `${packetId}.json`));
  const speakerEntryPath = slash(path.join(SPEAKER_ENTRY_DIR, `SQUIBB_OPTIONAL_PACKET_${packetId}.md`));
  const stored: StoredSquibbRecommendationPacket = {
    packetId,
    state: "StagedForOperator",
    action,
    createdAt,
    recommendationId: recommendation.id,
    packetPath,
    speakerEntryPath,
    indexPath: INDEX_PATH,
    sourceMode: source?.mode ?? null,
    sourceIntakeId: source?.intakeId ?? null,
    sourcePacketPath: source?.packetPath ?? null,
    sourceSpeakerEntryPath: source?.speakerEntryPath ?? null,
    meaning: `${ACTION_LABELS[action]} staged for operator review. No intro, match, money, or external dispatch happened automatically.`
  };
  const packet = {
    version: "v0",
    packetType: "squibb_optional_move",
    ...stored,
    boundary: {
      stagedOnly: true,
      noAutomaticIntro: true,
      noAutomaticMatch: true,
      noAutomaticCapitalMove: true,
      noExternalDispatch: true
    },
    source: source
      ? {
          mode: source.mode,
          label: source.label,
          detail: source.detail,
          intakeId: source.intakeId ?? null,
          packetPath: source.packetPath ?? null,
          speakerEntryPath: source.speakerEntryPath ?? null,
          capturedAt: source.capturedAt ?? null,
          answeredCount: source.answeredCount ?? null,
          totalQuestions: source.totalQuestions ?? null
        }
      : null,
    recommendation: {
      id: recommendation.id,
      kind: recommendation.kind,
      rank: recommendation.rank,
      title: recommendation.title,
      headline: recommendation.headline,
      confidence: recommendation.confidence,
      suggestedAgent: recommendation.suggestedAgent,
      suggestedTool: recommendation.suggestedTool ?? null,
      reasoning: recommendation.reasoning,
      evidence: recommendation.evidence,
      humanGates: recommendation.humanGates
    }
  };
  const indexRow = {
    packetId: stored.packetId,
    state: stored.state,
    action: stored.action,
    createdAt: stored.createdAt,
    recommendationId: recommendation.id,
    title: recommendation.title,
    confidence: recommendation.confidence.score,
    packetPath: stored.packetPath,
    speakerEntryPath: stored.speakerEntryPath,
    sourceMode: stored.sourceMode,
    sourceIntakeId: stored.sourceIntakeId,
    sourcePacketPath: stored.sourcePacketPath,
    sourceSpeakerEntryPath: stored.sourceSpeakerEntryPath,
    meaning: stored.meaning
  };

  await mkdir(repoPath(PACKET_DIR), { recursive: true });
  await mkdir(repoPath(SPEAKER_ENTRY_DIR), { recursive: true });
  await mkdir(path.dirname(repoPath(INDEX_PATH)), { recursive: true });
  await writeFile(repoPath(packetPath), `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  await writeFile(repoPath(speakerEntryPath), markdownForRecommendationPacket(recommendation, stored), "utf8");
  await appendFile(repoPath(INDEX_PATH), `${JSON.stringify(indexRow)}\n`, "utf8");

  return stored;
}

export async function readLatestSquibbRecommendationPacketRows(limit = 5): Promise<BellowsLedgerOptionRow[]> {
  let indexContent: string;

  try {
    indexContent = await readFile(repoPath(INDEX_PATH), "utf8");
  } catch {
    return [];
  }

  return indexContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as BellowsLedgerOptionRow;
      } catch {
        return null;
      }
    })
    .filter((row): row is BellowsLedgerOptionRow => row !== null)
    .reverse()
    .slice(0, limit);
}

import "server-only";

import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  buildSpeakerIntakePacket,
  formatSpeakerIntakeJson,
  type ConciergeIntakeAnswers,
  type SpeakerIntakePacket
} from "@/lib/squibb/concierge-intake-v0";
import type { BellowsLedgerIntakeRow } from "@/lib/squibb/bellows-ledger";

export type StoredSpeakerIntake = {
  intakeId: string;
  state: "Received";
  createdAt: string;
  packetPath: string;
  speakerEntryPath: string;
  indexPath: string;
  meaning: string;
};

export type StoredSpeakerIntakeIndexRow = StoredSpeakerIntake & {
  answeredCount: number;
  totalQuestions: number;
  headline: string;
};

export type LatestSpeakerIntake = {
  stored: StoredSpeakerIntakeIndexRow;
  packet: SpeakerIntakePacket;
};

const INDEX_PATH = "data/squibb/concierge-intakes.jsonl";
const PACKET_DIR = "data/squibb/concierge-intakes";
const SPEAKER_ENTRY_DIR = "foreman/speaker/entries";

function repoPath(relativePath: string): string {
  return path.join(process.cwd(), relativePath);
}

function slash(value: string): string {
  return value.replace(/\\/g, "/");
}

function markdownForSpeakerEntry(packet: SpeakerIntakePacket, stored: StoredSpeakerIntake): string {
  return `# Squibb Concierge Intake ${stored.intakeId}

State: ${stored.state}
Created: ${stored.createdAt}
Packet type: ${packet.packetType}
Mode: ${packet.intakeMode}
Packet path: \`${stored.packetPath}\`

## Boundary

This is a symptom-only intake packet. No partner request, service request, profile, match, score, intro, or recommendation was created automatically.

## Speaker Summary

${packet.speakerFeed.summary}

## Symptom Block

\`\`\`text
${packet.speakerFeed.symptomBlock}
\`\`\`

## Human Review Slots

- Translated need:
- Primary bottleneck:
- Visible reasons:
- Best next path:
- What would change this:
- Next human touch:
`;
}

export async function storeSpeakerIntake(answers: ConciergeIntakeAnswers): Promise<StoredSpeakerIntake> {
  const createdAt = new Date().toISOString();
  const intakeId = `squibb_intake_${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}_${randomUUID().slice(0, 8)}`;
  const packet = buildSpeakerIntakePacket(answers, createdAt);
  const packetPath = slash(path.join(PACKET_DIR, `${intakeId}.json`));
  const speakerEntryPath = slash(path.join(SPEAKER_ENTRY_DIR, `SQUIBB_CONCIERGE_INTAKE_${intakeId}.md`));
  const stored: StoredSpeakerIntake = {
    intakeId,
    state: "Received",
    createdAt,
    packetPath,
    speakerEntryPath,
    indexPath: INDEX_PATH,
    meaning: "Received for human review. No matching, scoring, profile, intro, or recommendation was created automatically."
  };
  const indexRow = {
    ...stored,
    answeredCount: packet.symptoms.filter((symptom) => symptom.answer.length > 0).length,
    totalQuestions: packet.symptoms.length,
    headline: packet.speakerFeed.headline
  };

  await mkdir(repoPath(PACKET_DIR), { recursive: true });
  await mkdir(repoPath(SPEAKER_ENTRY_DIR), { recursive: true });
  await mkdir(path.dirname(repoPath(INDEX_PATH)), { recursive: true });
  await writeFile(repoPath(packetPath), `${formatSpeakerIntakeJson(packet)}\n`, "utf8");
  await writeFile(repoPath(speakerEntryPath), markdownForSpeakerEntry(packet, stored), "utf8");
  await appendFile(repoPath(INDEX_PATH), `${JSON.stringify(indexRow)}\n`, "utf8");

  return stored;
}

export async function readLatestSpeakerIntake(): Promise<LatestSpeakerIntake | null> {
  let indexContent: string;

  try {
    indexContent = await readFile(repoPath(INDEX_PATH), "utf8");
  } catch {
    return null;
  }

  const latestLine = indexContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1);

  if (!latestLine) return null;

  try {
    const stored = JSON.parse(latestLine) as StoredSpeakerIntakeIndexRow;
    const packetContent = await readFile(repoPath(stored.packetPath), "utf8");
    const packet = JSON.parse(packetContent) as SpeakerIntakePacket;

    return { stored, packet };
  } catch {
    return null;
  }
}

export async function readLatestSpeakerIntakeRows(limit = 5): Promise<BellowsLedgerIntakeRow[]> {
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
        return JSON.parse(line) as BellowsLedgerIntakeRow;
      } catch {
        return null;
      }
    })
    .filter((row): row is BellowsLedgerIntakeRow => row !== null)
    .reverse()
    .slice(0, limit);
}

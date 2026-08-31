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
  ownerId?: string | null;
  /** Handeye/bot traffic. Kept out of the Speaker constitutional record. */
  testRun?: boolean;
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
const TEST_PACKET_DIR = "data/squibb/test-intakes";
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

This Intake stores the member's own words for two purposes: comparing possible next moves and drafting an unpublished profile. It does not publish a profile, contact a person, make an introduction, submit an application, spend money, or commit the member to an action.

## Speaker Summary

${packet.speakerFeed.summary}

## Member Answers

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

export async function storeSpeakerIntake(
  answers: ConciergeIntakeAnswers,
  options?: { ownerId?: string | null; testRun?: boolean }
): Promise<StoredSpeakerIntake> {
  const testRun = options?.testRun === true;
  const createdAt = new Date().toISOString();
  const intakeId = `${testRun ? "test_intake" : "squibb_intake"}_${createdAt
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14)}_${randomUUID().slice(0, 8)}`;
  const packet = buildSpeakerIntakePacket(answers, createdAt);
  const packetPath = slash(path.join(testRun ? TEST_PACKET_DIR : PACKET_DIR, `${intakeId}.json`));
  const speakerEntryPath = testRun
    ? ""
    : slash(path.join(SPEAKER_ENTRY_DIR, `SQUIBB_CONCIERGE_INTAKE_${intakeId}.md`));
  const stored: StoredSpeakerIntake = {
    intakeId,
    state: "Received",
    createdAt,
    packetPath,
    speakerEntryPath,
    indexPath: INDEX_PATH,
    meaning: testRun
      ? "Handeye test intake. Stored outside the Speaker record and excluded from human review."
      : "Received for matching engine processing. No profile or intro created automatically.",
    ownerId: options?.ownerId ?? null,
    testRun
  };
  const indexRow = {
    ...stored,
    answeredCount: packet.symptoms.filter((symptom) => symptom.answer.length > 0).length,
    totalQuestions: packet.symptoms.length,
    headline: packet.speakerFeed.headline
  };

  await mkdir(repoPath(testRun ? TEST_PACKET_DIR : PACKET_DIR), { recursive: true });
  await mkdir(path.dirname(repoPath(INDEX_PATH)), { recursive: true });
  await writeFile(repoPath(packetPath), `${formatSpeakerIntakeJson(packet)}\n`, "utf8");
  if (!testRun) {
    await mkdir(repoPath(SPEAKER_ENTRY_DIR), { recursive: true });
    await writeFile(repoPath(speakerEntryPath), markdownForSpeakerEntry(packet, stored), "utf8");
  }
  await appendFile(repoPath(INDEX_PATH), `${JSON.stringify(indexRow)}\n`, "utf8");

  return stored;
}

async function readIndexRows(): Promise<StoredSpeakerIntakeIndexRow[]> {
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
        return JSON.parse(line) as StoredSpeakerIntakeIndexRow;
      } catch {
        return null;
      }
    })
    .filter((row): row is StoredSpeakerIntakeIndexRow => row !== null);
}

async function loadLatestFromRows(rows: StoredSpeakerIntakeIndexRow[]): Promise<LatestSpeakerIntake | null> {
  const latest = rows.at(-1);
  if (!latest) return null;

  try {
    const packetContent = await readFile(repoPath(latest.packetPath), "utf8");
    const packet = JSON.parse(packetContent) as SpeakerIntakePacket;
    return { stored: latest, packet };
  } catch {
    return null;
  }
}

/** Global latest — operator/debug only. Personal pages must use owner-scoped readers. */
export async function readLatestSpeakerIntake(): Promise<LatestSpeakerIntake | null> {
  return loadLatestFromRows(await readIndexRows());
}

export async function readLatestSpeakerIntakeForOwner(ownerId: string): Promise<LatestSpeakerIntake | null> {
  if (!ownerId) return null;
  const owned = (await readIndexRows()).filter((row) => row.ownerId === ownerId);
  return loadLatestFromRows(owned);
}

/**
 * Local repair tool: makes one already-owned Intake the active/latest read
 * without copying or rewriting its answers. This appends a selection record so
 * the original ledger remains auditable. It is not account persistence.
 */
export async function activateStoredSpeakerIntakeForOwner(
  ownerId: string,
  intakeId: string
): Promise<LatestSpeakerIntake | null> {
  if (!ownerId || !intakeId) return null;
  const rows = await readIndexRows();
  const source = rows.find((row) => row.ownerId === ownerId && row.intakeId === intakeId);
  if (!source || source.testRun) return null;

  const activated: StoredSpeakerIntakeIndexRow = {
    ...source,
    createdAt: new Date().toISOString(),
    meaning: "Selected as this local member's current Intake. Durable account storage is still required."
  };
  await appendFile(repoPath(INDEX_PATH), `${JSON.stringify(activated)}\n`, "utf8");
  return loadLatestFromRows([activated]);
}

/**
 * Rebinds the browser-owned local Intake to a verified member without copying
 * or rewriting the member's answers. This is a localhost continuity bridge,
 * not durable account storage; production custody belongs in Supabase.
 */
export async function adoptLatestSpeakerIntakeForOwner(
  sourceOwnerId: string,
  targetOwnerId: string
): Promise<LatestSpeakerIntake | null> {
  if (!sourceOwnerId || !targetOwnerId) return null;
  if (sourceOwnerId === targetOwnerId) {
    return readLatestSpeakerIntakeForOwner(targetOwnerId);
  }

  const rows = await readIndexRows();
  const source = rows.filter((row) => row.ownerId === sourceOwnerId).at(-1);
  if (!source) return null;

  const existing = rows.find(
    (row) => row.ownerId === targetOwnerId && row.intakeId === source.intakeId
  );
  const adopted: StoredSpeakerIntakeIndexRow = existing ?? {
    ...source,
    ownerId: targetOwnerId,
    meaning: "Recovered from this browser for the verified member. Durable account storage is still required."
  };

  if (!existing) {
    await appendFile(repoPath(INDEX_PATH), `${JSON.stringify(adopted)}\n`, "utf8");
  }

  return loadLatestFromRows([adopted]);
}

export async function readLatestSpeakerIntakeRows(limit = 5): Promise<BellowsLedgerIntakeRow[]> {
  return (await readIndexRows()).reverse().slice(0, limit);
}

export async function readLatestSpeakerIntakeRowsForOwner(
  ownerId: string,
  limit = 5
): Promise<BellowsLedgerIntakeRow[]> {
  if (!ownerId) return [];
  return (await readIndexRows())
    .filter((row) => row.ownerId === ownerId)
    .reverse()
    .slice(0, limit);
}

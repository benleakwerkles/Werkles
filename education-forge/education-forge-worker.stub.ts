/**
 * Education Forge worker stub.
 *
 * Internal curriculum drafting scaffold — NOT the public Bellows product surface.
 * Bellows lives at /bellows (see foreman/SITE_MAP.md).
 *
 * May write only to:
 * - content/education/drafts/
 * - foreman/education-forge-output/
 * - education-forge/
 */

type EducationForgeConfig = {
  maxDraftsPerRun: number;
  maxSourcesPerDraft: number;
  dailyCostLimitUsd: number;
  dryRun: boolean;
};

type BacklogTopic = {
  id: string;
  title: string;
  lane: string;
  status: "queued" | "drafted" | "blocked" | "reviewed";
};

const config: EducationForgeConfig = {
  maxDraftsPerRun: Number(process.env.MAX_DRAFTS_PER_RUN || 1),
  maxSourcesPerDraft: Number(process.env.MAX_SOURCES_PER_DRAFT || 8),
  dailyCostLimitUsd: Number(process.env.DAILY_COST_LIMIT_USD || 5),
  dryRun: process.env.EDUCATION_FORGE_DRY_RUN !== "false",
};

const allowedWriteRoots = [
  "content/education/drafts/",
  "foreman/education-forge-output/",
  "education-forge/",
] as const;

function assertAllowedWritePath(path: string) {
  const normalized = path.replace(/\\/g, "/");
  const allowed = allowedWriteRoots.some((root) => normalized.startsWith(root));

  if (!allowed) {
    throw new Error(`Education Forge write blocked outside allowed roots: ${path}`);
  }
}

function enforceRunLimits(topics: BacklogTopic[]) {
  if (config.maxDraftsPerRun !== 1) {
    throw new Error("MAX_DRAFTS_PER_RUN must stay at 1 for this scaffold.");
  }

  if (config.maxSourcesPerDraft > 8) {
    throw new Error("MAX_SOURCES_PER_DRAFT cannot exceed 8.");
  }

  if (config.dailyCostLimitUsd > 5) {
    throw new Error("DAILY_COST_LIMIT_USD cannot exceed 5 for this scaffold.");
  }

  return topics.filter((topic) => topic.status === "queued").slice(0, 1);
}

async function draftOneLesson(topic: BacklogTopic) {
  const outputPath = `content/education/drafts/${topic.id}.md`;
  assertAllowedWritePath(outputPath);

  if (config.dryRun) {
    return {
      status: "dry_run",
      topic: topic.title,
      outputPath,
      note: "No draft generated. Education Forge live runs remain gated.",
    };
  }

  throw new Error("Live drafting is not enabled in the scaffold.");
}

export async function runEducationForge(topics: BacklogTopic[]) {
  const selected = enforceRunLimits(topics);

  if (selected.length === 0) {
    return [{ status: "idle", note: "No queued Bellows curriculum topics." }];
  }

  return Promise.all(selected.map(draftOneLesson));
}

export const educationForgeRules = {
  allowedWriteRoots,
  config,
  hardStops: [
    "Do not publish to /bellows or other app routes.",
    "Do not edit app, lib, company, supabase, or API routes.",
    "Do not run indefinitely.",
    "Do not provide financial, legal, tax, or investment advice.",
  ],
} as const;

#!/usr/bin/env node
/**
 * Move auto-generated concierge intake entries out of the Speaker record.
 *
 * Bot and proof traffic wrote SQUIBB_CONCIERGE_INTAKE_*.md into
 * foreman/speaker/entries, which is a human-review directory. Nothing is
 * deleted — entries are moved to data/squibb/test-intakes/archived-speaker-entries.
 *
 * Usage: node scripts/foreman/archive-test-intakes.mjs [--dry]
 */
import { mkdir, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const dry = process.argv.includes("--dry");
const root = process.cwd();
const sourceDir = path.join(root, "foreman/speaker/entries");
const archiveDir = path.join(root, "data/squibb/test-intakes/archived-speaker-entries");

const entries = (await readdir(sourceDir).catch(() => [])).filter(
  (name) => name.startsWith("SQUIBB_CONCIERGE_INTAKE_") && name.endsWith(".md")
);

if (!dry) await mkdir(archiveDir, { recursive: true });

const moved = [];
for (const name of entries) {
  if (!dry) await rename(path.join(sourceDir, name), path.join(archiveDir, name));
  moved.push(name);
}

if (!dry && moved.length > 0) {
  await writeFile(
    path.join(archiveDir, "README.md"),
    `# Archived concierge intake entries\n\n` +
      `${moved.length} auto-generated intake entries moved out of \`foreman/speaker/entries\` ` +
      `on ${new Date().toISOString()}.\n\n` +
      `These came from Handeye/proof traffic, not from human members. They are kept here ` +
      `for audit and are excluded from the Speaker human-review record. Handeye runs now ` +
      `send \`x-werkles-handeye: 1\` and never write to the Speaker directory.\n`,
    "utf8"
  );
}

console.log(JSON.stringify({ dry, movedCount: moved.length, archiveDir: "data/squibb/test-intakes/archived-speaker-entries" }, null, 2));

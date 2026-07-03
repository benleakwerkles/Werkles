import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { validateJob } from "./types.js";

function ensureParent(path) {
  const parent = dirname(path);
  if (!existsSync(parent)) {
    mkdirSync(parent, { recursive: true });
  }
}

export function readQueue(queuePath) {
  if (!existsSync(queuePath)) {
    return [];
  }

  return readFileSync(queuePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function enqueueJob(queuePath, job) {
  validateJob(job);
  ensureParent(queuePath);
  appendFileSync(queuePath, `${JSON.stringify(job)}\n`, "utf8");
  return job;
}

export function listQueuedJobs(queuePath) {
  return readQueue(queuePath).filter((job) => job.status === "queued");
}

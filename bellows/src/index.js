import { loadConfig } from "./config.js";
import { getHealthReport } from "./health.js";
import { createForgeClient } from "./forge/client.js";
import { createCompletedJob, createFailedJob } from "./jobs/types.js";
import { enqueueJob, listQueuedJobs } from "./jobs/queue.js";
import { storeAssetLocally } from "./storage/local.js";

export async function ingestForgeJob(forgeJobId) {
  const config = loadConfig();
  const forge = createForgeClient(config);
  const status = await forge.fetchJobStatus(forgeJobId);

  if (status.status === "failed") {
    const failedJob = createFailedJob({
      forgeJobId,
      error: status.error || "Forge reported failure",
    });
    enqueueJob(config.queuePath, failedJob);
    return failedJob;
  }

  const job = createCompletedJob({
    forgeJobId,
    assets: status.assets,
    metadata: { source: "bellows.ingest" },
  });

  if (config.mode === "dry-run" || config.mode === "local") {
    job.assets = job.assets.map((asset, index) => {
      const stored = storeAssetLocally(config.storageDir, job, asset, index);
      return { ...asset, localPath: stored.path, storedMode: stored.mode };
    });
    job.status = "stored";
  }

  enqueueJob(config.queuePath, job);
  return job;
}

export function getQueueSnapshot() {
  const config = loadConfig();
  return listQueuedJobs(config.queuePath);
}

async function main() {
  const command = process.argv[2] || "health";

  if (command === "health") {
    console.log(JSON.stringify(getHealthReport(), null, 2));
    return;
  }

  if (command === "queue") {
    console.log(JSON.stringify(getQueueSnapshot(), null, 2));
    return;
  }

  if (command === "ingest") {
    const forgeJobId = process.argv[3];
    if (!forgeJobId) {
      throw new Error("Usage: node src/index.js ingest <forgeJobId>");
    }
    const job = await ingestForgeJob(forgeJobId);
    console.log(JSON.stringify(job, null, 2));
    return;
  }

  throw new Error(`Unknown command "${command}". Expected: health, queue, ingest`);
}

import { pathToFileURL } from "node:url";

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

import { ingestForgeJob } from "../src/index.js";
import { getHealthReport } from "../src/health.js";
import { loadConfig } from "../src/config.js";
import { readQueue } from "../src/jobs/queue.js";

const sampleForgeJobId = "dry-run-forge-001";

console.log("Bellows dry-run");
console.log(JSON.stringify(getHealthReport(), null, 2));

const job = await ingestForgeJob(sampleForgeJobId);
console.log("Ingested job:");
console.log(JSON.stringify(job, null, 2));

console.log("Queue file:");
console.log(JSON.stringify(readQueue(loadConfig().queuePath), null, 2));

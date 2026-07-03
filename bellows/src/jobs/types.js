/**
 * @typedef {Object} ForgeAssetRef
 * @property {string} url
 * @property {string} [mimeType]
 * @property {number} [bytes]
 */

/**
 * @typedef {Object} BellowsJob
 * @property {string} id
 * @property {"forge.completed" | "forge.failed"} type
 * @property {string} forgeJobId
 * @property {string} createdAt
 * @property {"queued" | "stored" | "failed"} status
 * @property {ForgeAssetRef[]} assets
 * @property {string} [error]
 * @property {Record<string, string>} [metadata]
 */

export function createCompletedJob(input) {
  const now = new Date().toISOString();
  return {
    id: input.id || `bellows_${now.replace(/[:.]/g, "-")}`,
    type: "forge.completed",
    forgeJobId: input.forgeJobId,
    createdAt: now,
    status: "queued",
    assets: input.assets || [],
    metadata: input.metadata || {},
  };
}

export function createFailedJob(input) {
  const now = new Date().toISOString();
  return {
    id: input.id || `bellows_${now.replace(/[:.]/g, "-")}`,
    type: "forge.failed",
    forgeJobId: input.forgeJobId,
    createdAt: now,
    status: "failed",
    assets: [],
    error: input.error || "Unknown forge failure",
    metadata: input.metadata || {},
  };
}

export function validateJob(job) {
  if (!job || typeof job !== "object") {
    throw new Error("Job must be an object");
  }
  if (!job.id || !job.type || !job.forgeJobId) {
    throw new Error("Job missing required fields: id, type, forgeJobId");
  }
  if (job.type === "forge.completed" && !Array.isArray(job.assets)) {
    throw new Error("Completed jobs require an assets array");
  }
}

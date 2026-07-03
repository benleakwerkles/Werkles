import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function storeAssetLocally(storageDir, job, asset, index) {
  mkdirSync(storageDir, { recursive: true });

  const extension = guessExtension(asset.mimeType);
  const filename = `${job.forgeJobId}_${index}${extension}`;
  const targetPath = join(storageDir, filename);

  if (asset.url.startsWith("dry-run://")) {
    const payload = {
      jobId: job.id,
      forgeJobId: job.forgeJobId,
      asset,
      storedAt: new Date().toISOString(),
    };
    writeFileSync(targetPath, JSON.stringify(payload, null, 2), "utf8");
    return { path: targetPath, bytes: targetPath.length, mode: "dry-run" };
  }

  throw new Error(
    "Only dry-run:// asset URLs are supported in local mode. Network fetch requires a human gate."
  );
}

function guessExtension(mimeType) {
  switch (mimeType) {
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    default:
      return ".json";
  }
}

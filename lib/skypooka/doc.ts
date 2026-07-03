import { promises as fs } from "node:fs";
import path from "node:path";

const ALLOWED_PREFIXES = ["foreman/handoffs/outbox/", "foreman/handoffs/inbox/"];

function isAllowedDocPath(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  return ALLOWED_PREFIXES.some((prefix) => normalized.startsWith(prefix)) && !normalized.includes("..");
}

export async function readSkyPookaDoc(relativePath: string) {
  if (!isAllowedDocPath(relativePath)) {
    throw new Error("DOC_PATH_NOT_ALLOWED");
  }

  const absolutePath = path.join(process.cwd(), relativePath);
  const text = await fs.readFile(absolutePath, "utf8");
  const stat = await fs.stat(absolutePath);

  return {
    ok: true as const,
    path: relativePath.replace(/\\/g, "/"),
    updated_at: stat.mtime.toISOString(),
    content: text
  };
}

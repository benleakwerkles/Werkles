import { promises as fs } from "node:fs";
import path from "node:path";

export const MAX_COCKPIT_ARTIFACT_BYTES = 128 * 1024;

const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/
];

export async function resolveCockpitArtifactPath(root: string, relativePath: string) {
  if (!relativePath || relativePath.includes("\\") || path.posix.normalize(relativePath) !== relativePath || relativePath.startsWith("/") || relativePath.startsWith("../")) {
    throw new Error("COCKPIT_ARTIFACT_PATH_INVALID");
  }
  const realRoot = await fs.realpath(root);
  const lexical = path.resolve(realRoot, ...relativePath.split("/"));
  const rootPrefix = `${realRoot}${path.sep}`.toLowerCase();
  if (!lexical.toLowerCase().startsWith(rootPrefix)) throw new Error("COCKPIT_ARTIFACT_PATH_INVALID");
  const real = await fs.realpath(lexical);
  if (!real.toLowerCase().startsWith(rootPrefix)) throw new Error("COCKPIT_ARTIFACT_PATH_INVALID");
  if (real.toLowerCase() !== lexical.toLowerCase()) throw new Error("COCKPIT_ARTIFACT_LINK_FORBIDDEN");
  return real;
}

export function assertCockpitArtifactSafe(content: Buffer) {
  if (content.byteLength > MAX_COCKPIT_ARTIFACT_BYTES) throw new Error("COCKPIT_ARTIFACT_TOO_LARGE");
  const text = content.toString("utf8");
  if (SECRET_PATTERNS.some((pattern) => pattern.test(text))) throw new Error("COCKPIT_ARTIFACT_SECRET_PATTERN_REJECTED");
}

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import type { PetraTransportResponse } from "./types";

const PENDING = path.join(process.cwd(), "foreman", "soledash", ".petra-transport-pending.txt");
const SCRIPT = path.join(process.cwd(), "scripts", "foreman", "soledash-petra-deliver.mjs");

export async function runPetraTransportDeliver(rawText: string): Promise<PetraTransportResponse> {
  const text = rawText.trim();
  if (!text) {
    throw new Error("raw_text required");
  }

  fs.mkdirSync(path.dirname(PENDING), { recursive: true });
  fs.writeFileSync(PENDING, text, "utf8");

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT, "--file", PENDING], {
      cwd: process.cwd(),
      windowsHide: true,
      env: process.env
    });

    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      try {
        child.kill("SIGTERM");
      } catch {
        /* ignore */
      }
      reject(new Error("Petra transport timed out after 90s"));
    }, 90000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", () => {
      clearTimeout(timer);
      try {
        const parsed = JSON.parse(stdout.trim()) as PetraTransportResponse;
        resolve(parsed);
      } catch {
        reject(new Error(stderr.trim() || stdout.trim() || "Petra transport returned invalid JSON"));
      }
    });
  });
}

import fs from "node:fs";
import path from "node:path";

import type { ShakespeareDecisionView, ShakespeareV0Payload } from "./types";

const RECEIPT_DIR = path.join(process.cwd(), "foreman", "soledash", "shakespeare-verdicts");

function stamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

export function writeShakespeareVerdictReceipt(
  payload: ShakespeareV0Payload,
  view: ShakespeareDecisionView
): string {
  fs.mkdirSync(RECEIPT_DIR, { recursive: true });
  const filename = `SHAKESPEARE_VERDICT_${stamp()}.json`;
  const filePath = path.join(RECEIPT_DIR, filename);
  fs.writeFileSync(
    filePath,
    `${JSON.stringify(
      {
        schema: "SHAKESPEARE_VERDICT_RECEIPT_V0",
        generated_at: new Date().toISOString(),
        payload,
        view
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  return filePath;
}

import fs from "node:fs";
import path from "node:path";

import { presetById } from "./presets";
import { markRepeatOffender, rel, writeFocusTheftReceipt } from "./storage";
import type { FocusTheftReceipt, FocusTheftReportInput } from "./types";

const ROOT = process.cwd();
const DINK_OUTBOX = path.join(ROOT, "foreman", "handoffs", "outbox");

function stampForFilename(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(/\..+$/, "").slice(0, 15);
}

function writeDinkHandoff(receipt: FocusTheftReceipt): string | null {
  try {
    fs.mkdirSync(DINK_OUTBOX, { recursive: true });
    const slug = receipt.source_app.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 32);
    const file = path.join(
      DINK_OUTBOX,
      `TO_DINK_FOCUS_THEFT_${slug}_${stampForFilename(receipt.timestamp)}.md`
    );
    const repeatLine = receipt.repeat_offender ? "\n- **Repeat offender:** YES — logged in repeat-offenders.json\n" : "";
    const body = `# To Dink: Focus theft incident

| Field | Value |
|-------|-------|
| Incident | \`${receipt.incident_id}\` |
| Reported | ${receipt.timestamp} |
| Source app | ${receipt.source_app} |
| Severity | ${receipt.severity.toUpperCase()} |
| Receipt | \`${receipt.receipt_path}\` |

## Notification

${receipt.notification_text}

## What Ben was doing

${receipt.what_ben_was_doing || "—"}
${repeatLine}
## Operator ask

Track focus-stealing popup pattern. Recommend kill / mute / policy for ${receipt.source_app} if repeat.

## Hard stops

- No auto-approval of OS notification policy changes — Operator decides
- Authority: \`foreman/HUMAN_GATES.md\`
`;
    fs.writeFileSync(file, body, "utf8");
    return rel(file);
  } catch {
    return null;
  }
}

export function submitFocusTheftReport(
  input: FocusTheftReportInput,
  opts?: { preset_id?: string }
): FocusTheftReceipt {
  const now = new Date().toISOString();
  const incidentId = `focus_theft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const receipt: FocusTheftReceipt = {
    incident_id: incidentId,
    timestamp: now,
    source_app: input.source_app.trim(),
    notification_text: input.notification_text.trim(),
    what_ben_was_doing: input.what_ben_was_doing.trim(),
    severity: input.severity,
    repeat_offender: Boolean(input.repeat_offender),
    reported_to: "DINK",
    receipt_path: "",
    dink_outbox_path: null,
    success: false
  };

  const receiptPath = writeFocusTheftReceipt(receipt);
  receipt.receipt_path = receiptPath;
  receipt.dink_outbox_path = writeDinkHandoff(receipt);
  receipt.success = true;

  writeFocusTheftReceipt(receipt);

  if (receipt.repeat_offender) {
    markRepeatOffender(receipt.source_app, incidentId, now);
  }

  if (opts?.preset_id && !presetById(opts.preset_id)) {
    /* preset hint only — receipt already written */
  }

  return receipt;
}

export function submitFocusTheftPreset(presetId: string, repeatOffender = false): FocusTheftReceipt {
  const preset = presetById(presetId);
  if (!preset) {
    throw new Error(`Unknown focus theft preset: ${presetId}`);
  }
  return submitFocusTheftReport(
    {
      source_app: preset.source_app,
      notification_text: preset.notification_text,
      what_ben_was_doing: preset.what_ben_was_doing,
      severity: preset.severity,
      repeat_offender: repeatOffender
    },
    { preset_id: presetId }
  );
}

export { latestFocusTheftReceipt, readFocusTheftReceipt } from "./storage";

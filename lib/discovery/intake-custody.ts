import "server-only";

import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { getSupabaseService } from "@/lib/supabase/server";
import { dataPath } from "@/lib/server/writable-data-root";
import { getMatchingStorageMode } from "@/lib/matching/storage-mode";
import type { DiscoveryIntakeRecord } from "@/lib/discovery/schema";

function recordMarkdown(record: DiscoveryIntakeRecord): string {
  const markdownValue = (value: string | string[]) =>
    Array.isArray(value) ? (value.length > 0 ? value.join(", ") : "Not provided") : value || "Not provided";

  return `# Werkles Discovery Record ${record.user_id}

Schema: ${record.schema}
State: ${record.state}
Intake date: ${record.intake_date}

## Intake

- Name: ${markdownValue(record.name)}
- Contact: ${markdownValue(record.contact)}
- Lane: ${markdownValue(record.lane)}
- Response speed: ${markdownValue(record.response_speed)}
- Assets: ${markdownValue(record.assets)}

### Situation

${markdownValue(record.situation)}

### Goal

${markdownValue(record.goal)}

### Why now

${markdownValue(record.why_now)}

### Self-stated blocker

${markdownValue(record.stated_blocker)}

### What they already tried

${markdownValue(record.tried)}

### Hard constraints

${markdownValue(record.constraints)}

### One thing a stranger could hand them

${markdownValue(record.one_thing)}

### Notes

${markdownValue(record.notes)}

## Bottleneck Review

- Reviewer:
- Review date:
- Situation restated:
- Translated need:
- Stated vs real mismatch:
- Primary bottleneck:
- Bottleneck why:
- Confidence: High / Medium / Low
- Notes:

## Recommendation Card

### What You Asked For

### What We Heard Underneath It

### Visible Reasons

### Recommendation

Best next path:

What would help:

### Why Not The Alternatives

### What Would Change This

## Outcome Tracking

- Acted: Pending
- Acted date:
- Felt right: Unknown
- Result:
- Disposition: Awaiting
- Next touch date:
- Follow-up notes:
`;
}

async function persistDiscoveryFile(record: DiscoveryIntakeRecord): Promise<void> {
  const dataDir = dataPath("data", "discovery");
  const recordDir = path.join(dataDir, "records");
  await mkdir(recordDir, { recursive: true });
  await appendFile(path.join(dataDir, "intakes.jsonl"), `${JSON.stringify(record)}\n`, "utf8");
  await writeFile(dataPath(record.record_path), recordMarkdown(record), "utf8");
}

async function persistDiscoverySupabase(record: DiscoveryIntakeRecord): Promise<void> {
  const { error } = await getSupabaseService()
    .from("discovery_intakes")
    .upsert(
      {
        intake_id: record.user_id,
        source: "discovery",
        state: record.state,
        normalized_payload: record,
        received_at: record.intake_date,
        updated_at: new Date().toISOString()
      },
      { onConflict: "intake_id" }
    );

  if (error) throw new Error(`Discovery intake durable write failed: ${error.message}`);
}

export async function persistDiscoveryIntakeCustody(record: DiscoveryIntakeRecord): Promise<void> {
  if (getMatchingStorageMode() === "supabase") {
    await persistDiscoverySupabase(record);
    return;
  }
  await persistDiscoveryFile(record);
}

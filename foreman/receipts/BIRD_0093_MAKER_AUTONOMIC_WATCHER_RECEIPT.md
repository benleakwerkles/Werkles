# BIRD_0093_MAKER_AUTONOMIC_WATCHER_RECEIPT

Receipt_ID: BIRD_0093_MAKER_AUTONOMIC_WATCHER_RECEIPT
Packet_ID: BIRD_0093_MAKER_AUTONOMIC_WATCHER
Status: ARTIFACT
Created_At: 2026-06-27T17:49:19-04:00
Artifact_Path: speaker/bin/speakerctl.js

## Summary

Built `watch-substrate` in `speaker/bin/speakerctl.js`.

The command runs a persistent deterministic polling loop over:

- `speaker/receipts/raw/inbox/`
- `speaker/doctrine/active/`

When a new inbox JSON file appears, it executes `node speakerctl.js ingest [file]`. When a new active doctrine Markdown file appears, it runs `speaker/bin/speaker-validate.sh [file]`, then executes `node speakerctl.js rebuild-index` on validation pass. All autonomic events append to `speaker/logs/ingest.jsonl`.

`speaker/bin/speaker-validate.sh` was also tightened to accept explicit file arguments while preserving its previous staged-file behavior.

## watch-substrate Code Block

```javascript
function handleReceiptInboxFile(filePath) {
  appendAutonomicEvent({
    status: "TRIGGER",
    trigger: "receipt_inbox_new_file",
    file_path: sourceLabel(filePath)
  });

  const ingestResult = runNodeSpeakerctl(["ingest", filePath]);
  appendAutonomicEvent({
    status: ingestResult.exit_code === 0 ? "PASS" : "FAIL",
    trigger: "receipt_inbox_ingest",
    file_path: sourceLabel(filePath),
    ...ingestResult
  });
}

function handleActiveDoctrineFile(filePath) {
  appendAutonomicEvent({
    status: "TRIGGER",
    trigger: "active_doctrine_new_markdown",
    file_path: sourceLabel(filePath)
  });

  const validateResult = runSpeakerValidate(filePath);
  appendAutonomicEvent({
    status: validateResult.exit_code === 0 ? "PASS" : "FAIL",
    trigger: "active_doctrine_frontmatter_validate",
    file_path: sourceLabel(filePath),
    ...validateResult
  });

  if (validateResult.exit_code !== 0) return;

  const rebuildResult = runNodeSpeakerctl(["rebuild-index"]);
  appendAutonomicEvent({
    status: rebuildResult.exit_code === 0 ? "PASS" : "FAIL",
    trigger: "active_doctrine_rebuild_index",
    file_path: sourceLabel(filePath),
    ...rebuildResult
  });
}

function scanWatchTargets(seen, options = {}) {
  const receiptSnapshot = watchedFileSnapshot(RAW_RECEIPT_INBOX_DIR, isReceiptInboxFile);
  const doctrineSnapshot = watchedFileSnapshot(ACTIVE_DOCTRINE_DIR, isActiveDoctrineMarkdown);
  const nextSeen = mergeSnapshots(receiptSnapshot, doctrineSnapshot);

  for (const [filePath, marker] of nextSeen.entries()) {
    const previousMarker = seen.get(filePath);
    if (previousMarker === marker) continue;
    seen.set(filePath, marker);
    if (previousMarker === undefined && options.ignoreExisting) continue;
    if (filePath.startsWith(RAW_RECEIPT_INBOX_DIR)) {
      handleReceiptInboxFile(filePath);
    } else if (filePath.startsWith(ACTIVE_DOCTRINE_DIR)) {
      handleActiveDoctrineFile(filePath);
    }
  }

  for (const filePath of Array.from(seen.keys())) {
    if (!nextSeen.has(filePath)) seen.delete(filePath);
  }
}

function watchSubstrate(options = {}) {
  ensureDirs();
  const intervalMs = Number.parseInt(String(options.intervalMs || 500), 10);
  const safeIntervalMs = Number.isInteger(intervalMs) && intervalMs >= 100 ? intervalMs : 500;
  const seen = options.includeExisting
    ? new Map()
    : mergeSnapshots(
      watchedFileSnapshot(RAW_RECEIPT_INBOX_DIR, isReceiptInboxFile),
      watchedFileSnapshot(ACTIVE_DOCTRINE_DIR, isActiveDoctrineMarkdown)
    );

  appendAutonomicEvent({
    status: "START",
    trigger: "watch_substrate",
    receipt_inbox_dir: sourceLabel(RAW_RECEIPT_INBOX_DIR),
    active_doctrine_dir: sourceLabel(ACTIVE_DOCTRINE_DIR),
    interval_ms: safeIntervalMs,
    include_existing: Boolean(options.includeExisting)
  });

  if (options.once) {
    scanWatchTargets(seen, { ignoreExisting: false });
    appendAutonomicEvent({ status: "STOP", trigger: "watch_substrate_once" });
    return { ok: true, status: "WATCH_SUBSTRATE_ONCE_COMPLETE" };
  }

  setInterval(() => {
    try {
      scanWatchTargets(seen, { ignoreExisting: false });
    } catch (error) {
      appendAutonomicEvent({
        status: "FAIL",
        trigger: "watch_substrate_scan",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, safeIntervalMs);

  printResult({
    ok: true,
    status: "WATCH_SUBSTRATE_RUNNING",
    receipt_inbox_dir: sourceLabel(RAW_RECEIPT_INBOX_DIR),
    active_doctrine_dir: sourceLabel(ACTIVE_DOCTRINE_DIR),
    interval_ms: safeIntervalMs
  });
  return { ok: true, status: "WATCH_SUBSTRATE_RUNNING" };
}
```

## Proof

Syntax and lint:

```text
speakerctl syntax ok
ReadLints: no linter errors found for speaker/bin/speakerctl.js and speaker/bin/speaker-validate.sh
```

One-shot watcher proof:

```text
{"event":"watch_substrate","timestamp":"2026-06-27T21:49:19.185Z","status":"START","trigger":"watch_substrate","receipt_inbox_dir":"receipts/raw/inbox","active_doctrine_dir":"doctrine/active","interval_ms":500,"include_existing":true}
{"event":"watch_substrate","timestamp":"2026-06-27T21:49:19.187Z","status":"TRIGGER","trigger":"receipt_inbox_new_file","file_path":"receipts/raw/inbox/BIRD_0093_WATCH_PROBE_RECEIPT_2.json"}
{"event":"watch_substrate","timestamp":"2026-06-27T21:49:19.244Z","status":"PASS","trigger":"receipt_inbox_ingest","file_path":"receipts/raw/inbox/BIRD_0093_WATCH_PROBE_RECEIPT_2.json","command":"C:\\Program Files\\nodejs\\node.exe bin/speakerctl.js ingest C:\\Users\\Ben Leak\\Desktop\\github\\Werkles\\speaker\\receipts\\raw\\inbox\\BIRD_0093_WATCH_PROBE_RECEIPT_2.json","exit_code":0}
{"event":"watch_substrate","timestamp":"2026-06-27T21:49:19.245Z","status":"TRIGGER","trigger":"active_doctrine_new_markdown","file_path":"doctrine/active/BIRD_0093_WATCH_PROBE_2.md"}
{"event":"watch_substrate","timestamp":"2026-06-27T21:49:19.413Z","status":"PASS","trigger":"active_doctrine_frontmatter_validate","file_path":"doctrine/active/BIRD_0093_WATCH_PROBE_2.md","command":"C:\\Program Files\\Git\\bin\\sh.exe bin/speaker-validate.sh speaker/doctrine/active/BIRD_0093_WATCH_PROBE_2.md","exit_code":0}
{"event":"watch_substrate","timestamp":"2026-06-27T21:49:19.478Z","status":"PASS","trigger":"active_doctrine_rebuild_index","file_path":"doctrine/active/BIRD_0093_WATCH_PROBE_2.md","command":"C:\\Program Files\\nodejs\\node.exe bin/speakerctl.js rebuild-index","exit_code":0}
```

Cleanup proof:

```text
Temporary raw inbox and active doctrine probe files were removed after the proof.
node speaker/bin/speakerctl.js rebuild-index
status: DOCTRINE_INDEX_REBUILT
doctrine_index_rows: 2
```

Canonical ingest proof retained:

```text
speaker/receipts/canonical/BIRD_0093_WATCH_PROBE_RECEIPT_2.b7d20f9c7089ca3ef39f86d7cd37fc295ed71c8fd578aa8466e4172c26ff541c.json
```

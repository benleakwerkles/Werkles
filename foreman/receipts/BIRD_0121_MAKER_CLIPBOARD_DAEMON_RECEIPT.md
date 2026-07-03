# BIRD_0121_MAKER_CLIPBOARD_DAEMON Receipt

Timestamp: 2026-06-27T18:26:00-04:00
Destination: Speaker / Clipboard Harvester

## FILES

- `speaker/bin/clip-harvester.js`
- `speaker/logs/clip_harvest.jsonl`
- `speaker/receipts/staged/BIRD_0121_STAGE_PROOF__BIRD_0121_STAGE_PROOF.md`
- `speaker/receipts/raw/inbox/BIRD_0121_TRANSMISSION_PROOF__BIRD_0121_TRANSMISSION_PROOF.txt`
- `foreman/receipts/BIRD_0121_MAKER_CLIPBOARD_DAEMON_RECEIPT.md`

## ARTIFACT

Complete JavaScript pattern matching array inside `clip-harvester.js`:

```javascript
const PATTERN_MATCHING_ARRAY = Object.freeze([
  {
    name: "packet_blocks",
    regex: /(?:^|\r?\n)(PACKET_ID:[\s\S]*?)(?=\r?\n\s*(?:\*{3,}|-{3,})\s*(?:\r?\n|$)|$)/g,
    verifies: "Globally isolates each packet from PACKET_ID through the line before a *** or --- separator."
  },
  {
    name: "packet_id_header",
    regex: /^PACKET_ID:\s*([^\r\n]+)/mi,
    verifies: "Captures the packet identifier from the isolated packet header."
  },
  {
    name: "to_header",
    regex: /^TO:\s*([^\s@\r\n]+)@([^\s\r\n]+)/mi,
    verifies: "Captures the target node and machine from TO: [NODE]@[MACHINE]."
  },
  {
    name: "target_path_header",
    regex: /^TARGET_PATH:\s*([^\r\n]+)/mi,
    verifies: "Captures the declared target path without consuming payload body lines."
  },
  {
    name: "payload_fences",
    regex: /```[^\r\n]*(?:\r?\n)([\s\S]*?)```/g,
    verifies: "Captures every fenced payload body while discarding markdown fence wrappers."
  },
  {
    name: "transmission_classifier",
    regex: /\b(?:TRANSMISSION|RAW_EXECUTION|EXECUTION_INBOX|RECEIPTS_RAW_INBOX)\b|receipts[\\/]+raw[\\/]+inbox/i,
    verifies: "Routes transmission payloads to the raw execution inbox instead of staged receipts."
  }
]);
```

## IMPLEMENTATION

- Added native Node clipboard daemon at `speaker/bin/clip-harvester.js`.
- Live mode polls the Windows clipboard with PowerShell `Get-Clipboard -Raw`.
- Test mode supports `--stdin --once` and `--source [path]` without touching the live clipboard.
- Each harvested packet extracts `PACKET_ID`, `TO: [NODE]@[MACHINE]`, `TARGET_PATH`, and fenced payload bodies.
- Standard packets route to `speaker/receipts/staged`.
- Transmission packets route to `speaker/receipts/raw/inbox`.
- Successful extractions append JSONL entries to `speaker/logs/clip_harvest.jsonl`.

## PROOF

- `node --check speaker/bin/clip-harvester.js` passed.
- A two-packet stdin stream harvested both packets without manual highlighting.
- `BIRD_0121_STAGE_PROOF` wrote only the fenced markdown body to `speaker/receipts/staged/BIRD_0121_STAGE_PROOF__BIRD_0121_STAGE_PROOF.md`.
- `BIRD_0121_TRANSMISSION_PROOF` wrote only the fenced transmission body to `speaker/receipts/raw/inbox/BIRD_0121_TRANSMISSION_PROOF__BIRD_0121_TRANSMISSION_PROOF.txt`.
- `speaker/logs/clip_harvest.jsonl` contains PASS entries for both successful extractions.
- `ReadLints` timed out for the standalone script; syntax and runtime parser proof passed.

## PASS/FAIL

PASS.

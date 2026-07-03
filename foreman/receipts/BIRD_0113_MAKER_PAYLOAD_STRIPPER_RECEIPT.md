# BIRD_0113_MAKER_PAYLOAD_STRIPPER_RECEIPT

Receipt_ID: BIRD_0113_MAKER_PAYLOAD_STRIPPER_RECEIPT
Packet_ID: BIRD_0113_MAKER_PAYLOAD_STRIPPER
Status: ARTIFACT
Created_At: 2026-06-27T18:14:00-04:00
Artifact_Path: speaker/bin/speakerctl.js

## Summary

Added `extract-payload` to `speaker/bin/speakerctl.js`.

The command accepts `--source [FILE_PATH]`, or stdin when no source is provided. It uses a regex extraction block to isolate the primary triple-backtick fenced payload and writes only that captured payload to `speaker/bootloader/incoming/RAW_PAYLOAD.txt`.

## JavaScript Routing Loop Artifact

```javascript
const BOOTLOADER_INCOMING_DIR = path.join(SPEAKER_ROOT, "bootloader", "incoming");
const RAW_PAYLOAD_PATH = path.join(BOOTLOADER_INCOMING_DIR, "RAW_PAYLOAD.txt");

function readPayloadSource(sourcePath) {
  if (sourcePath) {
    return fs.readFileSync(path.resolve(sourcePath), "utf8");
  }
  return fs.readFileSync(0, "utf8");
}

function extractPrimaryFencePayload(raw) {
  const match = raw.match(/```[^\r\n]*(?:\r?\n)([\s\S]*?)```/);
  if (!match) {
    throw new Error("EXTRACT_PAYLOAD_FENCE_NOT_FOUND");
  }
  return match[1];
}

function extractPayload({ source } = {}) {
  ensureDirs();
  const raw = readPayloadSource(source);
  const payload = extractPrimaryFencePayload(raw);
  fs.writeFileSync(RAW_PAYLOAD_PATH, payload, "utf8");
  const result = {
    ok: true,
    status: "RAW_PAYLOAD_EXTRACTED",
    source_path: source ? sourceLabel(path.resolve(source)) : "stdin",
    output_path: sourceLabel(RAW_PAYLOAD_PATH),
    bytes_written: Buffer.byteLength(payload, "utf8"),
    sha256: sha256(payload)
  };
  printResult(result);
  return result;
}

if (command === "extract-payload") {
  const args = parseArgs(argv.slice(1));
  try {
    extractPayload({
      source: args.source || args._[0]
    });
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      status: "ERROR",
      error: error instanceof Error ? error.message : String(error)
    }, null, 2));
    process.exitCode = 1;
  }
  return;
}
```

## Proof

Command:

```text
node speaker/bin/speakerctl.js extract-payload --source="speaker/bootloader/incoming/BIRD_0113_EXTRACT_PROBE.md"
```

Result:

```json
{
  "ok": true,
  "status": "RAW_PAYLOAD_EXTRACTED",
  "source_path": "bootloader/incoming/BIRD_0113_EXTRACT_PROBE.md",
  "output_path": "bootloader/incoming/RAW_PAYLOAD.txt",
  "bytes_written": 55,
  "sha256": "1dfbe34cce9168c09121f99411bed458feafaf06faae12985bfbe6e16e4697cd"
}
```

Exact extraction check:

```text
capture_found=true
payload_matches_regex_capture=true
capture_bytes=55
payload_bytes=55
capture_sha256=1dfbe34cce9168c09121f99411bed458feafaf06faae12985bfbe6e16e4697cd
payload_sha256=1dfbe34cce9168c09121f99411bed458feafaf06faae12985bfbe6e16e4697cd
```

Extracted `RAW_PAYLOAD.txt`:

```javascript
const answer = 42;
console.log(`payload:${answer}`);
```

## Verification

```text
node --check speaker/bin/speakerctl.js
speakerctl syntax ok

ReadLints
No linter errors found.
```

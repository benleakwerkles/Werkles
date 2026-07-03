# BIRD_0073_MAKER_GPG_VERIFY_CORE_RECEIPT

Receipt_ID: BIRD_0073_MAKER_GPG_VERIFY_CORE_RECEIPT
Packet_ID: BIRD_0073_MAKER_GPG_VERIFY_CORE
Status: ARTIFACT
Created_At: 2026-06-27T17:16:00-04:00
Artifact_Path: speaker/bin/speakerctl.js

## Summary

Built the native Node.js GPG verification core in `speaker/bin/speakerctl.js`.

The implementation uses `node:child_process` `spawnSync` with an argument array and `shell: false`; it does not interpolate untrusted paths into a shell command. It captures `exit_code`, `stdout`, `stderr`, and spawn errors. It only returns `true` when GPG exits `0` and `stderr` contains `Good signature from`.

`apply-apoptosis` now verifies the resolved `operator_approval_receipt_id` payload before mutating doctrine status fields. The approval receipt may declare `signature_path` / `signaturePath`, otherwise Speaker expects a sidecar signature at `[approval_receipt_path].sig`.

## Raw JavaScript Verification Block

```javascript
const { spawnSync } = require("node:child_process");

const VALIDATION_LOG_PATH = path.join(SPEAKER_ROOT, "logs", "validation.jsonl");
const OPERATOR_PUBKEY_KEYRING = path.join(SPEAKER_ROOT, "LOCKS", "operator_pubkey.gpg");

function appendValidationLog(entry) {
  fs.appendFileSync(VALIDATION_LOG_PATH, `${JSON.stringify(entry)}\n`, "utf8");
}

function safeExistingFilePath(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label}_PATH_REQUIRED`);
  }
  if (value.includes("\0")) {
    throw new Error(`${label}_PATH_CONTAINS_NULL_BYTE`);
  }

  const absolutePath = path.resolve(value);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`${label}_PATH_NOT_FOUND: ${absolutePath}`);
  }
  if (!fs.statSync(absolutePath).isFile()) {
    throw new Error(`${label}_PATH_NOT_FILE: ${absolutePath}`);
  }
  return absolutePath;
}

function logCriticalSovereigntyViolation(details) {
  const entry = {
    event: "403 CRITICAL_SOVEREIGNTY_VIOLATION",
    status: "CRITICAL_SOVEREIGNTY_VIOLATION",
    timestamp: stamp(),
    ...details
  };
  appendValidationLog(entry);
  return entry;
}

function verifySignature(payloadPath, signaturePath) {
  ensureDirs();
  let safePayloadPath;
  let safeSignaturePath;
  let safeKeyringPath;
  try {
    safePayloadPath = safeExistingFilePath(payloadPath, "PAYLOAD");
    safeSignaturePath = safeExistingFilePath(signaturePath, "SIGNATURE");
    safeKeyringPath = safeExistingFilePath(OPERATOR_PUBKEY_KEYRING, "OPERATOR_PUBKEY_KEYRING");
  } catch (error) {
    const violation = logCriticalSovereigntyViolation({
      command: "gpg --no-default-keyring --keyring [operator_pubkey.gpg] --verify [signaturePath] [payloadPath]",
      exit_code: null,
      payload_path: String(payloadPath || ""),
      signature_path: String(signaturePath || ""),
      keyring_path: sourceLabel(OPERATOR_PUBKEY_KEYRING),
      stdout: "",
      stderr: "",
      error: error instanceof Error ? error.message : String(error)
    });
    throw new Error(`CRITICAL_SOVEREIGNTY_VIOLATION: GPG signature verification failed before execution; logged ${violation.event}`);
  }
  const gpgProgram = process.env.GPG_PROGRAM || "gpg";
  const args = [
    "--no-default-keyring",
    "--keyring",
    safeKeyringPath,
    "--verify",
    safeSignaturePath,
    safePayloadPath
  ];

  const result = spawnSync(gpgProgram, args, {
    cwd: SPEAKER_ROOT,
    encoding: "utf8",
    shell: false,
    windowsHide: true
  });

  const exitCode = typeof result.status === "number" ? result.status : 1;
  const stderr = result.stderr || "";
  const stdout = result.stdout || "";
  const command = [gpgProgram, ...args].join(" ");

  if (exitCode === 0 && stderr.includes("Good signature from")) {
    return true;
  }

  const violation = logCriticalSovereigntyViolation({
    command,
    exit_code: exitCode,
    payload_path: sourceLabel(safePayloadPath),
    signature_path: sourceLabel(safeSignaturePath),
    keyring_path: sourceLabel(safeKeyringPath),
    stdout,
    stderr,
    error: result.error ? result.error.message : null
  });

  throw new Error(`CRITICAL_SOVEREIGNTY_VIOLATION: GPG signature verification failed; logged ${violation.event}`);
}
```

## Proof Notes

- `speaker/bin/speakerctl.js` imports `spawnSync`, defines `verifySignature(payloadPath, signaturePath)`, logs failed validation to `speaker/logs/validation.jsonl`, exports `verifySignature`, and exposes `verify-signature --payload [path] --signature [path]`.
- `apply-apoptosis` now calls `verifySignature(approvalPath, approvalSignaturePath)` before computing or writing any status-field mutation.
- Local `node --check` and IDE diagnostics were attempted, but the shell runner returned unknown status for even simple commands and `ReadLints` timed out. No successful runtime proof is claimed in this receipt.

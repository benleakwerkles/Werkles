#!/usr/bin/env bash
set -euo pipefail

PACKET_ID="BIRD_0074_DINK_SALLY_SIGNING_TOOL"
FORMATTER="tinker-sign.sh"
MACHINE="Sally"
SOURCE_AEYE="Ender"

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
SPEAKER_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SPEAKER_DIR/.." && pwd)
SCHEMA_PATH="${SPEAKER_RECEIPT_SCHEMA:-$SPEAKER_DIR/schemas/receipt.schema.json}"
INBOX_DIR="${SPEAKER_RAW_INBOX:-$SPEAKER_DIR/receipts/raw/inbox}"
LOG_DIR="${SPEAKER_LOG_DIR:-$SPEAKER_DIR/logs}"
GPG_BIN="${SPEAKER_GPG_BIN:-}"

usage() {
  cat >&2 <<'USAGE'
Usage:
  bash tinker-sign.sh [path_to_target_file.json]

Creates an armored detached GPG signature using local pinentry/YubiKey flow,
then wraps that signature into a Speaker DECISION receipt in:
  speaker/receipts/raw/inbox/
USAGE
}

if [ "$#" -ne 1 ]; then
  usage
  exit 64
fi

find_gpg() {
  if [ -n "$GPG_BIN" ]; then
    if [ -x "$GPG_BIN" ]; then
      printf '%s\n' "$GPG_BIN"
      return 0
    fi
    echo "ERROR: SPEAKER_GPG_BIN is set but not executable: $GPG_BIN" >&2
    return 1
  fi

  if command -v gpg >/dev/null 2>&1; then
    command -v gpg
    return 0
  fi

  for candidate in \
    "/c/Program Files/Git/usr/bin/gpg.exe" \
    "/c/Program Files/Git/mingw64/bin/gpg.exe" \
    "/c/Program Files/GnuPG/bin/gpg.exe" \
    "/c/Program Files (x86)/GnuPG/bin/gpg.exe"
  do
    if [ -x "$candidate" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  echo "ERROR: gpg is not available. Set SPEAKER_GPG_BIN to the local offline gpg executable." >&2
  return 1
}

TARGET_INPUT=$1
if [ ! -f "$TARGET_INPUT" ]; then
  echo "ERROR: target file not found: $TARGET_INPUT" >&2
  exit 66
fi

TARGET_PATH=$(CDPATH= cd -- "$(dirname -- "$TARGET_INPUT")" && pwd)/$(basename -- "$TARGET_INPUT")
case "$TARGET_PATH" in
  *.json) ;;
  *)
    echo "ERROR: target file must be a .json file: $TARGET_PATH" >&2
    exit 65
    ;;
esac

GPG=$(find_gpg) || exit 69

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node is required to package schema-valid JSON receipts." >&2
  exit 69
fi

mkdir -p "$INBOX_DIR" "$LOG_DIR"

TARGET_BYTES=$(wc -c < "$TARGET_PATH" | tr -d ' ')
if command -v sha256sum >/dev/null 2>&1; then
  TARGET_SHA256=$(sha256sum "$TARGET_PATH" | awk '{print $1}')
else
  TARGET_SHA256=$(node -e "const fs=require('fs'),crypto=require('crypto'); process.stdout.write(crypto.createHash('sha256').update(fs.readFileSync(process.argv[1])).digest('hex'))" "$TARGET_PATH")
fi

REL_TARGET=$(node -e "const path=require('path'); console.log(path.relative(process.argv[2], process.argv[1]).replace(/\\\\/g,'/'))" "$TARGET_PATH" "$REPO_ROOT")

cat <<SUMMARY
Speaker signing request
  target: $REL_TARGET
  bytes:  $TARGET_BYTES
  sha256: $TARGET_SHA256

[TAP YUBIKEY TO SIGN]
SUMMARY

TMP_DIR=$(mktemp -d "${TMPDIR:-/tmp}/tinker-sign.XXXXXX")
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

TEMP_SIG="$TMP_DIR/temporary_sig.asc"

"$GPG" --detach-sign --armor --output "$TEMP_SIG" "$TARGET_PATH"

RECEIPT_PATH=$(
  node - "$TARGET_PATH" "$TEMP_SIG" "$REPO_ROOT" "$INBOX_DIR" "$SCHEMA_PATH" "$PACKET_ID" "$FORMATTER" "$MACHINE" "$SOURCE_AEYE" <<'NODE'
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const [
  targetPath,
  signaturePath,
  repoRoot,
  inboxDir,
  schemaPath,
  packetId,
  formatter,
  machine,
  sourceAeye,
] = process.argv.slice(2);

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function validateNode(value, schema, location, errors) {
  if (!schema || typeof schema !== "object") return;

  if (Object.prototype.hasOwnProperty.call(schema, "const") && value !== schema.const) {
    errors.push(`${location} must equal ${JSON.stringify(schema.const)}`);
    return;
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${location} must be one of ${schema.enum.join(", ")}`);
    return;
  }

  if (schema.type && !matchesType(value, schema.type)) {
    errors.push(`${location} must be ${schema.type}`);
    return;
  }

  if (schema.type === "string") {
    if (schema.minLength && value.length < schema.minLength) {
      errors.push(`${location} must be at least ${schema.minLength} characters`);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${location} must match ${schema.pattern}`);
    }
  }

  if ((schema.type === "integer" || schema.type === "number") && schema.minimum != null && value < schema.minimum) {
    errors.push(`${location} must be >= ${schema.minimum}`);
  }

  if (schema.type === "array") {
    for (let index = 0; index < value.length; index += 1) {
      validateNode(value[index], schema.items || {}, `${location}[${index}]`, errors);
    }
  }

  if (schema.type === "object") {
    for (const key of schema.required || []) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(`${location}.${key} is required`);
      }
    }

    const properties = schema.properties || {};
    for (const [key, child] of Object.entries(properties)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        validateNode(value[key], child, `${location}.${key}`, errors);
      }
    }

    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.prototype.hasOwnProperty.call(properties, key)) {
          errors.push(`${location}.${key} is not allowed`);
        }
      }
    }
  }
}

function matchesType(value, type) {
  if (type === "array") return Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  return typeof value === type;
}

const target = fs.readFileSync(targetPath);
const signature = fs.readFileSync(signaturePath, "utf8");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const targetHash = sha256(target);
const signatureHash = sha256(Buffer.from(signature, "utf8"));
const receiptHash = sha256(Buffer.from(`${targetHash}\n${signatureHash}\n${packetId}\n`, "utf8")).slice(0, 24);
const receipt = {
  receipt_id: `rcpt_ender_${receiptHash}`,
  receipt_type: "DECISION",
  created_at: new Date().toISOString(),
  source: {
    aeye: sourceAeye,
    machine,
    path: rel(targetPath),
    content_sha256: targetHash,
  },
  payload: {
    format: "text",
    body: [
      "OPERATOR_YUBIKEY_SIGNATURE",
      `target_path=${rel(targetPath)}`,
      `target_sha256=${targetHash}`,
      `signature_sha256=${signatureHash}`,
      "",
      signature.trimEnd(),
    ].join("\n"),
    flags: [
      "OPERATOR_APPROVED",
      "YUBIKEY_SIGNED",
      "DETACHED_SIGNATURE",
    ],
  },
  metadata: {
    packet_id: packetId,
    formatter,
    schema_id: schema.$id || "speaker.receipt.schema.v1",
    input_bytes: target.length,
  },
};

const errors = [];
validateNode(receipt, schema, "$", errors);
if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

fs.mkdirSync(inboxDir, { recursive: true });
const receiptPath = path.join(inboxDir, `${receipt.receipt_id}.json`);
fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
process.stdout.write(receiptPath);
NODE
)

echo
echo "SUCCESS: detached signature created through local GPG flow."
echo "SUCCESS: Speaker DECISION receipt written to $RECEIPT_PATH"

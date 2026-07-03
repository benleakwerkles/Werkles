#!/usr/bin/env sh
set -eu

PACKET_ID="BIRD_0072_DINK_SALLY_KEYRING_PIN"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SPEAKER_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
LOCKS_DIR="${SPEAKER_LOCKS_DIR:-$SPEAKER_DIR/LOCKS}"
LOG_DIR="${SPEAKER_LOG_DIR:-$SPEAKER_DIR/logs}"
PUBKEY_ASC="${SPEAKER_OPERATOR_PUBKEY_ASC:-$LOCKS_DIR/operator_pubkey.asc}"
KEYRING="${SPEAKER_OPERATOR_KEYRING:-$LOCKS_DIR/operator_pubkey.gpg}"
LOG_FILE="${SPEAKER_VALIDATION_LOG:-$LOG_DIR/validation.jsonl}"
GNUPG_HOME="${SPEAKER_GNUPGHOME:-$LOCKS_DIR/.gnupg}"
GPG_BIN="${SPEAKER_GPG_BIN:-}"

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

utc_now() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

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

mkdir -p "$LOCKS_DIR" "$LOG_DIR" "$GNUPG_HOME"
chmod 700 "$GNUPG_HOME" 2>/dev/null || true

if [ ! -f "$PUBKEY_ASC" ]; then
  echo "WAITING: local public key file not found: $PUBKEY_ASC" >&2
  echo "Drop the operator-exported ASCII public key at /speaker/LOCKS/operator_pubkey.asc, then rerun this script." >&2
  exit 2
fi

if [ ! -s "$PUBKEY_ASC" ]; then
  echo "ERROR: local public key file is empty: $PUBKEY_ASC" >&2
  exit 3
fi

GPG=$(find_gpg) || exit 4

export GNUPGHOME="$GNUPG_HOME"

"$GPG" --batch --yes \
  --no-default-keyring \
  --keyring "$KEYRING" \
  --import "$PUBKEY_ASC"

FINGERPRINTS=$(
  "$GPG" --batch \
    --no-default-keyring \
    --keyring "$KEYRING" \
    --with-colons \
    --fingerprint \
    --list-keys 2>/dev/null \
    | awk -F: '$1 == "fpr" { print $10 }' \
    | tr '\n' ',' \
    | sed 's/,$//'
)

TIMESTAMP=$(utc_now)
PUBKEY_ASC_JSON=$(json_escape "$PUBKEY_ASC")
KEYRING_JSON=$(json_escape "$KEYRING")
FINGERPRINTS_JSON=$(json_escape "$FINGERPRINTS")

printf '{"timestamp":"%s","status":"SUCCESS","event":"operator_pubkey_imported","packet_id":"%s","source_machine":"Sally","public_key_path":"%s","keyring_path":"%s","fingerprints":"%s","network":"disabled"}\n' \
  "$TIMESTAMP" \
  "$PACKET_ID" \
  "$PUBKEY_ASC_JSON" \
  "$KEYRING_JSON" \
  "$FINGERPRINTS_JSON" >> "$LOG_FILE"

echo "SUCCESS: imported local operator public key into $KEYRING"
echo "SUCCESS: appended validation status to $LOG_FILE"

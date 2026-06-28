#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
SPEAKER_ROOT="${SPEAKER_ROOT:-$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)}"
DEFAULT_REPO="/c/Users/BenLeak/Desktop/github/Werkles"
TARGET_REPO="${GIT_SNAPSHOT_REPO:-$DEFAULT_REPO}"
TEMPLATE_DIR="$SPEAKER_ROOT/bootloader/templates"
OUT_FILE="$TEMPLATE_DIR/CURRENT_REPO_STATE.md"

if [ ! -d "$TARGET_REPO/.git" ]; then
  echo "BLOCKER: target repo is not a Git worktree: $TARGET_REPO" >&2
  exit 10
fi

mkdir -p "$TEMPLATE_DIR"

timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
current_branch="$(git -C "$TARGET_REPO" branch --show-current 2>/dev/null || true)"
head_hash="$(git -C "$TARGET_REPO" rev-parse HEAD 2>/dev/null || true)"
upstream="$(git -C "$TARGET_REPO" rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"

sanitize_remote() {
  sed -E 's#(https?://)[^/@[:space:]]+@#\1REDACTED_CREDENTIAL@#g'
}

write_command_block() {
  title="$1"
  shift
  {
    printf '\n## %s\n\n' "$title"
    printf '```text\n'
    printf '+'
    for arg in "$@"; do
      printf ' %s' "$arg"
    done
    printf '\n'
    "$@" 2>&1 || printf 'COMMAND_EXIT=%s\n' "$?"
    printf '```\n'
  } >> "$OUT_FILE"
}

write_sanitized_remote_block() {
  {
    printf '\n## git remote -v\n\n'
    printf '```text\n'
    printf '+ git -C %s remote -v\n' "$TARGET_REPO"
    git -C "$TARGET_REPO" remote -v 2>&1 | sanitize_remote || printf 'COMMAND_EXIT=%s\n' "$?"
    printf '```\n'
  } >> "$OUT_FILE"
}

cat > "$OUT_FILE" <<EOF
# CURRENT REPO STATE

SNAPSHOT_ID: GIT_SNAPSHOT_${timestamp}
GENERATED_AT: ${timestamp}
PRODUCER: Swanson@Doss
SOURCE: local git clone
TARGET_REPO: ${TARGET_REPO}
CURRENT_BRANCH: ${current_branch:-UNKNOWN}
HEAD: ${head_hash:-UNKNOWN}
UPSTREAM: ${upstream:-NONE}
SECRET_POLICY: remote URLs are sanitized for embedded credentials; no PATs or SSH private keys are written.

EOF

write_sanitized_remote_block
write_command_block "git branch -a" git -C "$TARGET_REPO" branch -a
write_command_block "git log -n 5 --oneline" git -C "$TARGET_REPO" log -n 5 --oneline
write_command_block "git status --short" git -C "$TARGET_REPO" status --short

{
  printf '\n## Bootloader Note\n\n'
  printf 'This file is static context for Skybro. It is not GitHub login, not a token, and not proof of canonical promotion.\n'
} >> "$OUT_FILE"

printf 'ARTIFACT git snapshot written\n'
printf 'path=%s\n' "$OUT_FILE"
if command -v sha256sum >/dev/null 2>&1; then
  printf 'sha256=%s\n' "$(sha256sum "$OUT_FILE" | awk '{print toupper($1)}')"
fi

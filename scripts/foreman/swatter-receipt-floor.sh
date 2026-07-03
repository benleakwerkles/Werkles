#!/usr/bin/env sh
set -eu

RECEIPT_PATTERN='(Receipt_ID|RECEIPT_ID|receipt_id|receipt_[0-9]{8,}|td_command_receipt_[0-9]{8,}|RECEIPT_[A-Za-z0-9_-]+)'

staged_files="$(git diff --cached --name-only --diff-filter=ACMR)"

if [ -z "$staged_files" ]; then
  exit 0
fi

if printf '%s\n' "$staged_files" | grep -Eiq '(^|/)(foreman/receipts|tinkerden/receipts)/|RECEIPT.*\.(md|json)$'; then
  exit 0
fi

if git diff --cached -U0 --no-ext-diff -- "$@" | grep -Eiq "$RECEIPT_PATTERN"; then
  exit 0
fi

printf '%s\n' "SWATTER INTERCEPT: No receipt found. Cannot commit un-ledgered work."
exit 1

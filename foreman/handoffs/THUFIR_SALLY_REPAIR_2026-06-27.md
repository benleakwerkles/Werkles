# Thufir Sally Repair 2026-06-27

TARGET: Thufir@Sally

LOCAL MAPPING: Thufir is the local Perplexity node/process group on Sally.

## Diagnosis

- Sally was under hard resource pressure: available memory was about 0.42-0.54 GB and CPU reported 100%.
- Perplexity had seven running processes, including renderer/GPU processes with high accumulated CPU.
- Perplexity profile cache was large for this machine: `Cache` about 383 MB, with additional code/service-worker/GPU caches.
- Git Bash and GPG were installed, but Ben's user PATH did not include `C:\Program Files\Git\bin` or `C:\Program Files\Git\usr\bin`.

## Repair Actions

- Stopped the Perplexity process group.
- Rotated only Perplexity cache directories into `C:\Users\benle\AppData\Roaming\Perplexity\cache_backup_20260627_182222`.
- Preserved Perplexity auth/session-bearing locations such as Local Storage, IndexedDB, Preferences, and config files.
- Relaunched Perplexity with GPU disabled for this run.
- Added `C:\Program Files\Git\bin` and `C:\Program Files\Git\usr\bin` to Ben's user PATH.
- Broadcast a Windows environment change notification.
- Patched `speaker/bin/import_operator.sh` and `speaker/bin/tinker-sign.sh` so they resolve local offline GPG through `SPEAKER_GPG_BIN`, PATH, or Sally's Git-installed GPG fallback.

## Verification

PASS:

- Perplexity relaunched with a visible `Perplexity` window.
- Perplexity processes reported `Responding=True` after a stability wait.
- Live Perplexity CPU sample was low after repair.
- `node receipt_formatter.js --scan` generated the Thufir receipt.
- `node receipt_formatter.js --validate speaker/receipts/raw/inbox/rcpt_thufir_6aa922cec64f6e6b08f52c09.json` passed.
- `node sally_circulator.js --self-test` passed.
- `C:\Program Files\Git\usr\bin\gpg.exe --version` returned `gpg (GnuPG) 2.4.9`.
- `speaker/bin/import_operator.sh` and `speaker/bin/tinker-sign.sh` parse under Git Bash.
- `speaker/bin/import_operator.sh` reaches the local key import flow and waits correctly for `speaker/LOCKS/operator_pubkey.asc`.

## Remaining Host Pressure

- Sally still has low available memory.
- Defender/SearchIndexer/System remained active CPU consumers after Perplexity was repaired.
- Existing Codex-launched shells do not automatically reload the updated user PATH; newly launched user processes should inherit it after the environment broadcast or normal app restart.

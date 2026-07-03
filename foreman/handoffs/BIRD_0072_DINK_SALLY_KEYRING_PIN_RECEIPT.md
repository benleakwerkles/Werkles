# BIRD_0072 Dink Sally Keyring Pin Receipt

PACKET_ID: BIRD_0072_DINK_SALLY_KEYRING_PIN

TO: Dink@Sally

STREAM: BUILD / VALIDATION INFRASTRUCTURE

## ARTIFACT

- `speaker/bin/import_operator.sh`

## FILES

- `speaker/bin/import_operator.sh` - offline-only local operator public-key import script.
- `speaker/LOCKS/.gitignore` - keeps dropped key material and compiled keyrings local by default.

## BEHAVIOR

- Uses repo-local `speaker/LOCKS/operator_pubkey.asc` as the only input public key source.
- Compiles the local keyring with `gpg --no-default-keyring --keyring speaker/LOCKS/operator_pubkey.gpg --import speaker/LOCKS/operator_pubkey.asc`.
- Appends a success record to `speaker/logs/validation.jsonl` only after the local GPG import succeeds.
- Does not call keyservers, `curl`, `wget`, `ssh`, or any network lookup path.

## VERIFICATION

PASS:

- `speaker/LOCKS/`, `speaker/bin/`, and `speaker/logs/` exist locally.
- Static script scan found no keyserver, hkps, curl, wget, ssh, or fetch path.
- The script is staged at `speaker/bin/import_operator.sh`.

## BLOCKERS

- `gpg` is not discoverable in the current shell, so no live import was attempted.
- `speaker/LOCKS/operator_pubkey.asc` is not present yet; the operator must physically export and drop it before the script can append a success line to `speaker/logs/validation.jsonl`.

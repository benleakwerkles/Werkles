# BIRD_0074 Dink Sally Signing Tool Receipt

PACKET_ID: BIRD_0074_DINK_SALLY_SIGNING_TOOL

TO: Dink@Sally

STREAM: BUILD / OPERATOR INTERFACE

## ARTIFACT

- `speaker/bin/tinker-sign.sh`

## FILES

- `speaker/bin/tinker-sign.sh` - local bash signing utility for JSON payloads.
- `speaker/schemas/receipt.schema.json` - broadened metadata contract so `tinker-sign.sh` can emit schema-valid Speaker receipts.

## BEHAVIOR

- Accepts exactly one argument: `bash speaker/bin/tinker-sign.sh [path_to_target_file.json]`.
- Prints target path, byte count, and SHA-256 before signing.
- Prompts `[TAP YUBIKEY TO SIGN]`.
- Runs `gpg --detach-sign --armor --output temporary_sig.asc [target]` through the local GPG/pinentry path.
- Does not store or request Ben's passphrase.
- Packages the armored detached signature into a `DECISION` receipt and writes it to `speaker/receipts/raw/inbox/`.

## VERIFICATION

PASS:

- Script is staged at `speaker/bin/tinker-sign.sh`.
- Static scan found no passphrase caching and no keyserver/network fetch path.

## BLOCKERS

- Live YubiKey signing was not attempted because operator tap/passphrase entry is a human gate.
- `gpg` and `bash` are not discoverable from the current PowerShell PATH, so only static artifact verification was performed here.

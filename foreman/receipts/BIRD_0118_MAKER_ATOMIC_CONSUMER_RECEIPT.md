# BIRD_0118_MAKER_ATOMIC_CONSUMER Receipt

Timestamp: 2026-06-27T18:20:00-04:00
Destination: Speaker / Bootloader

## FILES

- `speaker/bin/speakerctl.js`
- `speaker/bootloader/incoming/APPLY_PAYLOAD_PROOF.txt`
- `foreman/receipts/BIRD_0118_MAKER_ATOMIC_CONSUMER_RECEIPT.md`

## IMPLEMENTATION

- Added `apply-payload --target [destination_path]` to consume `speaker/bootloader/incoming/RAW_PAYLOAD.txt`.
- Added sandbox path validation for `speaker` and `tinkarden` roots, including the canonical local roots `C:\speaker` and `C:\tinkarden`.
- Outside-boundary writes hard-fail with `CRITICAL_PATH_VIOLATION: Attempted write outside sandbox boundaries.` and exit code `1`.
- Writes are staged through a same-directory `.tmp` file, existing targets are preserved as `.backup`, and the temp file is promoted with `fs.renameSync`.

## PROOF

- `node --check speaker/bin/speakerctl.js` returned syntax OK.
- `node speaker/bin/speakerctl.js apply-payload --target speaker/bootloader/incoming/APPLY_PAYLOAD_PROOF.txt` returned `RAW_PAYLOAD_APPLIED`.
- `APPLY_PAYLOAD_PROOF.txt` matched `RAW_PAYLOAD.txt` byte-for-byte in the PowerShell proof.
- Reapplying to the same target produced `APPLY_PAYLOAD_PROOF.txt.1782599031231_42216.backup`.
- Applying to `..\OUTSIDE_APPLY_PAYLOAD_PROOF.txt` emitted `CRITICAL_PATH_VIOLATION: Attempted write outside sandbox boundaries.` and exited `1`.
- `ReadLints` reported no linter errors for `speaker/bin/speakerctl.js`.

## PASS/FAIL

PASS.

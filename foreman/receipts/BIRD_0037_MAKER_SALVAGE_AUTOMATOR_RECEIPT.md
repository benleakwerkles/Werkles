# BIRD_0037 Maker Salvage Automator Receipt

PACKET_ID: BIRD_0037_MAKER_SALVAGE_AUTOMATOR
TO: Maker@Betsy
STREAM: INFRASTRUCTURE / NERVOUS SYSTEM
STATUS: ARTIFACT
RECEIPT_ID: RECEIPT_BIRD_0037_MAKER_SALVAGE_AUTOMATOR_20260627
TIMESTAMP: 2026-06-27T20:45:38Z

## Artifact

Built the branch-reality salvage automator:

- `tinkarden/nervous_system/salvage_protocol.js`

Wired `shadow_merge` to invoke the salvage protocol:

- `tinkarden/server/index.js`

The protocol:

- Generates tracked diff, status inventory, log snapshot, and Thufir validation request in `tinkarden/intake/salvage_queue/`.
- Pushes the current branch to `origin` with `git push -u origin <branch>:<branch>`.
- Rejects force push arguments in its internal git runner.
- Does not perform final canonical merges.
- Provides an `abandon` command that moves matching salvage files into `tinkarden/intake/salvage_queue/graveyard/`.

## Direct Terminal Proof

Command:

```text
node tinkarden/nervous_system/salvage_protocol.js capture --trigger terminal-proof --shadow-id BIRD_0037_PROOF --receipt-id RECEIPT_BIRD_0037_TERMINAL_PROOF
```

Output excerpt:

```json
{
  "ok": true,
  "status": "SALVAGE_CAPTURED_AND_PUSHED",
  "inventory": {
    "packet_id": "salvage_20260627204400_preserve-tinkerden-packet-engine-20260622",
    "branch": "preserve/tinkerden-packet-engine-20260622",
    "head": "88d261d",
    "diff_path": "tinkarden/intake/salvage_queue/salvage_20260627204400_preserve-tinkerden-packet-engine-20260622.diff",
    "request_path": "tinkarden/intake/salvage_queue/salvage_20260627204400_preserve-tinkerden-packet-engine-20260622.THUFIR_VALIDATION_REQUEST.md",
    "untracked_count": 627
  },
  "push": {
    "attempted": true,
    "forced": false,
    "command": "git push -u origin preserve/tinkerden-packet-engine-20260622:preserve/tinkerden-packet-engine-20260622",
    "ok": true,
    "exit_code": 0
  }
}
```

Remote proof:

```text
* [new branch] preserve/tinkerden-packet-engine-20260622 -> preserve/tinkerden-packet-engine-20260622
branch 'preserve/tinkerden-packet-engine-20260622' set up to track 'origin/preserve/tinkerden-packet-engine-20260622'.
```

## Shadow Merge Trigger Proof

After restarting the local backend, a real `shadow_merge` call returned:

```json
{
  "ok": true,
  "status": "SHADOW_MERGED_WITH_RECEIPT",
  "receipt_id": "receipt_20260627204538_ea893830",
  "shadow_id": "shadow_20260627204538_70c756f1",
  "salvage_protocol": {
    "ok": true,
    "status": "SALVAGE_CAPTURED_AND_PUSHED",
    "inventory": {
      "packet_id": "salvage_20260627204538_preserve-tinkerden-packet-engine-20260622",
      "diff_path": "tinkarden/intake/salvage_queue/salvage_20260627204538_preserve-tinkerden-packet-engine-20260622.diff",
      "request_path": "tinkarden/intake/salvage_queue/salvage_20260627204538_preserve-tinkerden-packet-engine-20260622.THUFIR_VALIDATION_REQUEST.md",
      "untracked_count": 632
    },
    "push": {
      "attempted": true,
      "forced": false,
      "command": "git push -u origin preserve/tinkerden-packet-engine-20260622:preserve/tinkerden-packet-engine-20260622",
      "ok": true,
      "stderr": "Everything up-to-date"
    }
  }
}
```

## Thufir Validation Request Proof

Generated request:

```text
tinkarden/intake/salvage_queue/salvage_20260627204400_preserve-tinkerden-packet-engine-20260622.THUFIR_VALIDATION_REQUEST.md
```

It asks Thufir to validate the branch inventory before canonical merge or branch deletion and explicitly says not to approve canonical merge without Operator signature.

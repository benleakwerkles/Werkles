# TinkerDen Machine Runner

Betsy-only V0 runner for TinkerDen Workspace Relay.

## Commands

```powershell
npm --prefix tools/tinkerden_machine_runner run serve
npm --prefix tools/tinkerden_machine_runner run self-test
```

The TinkerDen API can also invoke the runner in one-shot mode, so Ben does not need to manually start the daemon for the Betsy V0 proof.

## What It Does

1. Receives a packet addressed to the local machine.
2. Writes the packet into `tinkerden/machine-runner/inbox/Betsy`.
3. Sets the local clipboard to the packet text.
4. Launches or focuses the configured PowerToys Workspace target.
5. Writes a receipt under `data/tinkerden/receipts`.
6. Appends receipt pickup and organism event JSONL records.

## What It Does Not Do

- No auto-send.
- No browser credential control.
- No account automation.
- No cross-machine routing in V0.

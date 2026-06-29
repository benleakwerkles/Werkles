# Swanson Relay Build Snapshot 2026-06-29

This folder preserves the Swanson@Doss Relay Build for GitHub review and ThinkIt merge work.

## Official Naming

- Incoming command dash: Feral Membrane Main Dash
- Incoming command dash owner: Dink@Betsy
- Relay module: Swanson Relay Build
- Relay owner: Swanson@Doss
- Merged main surface name: ThinkIt

## Purpose

This is an auditable GitHub snapshot of the working relay layer, prepared for merger with the Feral Membrane Main Dash.

It is not a blind runtime merge.
It is not a claim that every copied implementation file should be dropped into main unchanged.
It is a source-truth reference folder containing the contract, handoff, implementation snapshot, and receipts needed to merge ThinkIt without losing relay proof behavior.

## Key Contract

ThinkIt may use Relay Build as transport only if the UI preserves this chain:

button click -> packet created -> queued/sent -> RECEIVED -> COMPLETED/BLOCKER -> answer returned to origin dash

Created, queued, sent, or file-inbox placement is not success.

## Contents

- `contracts/THINKIT_RELAY_MERGE_CONTRACT.json` - machine-readable integration contract.
- `contracts/THINKIT_RELAY_MERGE_HANDOFF.md` - human-readable merge handoff.
- `contracts/source_truth_pointers.json` - source-truth/book pointer lock used by Brainboot.
- `implementation/tinkarden_server_index.js` - live Relay Dash server implementation snapshot from `C:\tinkarden`.
- `implementation/speakerctl.js` - Speaker/Brainboot implementation snapshot from `C:\speaker`.
- `receipts/` - durable Swanson receipts for the source pointer and ThinkIt relay merge prep.
- `MANIFEST.json` - file hashes and byte counts for this folder.

## Merge Caution

Use the contract first. Pull implementation functions selectively.

The original live runtime was split across non-repo `C:\tinkarden` and local `C:\speaker` surfaces, so this folder exists to make the work reviewable on GitHub without pushing dirty runtime trees wholesale.


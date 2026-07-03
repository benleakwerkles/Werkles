# Organism Frontier

Status: CURRENT RULES SEED
Owner: TinkerDen / Nervous System
Source Packet: BIRD_0034_MAKER_CONTEXT_BOOTLOADER

## Current Rule

HALT PERIPHERAL BUILD until the nervous system can load memory on boot.

The active frontier is to make the Aeyes ingest the Book, the current doctrine, shared frontier state, and Wormeyes reality without Ben uploading context manually.

## Current Construction Lane

- Build `tinkarden/nervous_system/bootloader.js`.
- Compile raw context into `tinkarden/nervous_system/active_context.txt`.
- Keep `shared_frontier.json` as the Corpus Callosum state.
- Keep `world_state.json` as the Wormeyes physical reality sensor.
- Let `aeye_client.js` call the bootloader before provider calls.

## Boundary

This file is raw source for the bootloader. The bootloader may concatenate it, label it, and report byte counts. The bootloader must not summarize it.

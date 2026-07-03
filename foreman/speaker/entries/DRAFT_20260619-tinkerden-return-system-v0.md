---
id: DRAFT_20260619-tinkerden-return-system-v0
status: DRAFT
title: TinkerDen Return System V0
created_at: 2026-06-19
source_notes:
  - app/tinkerden/page.tsx
  - app/tinkerden/tinkerden-return-client.tsx
  - app/api/tinkerden/return-system/route.ts
  - lib/tinkerden-return-system-v0/store.ts
  - foreman/soledash/tinkerden-return-system-v0/state.json
tags:
  - tinkerden
  - receipt
  - return-loop
  - speaker
warning_triggers:
  - packet without receipt
  - aeye handoff disappears
  - receipt not assimilated
related_entries:
  - DRAFT_20260608-thread-registry
---

## Event

Maker built TINKERDEN_RETURN_SYSTEM_V0 on Betsy.

## Context

Ben required TinkerDen Inbox, Packet Ledger, Receipt Drawer, Assimilation Queue, and Missing Receipt Watchdog so packets sent to Bean, Ender, Maker, Dink, Skybro, or Thufir cannot disappear.

## Decision

Create a file-backed return system with a visible `/tinkerden` page, API actions, packet status machine, receipt format, assimilation format, and watchdog.

## Why it happened

The existing TinkerDen packet launcher could prove a packet was written, but the return path needed a first-class organ: outbound packet, awaiting receipt, returned receipt, assimilation queue, and missing receipt escalation.

## Risk exposed

A packet without a required return destination, reviewer, receipt requirement, and assimilation destination can become invisible work.

## Lesson learned

Every Aeye handoff needs a receipt drawer and assimilation lane before it can be trusted as real work.

## Doctrine changed

none

## Who must remember

Maker, Bean, Ender, Dink, Skybro, Thufir, TinkerDen, Speaker, and SoleDash.

## Future warning

If a packet is SENT or WORKING without a receipt, the watchdog must mark MISSING_RECEIPT instead of letting the work vanish.

## Source artifacts

- `app/tinkerden/page.tsx`
- `app/tinkerden/tinkerden-return-client.tsx`
- `app/api/tinkerden/return-system/route.ts`
- `lib/tinkerden-return-system-v0/types.ts`
- `lib/tinkerden-return-system-v0/store.ts`
- `foreman/soledash/tinkerden-return-system-v0/state.json`

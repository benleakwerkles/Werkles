---
id: DRAFT_20260608-thread-registry
status: DRAFT
title: Thread Registry — Courier Is Blind Without Thread Identity
created_at: 2026-06-08
source_notes:
  - foreman/speaker/GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0.md
  - foreman/crew-dispatch/RELAY_COURIER_LOG.md
tags:
  - relay
  - courier
  - thread-registry
warning_triggers:
  - relay courier
  - wrong tab
  - packet to wrong thread
related_entries:
  - DRAFT_20260608-gd-command-console
---

## Event

GD knew intent and Courier knew tab index, but nobody knew canonical thread identity — packets landed in wrong or bloated chats.

## Context

Relay Courier prepares paste but cannot reliably deliver to the correct Aeye thread without registry.

## Decision

Thread Registry and Speaker are both required — registry for *where*, Speaker for *why*.

## Why it happened

Chat platforms have no repo-native thread ID; Ben was the implicit registry.

## Risk exposed

Accurate delivery of shallow context. Critical causal context still lost.

## Lesson learned

Thread Registry without Speaker = shallow delivery. Speaker without Registry = wisdom Ben still mules. Build registry before trusting automatic courier.

## Doctrine changed

Courier documented as blind hand until thread identity exists — not doctrine authority.

## Who must remember

Relay Courier, GD router, Ben (Operator gates Send).

## Future warning

Interrupt when auto-send is proposed, or when relay "works" but wrong cousin thread receives packet.

## Source artifacts

- `foreman/crew-dispatch/RELAY_COURIER_LOG.md`

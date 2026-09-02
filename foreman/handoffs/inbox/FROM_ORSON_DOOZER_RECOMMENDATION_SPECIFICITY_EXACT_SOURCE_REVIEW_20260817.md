# Orson/Doozer — Recommendation specificity exact-source review

Date: 2026-08-17
Response message: `62bf52ad-03ad-4634-94ec-0035fbe0c165`
Personal review: yes
Subagents used: none
Source files received: `5/5`
Repaired hashes independently matched: `UNABLE_TO_COMPUTE`
Ruling: `BLOCKER`
Member-facing ready: `NO`

## Findings

Files 2–5 independently decoded to their declared byte lengths and SHA-256
hashes. File 1 was fully source-inspected, but the reviewer declined to claim
aggregate hash confirmation because its prior-turn Base64 payload was not
independently recomputed.

The repaired presentation is materially better and bounded. It supplies one
why, one caution, and one next action; does not launder the headline as fit;
keeps fixed non-promissory fallbacks; preserves detailed reasoning and evidence;
and adds no account, profile, provider, routing, custody, or governance surface.

The remaining blocker is incomplete screening of internal gate language.
Singular space-separated patterns are rejected, but these variants can still
reach the prominent member-facing summary:

```text
Gate 05 must pass before this option can proceed.
Release gate is still pending.
Human gates remain.
Verification-gate pending.
Support-band
Support
band
```

The current hostile fixture combines banned markers, so it does not prove each
variant is rejected independently.

## Required repair

Normalize candidate text for screening without changing returned display text.
Reject gate jargon and separator variants, including each example above. Add
isolated hostile assertions so every variant independently causes the fixed
fallback. No other contract-level defect was identified.

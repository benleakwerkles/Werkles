# Orson/Doozer — Recommendation specificity second-repair review

Date: 2026-08-17
Response message: `6d4dccb8-1a50-4b85-981c-8bce4acd62d4`
Personal review: yes
Subagents used: none
Changed source files received: `3/3`
Second-repair hashes matched: `NO`
Ruling: `BLOCKER`
Member-facing ready: `NO`

## Findings

The selector and hostile-test files matched their declared exact hashes. The
specificity smoke's readable source matched its declared hash, but the relayed
Base64 decoded to different, syntactically invalid bytes at one offset.

The named gate/separator bypasses are substantively closed. NFKC screening,
separator normalization, and isolated cases cover numbered, release, plural,
hyphenated, repeated-space, and line-break variants.

The normalization also introduced a regression: underscores are removed before
the existing snake-case pattern runs, so `sandbox_pending` alone can pass the
screen. The existing compound fixture hides this because other banned phrases
reject the same string.

## Required repair

- Preserve snake-case detection before underscore replacement, or use separate
  raw-token and separator-normalized screening passes.
- Add `sandbox_pending` as an isolated rationale/counterpoint/next-step attack.
- Re-relay the specificity smoke with exact bytes matching its readable source
  and declared hash.

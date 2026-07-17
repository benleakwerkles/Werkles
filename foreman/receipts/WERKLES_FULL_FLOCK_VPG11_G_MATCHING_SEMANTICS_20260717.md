# Werkles Full Flock VPG11 — G Receipt: Matching Interaction Semantics

Status: `COMPLETED`
Machine: `Betsy`
Product commit: `2025613f38dab055e7f75f8142714ffeac25f8a0`
Branch: `codex/werkles-full-flock-vpg11-20260717`
Production: untouched

## Idea 1 — connect Bellows help without per-keystroke noise

- every intake textarea now describes its visible hint and character count through stable IDs
- counters remain visibly current but are no longer live regions
- typing changed `0/600` to `4/600` in browser proof without issuing a closed-action POST

## Idea 2 — use native chooser state and explicit detail relationships

- replaced incomplete tab semantics with ordinary pressed buttons in a named group
- both view buttons control the existing recommendation collection
- selected recommendation cards expose pressed state, descriptive metadata, and the stable detail-region ID
- a concise status reports the selected title
- Space-key selection moved exactly one pressed state and kept all save actions closed

## Safety infrastructure

- the mutating shadow smoke harness no longer probes or infers a target
- `WERKLES_SITE_ORIGIN` is required
- `werkles.com` and `www.werkles.com` are rejected unless the exact deliberate mutation override is present
- focused guard proof resolved all unsafe cases with fetch count `0`

## Gates

- focused VPG11 static contract: PASS
- focused VPG11 browser proof: PASS
- VPG6, VPG8, VPG10 UI, member-trust, and signal-trust regressions: PASS
- TypeScript: PASS
- optimized Next.js build: PASS (81 static pages generated)
- both public intake flags: false
- Production mutation: none

Return: `COMPLETED`

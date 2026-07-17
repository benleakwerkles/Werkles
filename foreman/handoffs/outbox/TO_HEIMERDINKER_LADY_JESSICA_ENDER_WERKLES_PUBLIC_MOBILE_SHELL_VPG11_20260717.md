# TO HEIMERDINKER / LADY JESSICA / ENDER — Werkles Public Mobile Shell VPG11

Packet: `TO_HEIMERDINKER_LADY_JESSICA_ENDER_WERKLES_PUBLIC_MOBILE_SHELL_VPG11_20260717`
Status: `OPEN`
Primary seats: `Dink@Betsy`, `LadyJessica@Betsy`, and `Ender@Betsy`
Execution, integration, commit, and scoped push owner: Heimerdinker
Repository: `benleakwerkles/Werkles`
Working branch: `codex/werkles-full-flock-vpg11-20260717`
Starting source: `29e468ed6b069202a98d727e28c8429c818b6755`
Production boundary: Preview only. No Production deploy, alias, flag, schema, secret, or member-data mutation.

## Mission

Repair the existing public shell at phone widths without redesigning Werkles or inventing a navigation system. The VPG10 visual proof showed the global SiteHeader compressing and overlapping at 320 CSS pixels. Find and execute the two smallest shell changes that make the current routes readable, tappable, and stable.

## VPG VERIFY

- Inspect `SiteHeader`, its global CSS, and the current 320/390/640/1440 behavior.
- Check `/`, `/discovery`, `/bellows/intake`, and `/bellows/recommendations` for overlap, clipped text, horizontal overflow, focus order, and touch-target size.
- Separate global shell defects from route-local layout defects.
- Preserve existing destinations, branding, and Production boundaries.

## VPG PREPARE

- Return no more than four ranked, bounded candidates with exact files, observable benefit, regression risk, and browser proof.
- Prefer CSS and existing markup over a new menu, state machine, dependency, or component hierarchy.
- Treat 320px collision and keyboard access as defects, not aesthetic expansion.

## VPG GO

Heimerdinker selects and executes the two strongest ideas. Lady Jessica and Ender return independent member-facing and accessibility readbacks; they do not become competing writers or pushers.

## Acceptance

- logo, sign-in, and primary action do not overlap at 320px
- current primary destinations remain available and understandable
- no body/root horizontal overflow at 320, 390, 640, or 1440px
- touch targets and visible focus remain usable
- home, Discovery, Bellows intake, and recommendations retain their current meaning
- focused regression proof, TypeScript, build, protected Preview browser checks, and durable receipts
- no new navigation architecture and no Production mutation

## Return contract

Return `COMPLETED` with ranked findings and exact evidence, or a specific `BLOCKER`. `OPENED` and `CLAIMED` are not completion.

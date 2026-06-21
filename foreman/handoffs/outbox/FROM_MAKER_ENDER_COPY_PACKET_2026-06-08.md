# From Maker — Ender-Directed Site Copy Implementation

## Source packet
`TO_MAKER_ENDER_COPY_PACKET_2026-06-08.md` (received from Operator path `c:\Users\benle\Documents\Werkles\foreman\handoffs\outbox\`)

## Status
**Local copy implemented.** Draft copy only — not promoted to approved public status.

## Files changed
- `lib/copy.ts` — central copy constants (hero, reveal, forge, foundry, proof, crucible, membership, billing, workbench, squibb, nav)
- `lib/hero-copy-variants.ts` — hero headline aligned to Act I packet
- `lib/crucible.ts` — crucible trust lines
- `lib/narrative-arc.ts` — Foundry act lede/headline on `/proof`
- `components/foundry/hero-copy-block.tsx`
- `components/foundry/hero-static.tsx`
- `components/foundry/site-header.tsx` — Sign in label
- `components/foundry/workshop-trust-rail.tsx` — Act II reveal section + Squibb default
- `components/foundry/lanes-documentary-section.tsx` — potential framing
- `components/narrative/proof-doctrine-section.tsx` — proof page checklist + CTAs
- `components/crucible/crucible-panel.tsx` — crucible intro, workflow states, Squibb hint
- `app/page.tsx` — forge/foundry ops cards, CTAs
- `app/proof/page.tsx` — footer disclaimers
- `app/dashboard/crucible/page.tsx` — nav labels (Workbench, Dues, Billing)
- `app/membership/page.tsx` — Foundry page copy, unlocks list, Squibb
- `app/membership/success/page.tsx` — threshold/success copy + Next.js 15 searchParams fix
- `app/dashboard/billing/page.tsx` — dues/billing copy, action labels, Squibb
- `index.html` — static workbench nav, hero, profile labels, discovery framing
- `app.js` — potential language, empty states, disclaimer, matching reason strings

## Copy surfaces updated
| Surface | Packet section | Notes |
|---------|----------------|-------|
| Home hero | Act I Spark | Eyebrow, H1, body, CTAs |
| Reveal rail | Act II Reveal | Thought/reveal pairs + Squibb default |
| Trust fold / ops cards | Act III–IV | Forge + Foundry cards on home |
| `/proof` | Proof page | Checklist, disclaimers, crucible CTAs |
| `/dashboard/crucible` | Crucible page | Principle, workflow state cards, Squibb |
| `/membership` | Foundry page | Dues framing, unlocks, disclaimer |
| `/membership/success` | Success page | Threshold copy, Squibb earned line |
| `/dashboard/billing` | Billing page | Dues summary, disabled gate copy |
| Static workbench | index.html + app.js | Discover/Intros/Proof nav, Runway label, potential language |

## Voice rules applied
- Replaced visible **fit** / **compatibility** framing with **potential** / **runway** where touched
- Avoided **dossier** in updated visible copy paths
- Kept accurate **preview / disabled / counsel review** language on gated surfaces

## Checks performed
```text
npm run typecheck  — PASS
npm run build      — PASS
node --check app.js — PASS
```

## Human gates encountered
None triggered during implementation. Still required before:
- Final creative direction approval (Ben / BLD-family)
- Promotion of draft copy to approved or published status
- Deploy, push, release, or public launch
- Stripe, billing, OAuth, provider, credential, or secret work
- Counsel/legal approval for live proof/background flows

## Next suggested slice
1. Ben review on localhost (`npm run dev`) — hero four-act read-through Spark → Foundry
2. Skybro arc coherence pass on narrative act pages (`/spark` … `/proof`)
3. Bean trust-surface audit if payment or verification copy changes ship beyond preview
4. Wire `home.foundry.priceLine` with live `{price}` token on membership card when billing gate opens

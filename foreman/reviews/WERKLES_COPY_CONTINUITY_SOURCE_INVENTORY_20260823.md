# Werkles Copy Continuity — Source Inventory

Date: 2026-08-23  
State: `LOCAL_SOURCE_PULL__NOT_A_COPY_VERDICT`

This is the Foreman's starting inventory for the BVPGM copy rotation. Counts
include source identifiers and conditional states; they do not prove that every
hit is visible to a member or defective.

## Broad continuity model

| Workstream | Core question | Primary routes/sources |
|---|---|---|
| Navigation and lifecycle | Does the same noun mean the same place and consequence everywhere? | Header/shell, dashboard, Workshop, Match Deck, Formation, Bellows, Crucible, Membership |
| Conversation | Would an ordinary person say this, and does the reply demonstrate understanding rather than echo? | Intake, Recommendations, intros, matching dialogue, Formation |
| Value | Does the page do useful work and explain why the person should return? | Recommendations, Public Bellows, Personal Bellows, Workshop/Werkle tools |
| Trust | Is precision preserved without making members read internal architecture? | Login, Signup, Profile custody, Membership/Billing, Crucible/providers |
| Action continuity | Do labels predict destination, saved state, cost, and reversibility? | Buttons, disclosures, save/copy actions, return paths, status regions |

## First source scan

Across non-operator `app/**/*.tsx` and `components/**/*.tsx` sources after
excluding TinkerDen, ThinkIt, Nerdkle, draft-review, and GD control surfaces:

```text
runway: 0
pitch deck: 0
local browser: 0
artifact: 174
packet: 191
Operator: 156
sandbox: 6
preview: 278
provider: 83
```

The zero counts show earlier cleanup is working for three repeatedly rejected
phrases. The larger counts are triage leads, not automatic replacements: many
are component/type names or honest unavailable-state branches. Ender and Bean
must distinguish member-visible clutter from necessary trust language.

## Highest-density member surfaces to walk first

1. `app/membership/page.tsx`
2. `components/crucible/crucible-panel.tsx`
3. `app/login/page.tsx`
4. `app/signup/page.tsx`
5. `components/bellows/bellows-device-draft-shelf.tsx`
6. `components/squibb/recommendation-work-path.tsx`
7. `components/foundry/bellows-home-preview.tsx`
8. `app/dashboard/billing/page.tsx`
9. `components/crucible/ghost-provider-walkthrough.tsx`
10. `components/crucible/verification-card.tsx`
11. `components/squibb/recommendation-surface.tsx`
12. `components/squibb/concierge-intake-form.tsx`
13. `components/bellows/account-aware-personal-bellows.tsx`
14. `app/dashboard/member-dashboard-client.tsx`
15. `components/workshop/ghost-werkle-preview.tsx`

## Core noun invariants under review

- **Workshop:** one person's private working space.
- **Werkle:** shared work two or more members explicitly accept together.
- **Match Deck:** possible collaborators and visible fit reasons, never a
  wealth/virtue leaderboard.
- **Public Bellows:** the general library.
- **Personal Bellows:** material and working tools shaped by the member's own
  saved work.
- **Crucible:** optional narrow checks, not generic trust.
- **Membership:** access/billing state, never a proof signal.

No member-visible copy is changed by this inventory. The actual Ender, Skybro,
Bean, Computer, and later Lady Jessica receipts determine the bounded patch.

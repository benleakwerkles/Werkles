# Receipt — CBCC receipts consumed, Recommendation View rebuilt to spec

Execution context: `LOCAL_SALLY_WINDOWS`
Date: 2026-08-03
Foreman: Lady Jessica (VPGM)
Operator prompt that triggered this: "Why aren't you using PGM, taking in receipts from your CBCC?"

## The finding

Ten cousin receipts had been sitting unread in `foreman/handoffs/inbox/` since 2026-07-03.

`node foreman/crew-dispatch/crew-response-intake.mjs validate` fails all nine parseable
files. Seven are missing every required metadata field; two — the two that mattered most —
have no `## Relay metadata` block at all. `processInbox` halts on any validation failure,
so the pipeline silently moved nothing for a month and raised no alarm.

Unread receipts that were directly relevant to work already shipped:

| File | What it contained | Was it honored before today |
| --- | --- | --- |
| `FROM_MAKER_RECOMMENDATION_VIEW_V1.md` | Full spec for the Recommendation View: 7 sections, strength bands over decimal scores, one verdict, rejected alternatives, change triggers | No — contradicted |
| `FROM_ENDER_IMAGERY_AND_UX_FOR_MAKER_1.md` | Legibility as a blocking bug at WCAG AA; itemized trust signals shown at the moment of reliance | Partly, by coincidence |

The Maker spec says, verbatim:

> Avoid fake precision. Prefer `Strong / Medium / Thin / Watch` over mysterious decimal
> scores. Scores can exist behind the scenes, but the view should lead with reasons.

> One recommendation. No "top five" default.

What was actually built in the prior pass: a twelve-row ranked list where every card led
with `fit 54`. Exactly the thing the spec forbids. `lib/matching/types.ts` already carried a
`RecommendationCard` type with the spec's section names, so the shape existed in the repo
and the surface ignored it.

The VPGM packet dispatched to Ender an hour before this receipt asked whether the `fit`
integer implies unearned precision. Ender had answered that question a month earlier, in
the inbox. The packet spent the Operator's Send on a solved question.

## What changed

Spec-conforming Recommendation View, owner-bound:

- `lib/recommendation-view/model.ts` — new. Builds `RecommendationViewModel` from the
  owner's own intake. Numeric match scores never leave the module; `bandForPoints` and
  `bandForScore` convert to `Strong / Medium / Thin / Watch`. One verdict chosen by a fixed,
  auditable ladder: no intake, incomplete intake, no candidate cleared, capital pressure,
  partner pressure, fallback.
- `app/api/recommendation-view/route.ts` — new. Owner from the session cookie only, never a
  query parameter.
- `app/dashboard/intros/page.tsx` — rewritten as a server component rendering all seven
  spec sections. The click-to-load ghost queue is gone.
- `app/globals.css` — verdict plate, reason rail with bands, alternative tiles, and the
  spec's mobile stack (verdict and next action hoisted above the audit trail).

Defects found by looking at the rendered page rather than the HTML string:

1. `PARTNER_WORDS` used `\bpartner\b`, which never matches "partnership", and had no
   `operator`. `CAPITAL_WORDS` had no `borrow`. A welding intake saying "bring in an
   operator", "wanted full partnership", and "borrow against the trucks" produced **zero**
   detected pressure and fell through to a generic Connector verdict. Fixed in
   `lib/matching/signals.ts`.
2. Header read `Read confidence: LOW` while the body read `MEDIUM`. One derivation now
   feeds both.
3. Every reason carried the same "A partial signal" sentence. Replaced with per-signal
   `WHY_IT_MATTERS` copy.
4. Doors were listed from any lane, so Builders appeared under an "open Connector doors"
   verdict. Doors are now filtered to the lane the verdict points at, and when a verdict
   points at the member's own record instead of a person, the section says so.
5. `Backer first` was being removed from the rejected-alternatives list on the very verdict
   whose entire point is declining it.
6. Single shared common nouns ("shop", "work", "trust", "write", "real") were quoted back
   as match evidence. Token-overlap reasons now require at least two hits and the stop-word
   list grew.

Unrelated blocker fixed on the way through: a live Chrome profile at
`foreman/.chrome-aeye-crew-profile` holds a lock on `Default/Network/Cookies`, and
`next build` globs the project root and died `EBUSY`. **Every build was broken while the
courier was running.** The profile now lives at `~/.werkles-aeye-crew-profile`, moved with
logins intact. Also, `BELLOWS_PERSONAL_RECS_LOCAL` accepted only the string `true`, so a
local `next start` with `=1` silently served the bakery demo and read as a data-binding bug.

## Proof

```text
npx tsc --noEmit                                          clean
npm run build                                             clean, /dashboard/intros dynamic
ghost-fleet-handeye-attack.mjs   20 ghosts   pass 20  fail 0
ghost-fleet-surface-attack.mjs    8 checks   pass  8  fail 0
```

New assertions in the Handeye attack, per ghost:

- `/api/recommendation-view` returns that owner's view, not the empty state
- verdict exists and is phrased `Recommended: …`
- no `"score":` key and no `fit N` string anywhere in the model payload
- every reason strength is one of the four bands
- the intro knock is never enabled while candidates are unverified
- `/dashboard/intros` renders the verdict, the reason rail, and the rejected alternatives
- `Recommended:` appears at most twice — one verdict, not a ranked list
- a cookieless caller never sees this owner's intake on `/dashboard/intros`

Manual walkthrough at `http://127.0.0.1:3000/dashboard/intros` with a real welding-shop
intake: verdict "build proof before asking for a Backer", MEDIUM confidence consistent in
both places, five reasons with distinct bands and distinct "matters" copy, doors correctly
empty with a stated reason, four rejected alternatives including Backer first, three change
triggers, four missing-evidence items, knock disabled with a visible reason. Dark text on
light panels.

## Still open

- **The receipt pipeline itself is unfixed.** Malformed cousin replies rot silently. Nothing
  alarms when validation fails, and the two most valuable receipts in the inbox are
  unreadable to the intake script. This is the actual root cause of a month of ignored
  guidance and it deserves a fix before the next dispatch.
- The Ender and Bean VPGM briefs were never sent. Closing the Chrome bay to unblock the
  build discarded the composer text. Logins survived the profile move, so re-delivery is
  cheap — but Ender's brief should be re-cut first to cite his prior guidance instead of
  asking him to repeat it.
- `HIGH` confidence is unreachable by construction while nothing in Werkles is verified.
  That is honest today and should be revisited when identity and funds checks are live.
- No unit tests. Every assertion above is script-level and needs a running server.

No secrets entered. No deploy. No production data touched. `NEXT_ACTION.md` and
`CURRENT_STATE.md` deliberately untouched — their hashes are baked into the five
outstanding cousin packets.

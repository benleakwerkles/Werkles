# Werkles Autonomous Matching Surface P - Lady Jessica / Ender VPG8

Status: `P COMPLETE - CONDITIONAL GO TO IMPLEMENT; NO-GO TO SHIP CURRENT SNAPSHOT`
Date: `2026-07-16`
Seat: `LadyJessica@Betsy` / Ender readability review
Execution / scoped push owner: `Dink@Betsy` / Heimerdinker
Repository: `C:\Users\Ben Leak\github\Werkles`

## Packet readback

Read in full before judgment:

- `foreman/handoffs/outbox/TO_HEIMERDINKER_AUTONOMOUS_MATCHING_SAVE_TRUTH_VPG8_20260716.md`
- `foreman/handoffs/outbox/TO_LADY_JESSICA_AUTONOMOUS_MATCHING_READABILITY_VPG8_20260716.md`

The checkout and fetched branch tip initially matched the packet exactly:

- branch: `maker/site-g-20260703`
- local HEAD: `92a30814a244fd99a3df0fd334103f984431a76c`
- fetched `origin/maker/site-g-20260703`: `92a30814a244fd99a3df0fd334103f984431a76c`

During this read-only review the shared branch advanced to `d183d8bcab872c001ac0ba740fc8d9f86ec4efa0`. The only committed delta from `92a3081` was Foreman state/receipt material (`foreman/NEXT_ACTION.md` and `foreman/receipts/WERKLES_AUTONOMOUS_MATCHING_GO_LIVE_20260716.md`); none of the six product files changed in that commit. This P judgment therefore remains anchored to the packet product baseline plus the live dirty snapshot identified below.

## Adoption verdict

The four pre-existing plain-language changes are coherent to carry into VPG8, but they must not be adopted as a shippable unit without the VPG8 corrections.

| File | Verdict | Reason |
|---|---|---|
| `components/squibb/human-gate-strip.tsx` | `ADOPT` | String/identifier-only cleanup replaces Ben/Operator labels with calm member language while preserving gate logic. |
| `lib/squibb/recommendations.ts` | `ADOPT AS BASELINE; FINISH COPY CLEANUP` | The dirty hunks remove named crew routing and internal tool names without changing scores, kinds, or gate booleans. Residual member-visible packet/dispatch/operator wording listed below still needs plain-language replacement. |
| `components/squibb/recommendation-card.tsx` | `ADOPT WITH VPG8 SCORE REMOVAL` | `Review required` is coherent. The live VPG8 draft also removes the card percentage, which is required. |
| `components/squibb/recommendation-surface.tsx` | `ADOPT WITH VPG8 SAVE TRUTH` | The dirty hunks remove source/packet/Speaker paths and named crew labels. The live VPG8 draft correctly closes the controls and removes the client POST path. |
| `components/squibb/confidence-meter.tsx` | `ADOPT CURRENT RULES-SCORE DRAFT` | Visible and accessible language now describes a rules score rather than confidence/probability. |
| `app/bellows/recommendations/squibb-recommendations.css` | `DO NOT SHIP CURRENT DRAFT` | The page-scoped bright text override assumes a dark page, but the inherited page/panels use the light workshop paper canvas. Several essential text pairs fail WCAG AA by a wide margin. |

Overall verdict: `CONDITIONAL GO` for Heimerdinker to implement the bounded fixes below; `NO-GO` for build/preview/push until the contrast gate and residual member-copy gate pass.

## Exact save-truth acceptance

Current live source result:

| Acceptance | Result | Evidence |
|---|---|---|
| Save actions visibly disabled before interaction | `PASS` | All three controls use `disabled={SAVE_CLOSED_BETA}` with `SAVE_CLOSED_BETA = true`. |
| Adjacent calm explanation | `PASS` | `Saving is unavailable during this beta. Nothing is sent from these buttons, and no money moves here.` |
| No client POST through the controls | `PASS` | The `stagePacket` function, click handlers, and `fetch("/api/bellows/recommendations/packet")` path are absent from the current surface draft. |
| Direct POST remains closed | `PASS - SOURCE` | `app/api/bellows/recommendations/packet/route.ts` unconditionally returns JSON state `Blocked` with status `403`. It imports no storage writer and has no write branch. |
| Direct POST makes no writes | `PASS - SOURCE + UNCHANGED PRIOR RUNTIME PROOF` | The route blob is unchanged from the VPG7 runtime proof (`a67e2804c53b3137f841083cba0dce3a22bdbf10`), which recorded `403` and unchanged packet/Speaker outputs. P did not run a server or repeat the POST. G must repeat the no-write proof. |

Save verdict: `PASS FOR SOURCE; RUNTIME REPROOF REQUIRED IN G`.

## Exact rules-score acceptance

Current live source result:

| Acceptance | Result | Evidence |
|---|---|---|
| No visible `%` in recommendation cards | `PASS` | Card score element and `confidence` destructure were removed. |
| No visible `Confidence` label in selected detail | `PASS` | Heading and ARIA labels now say `Rules score`. Internal type/class names may remain; they are not member-visible. |
| Selected detail says `N out of 100` | `PASS` | Visible score and accessible name use the bounded, rounded value out of 100. |
| Support band is descriptive | `PASS` | High/medium/low map to strong/moderate/weak support statements tied to current rules/evidence, not predicted success. |
| Proximate limitation | `PASS` | The score explanation ends: `This is not a probability of success, eligibility, or a predicted outcome.` |
| Saved-row score framing | `PASS` | Surface draft changed the residual saved-row `%` to `rules score N out of 100`. |

Rules-score wording verdict: `PASS FOR SOURCE`. Its visual treatment remains blocked by contrast.

## Exact contrast gate

AA threshold for normal text: `4.5:1` (large text: `3:1`). Ratios below use the declared workshop colors and the inherited light paper reference `#f6efe5`.

Current failures:

| Current foreground / background | Ratio | Member impact |
|---|---:|---|
| new page primary `#f7ecd4` / paper `#f6efe5` | `1.03:1` | Rules score and any primary-token text disappear on the light surface. |
| new page secondary `#e2c9a0` / paper `#f6efe5` | `1.40:1` | Intro, evidence lead, gate reasons, closed-save note, and supporting copy fail. |
| new page muted `#b5a48c` / paper `#f6efe5` | `2.13:1` | Context labels, section labels, and empty states fail. |
| inherited ink `#1f1814` / card smoke `#2c231d` | `1.14:1` | Card headings and flags remain nearly invisible. |
| inherited ink `#1f1814` / night `#191817` | `1.01:1` | Evidence-item and dark blocker text can disappear. |
| green support text `#5fd178` / paper `#f6efe5` | `1.69:1` | High support band fails. |
| ember support text `#fbc368` / paper `#f6efe5` | `1.40:1` | Medium support band fails. |

Minimal required repair, still inside the existing palette and layout:

1. Remove the three global token overrides from `.squibb-rec-page`; a single bright text palette cannot serve both the light canvas and dark tiles.
2. Use `#1f1814` for primary light-surface text (`15.34:1` on `#f6efe5`) and `#44362c` for supporting light-surface text (`10.16:1`). This includes the rules-score value, rules-score bands, explanation, evidence lead, non-blocker gate copy, and closed-save note.
3. Give explicit dark-surface foregrounds to cards, evidence items, blocker tiles, and ledger items: `#f4e2b1` is `11.98:1` on smoke `#2c231d` and `13.81:1` on night `#191817`; `#c9b896` is `7.90:1` on smoke and `9.10:1` on night.
4. Do not use green/ember as text on paper. Keep those colors as borders/fills, or pair the band text with `#44362c` on paper (`10.16:1`).
5. Browser-check headings, body copy, card flags, evidence labels/sources, every gate variant, the disabled-save note, support bands, and both empty states at desktop width. No essential text may fall below `4.5:1`.

Contrast verdict: `FAIL - SHIP BLOCKER`.

## Residual member-copy gate

The dirty `recommendations.ts` changes correctly remove Petra, Dink, Thufir, Ender, Bellows, Crucible, and Speaker routing from rendered recommendation fields. Before G proof, also replace these remaining member-visible internal phrases without changing the data model:

- `first packet` -> `first next step`
- `before dispatch` -> `before action`
- `smaller packets` / `proof packet` -> `smaller evidence requests` / `evidence request`
- `Skip proof packet for now` -> `Skip this evidence step for now`
- `candidate packet` / `guarded candidate packet` -> `candidate for review` / `guarded candidate`
- `The operator gets momentum` -> `You get momentum`
- `The candidate packet can carry gates` -> `The candidate can show the required review`

Current rendered source/packet/Speaker filesystem paths are removed from the member surface. Internal TypeScript field names may remain because they are not rendered.

## Snapshot hashes used for this P verdict

- `components/squibb/recommendation-surface.tsx` - `f01ff1f0c284923669178928d6afdc77ad5cb88397127a98f029d2f0012e17b6`
- `components/squibb/human-gate-strip.tsx` - `a3fa5ca92037ed70fbfaa442662bd3e987b389e13574bb8a773d2e47949c875d`
- `lib/squibb/recommendations.ts` - `9787ea2aedf22ddb225d331b435dcf493f5ab5623e63e97537e12dfb6e3058c8`
- `components/squibb/confidence-meter.tsx` - `0241a991beaa5ab6270dbacfcf9777cb93973f44a069802134576756c555a265`
- `components/squibb/recommendation-card.tsx` - `48a3d06a87c850bff9b5b9787e5ae6643f7c70c109d2398f883b4d7d47f0440e`
- `app/bellows/recommendations/squibb-recommendations.css` - `5fe0f95e2bff0435705a3cded28eb877705819f3536a50a744ab43ef8f01ad19`

Scoped `git diff --check` returned exit `0`; only the existing LF-to-CRLF warnings were emitted.

## G acceptance handoff

Heimerdinker may proceed only inside the six allowed product files plus one focused VPG8 test and receipts. G must prove:

1. the contrast repair above and a materially readable desktop screenshot;
2. rules-score visible/accessibility strings with no card/detail percentage or confidence label;
3. all three save controls disabled on first render with no client POST;
4. a direct forged POST returns `403` and packet/index/Speaker outputs remain byte-for-byte unchanged;
5. no internal path, crew routing, or residual operator packet language is rendered;
6. focused proof, typecheck, production build, and browser load pass;
7. no unrelated dirty file is absorbed.

No product file, server, commit, push, deploy, flag, database, or production state was changed by this P review. The only intended write is this receipt.

`COMPLETED - P CONDITIONAL GO / CURRENT SNAPSHOT NO-GO`

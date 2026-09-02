# Werkles BVPGM Source-Bound Candidate Evidence — 2026-08-23

Status: `LOCAL_SOURCE_BOUND_CANDIDATE__INDEPENDENT_REVIEW_OWED__GATE_05_CLOSED`

## Candidate identity

- Production baseline: `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`
- Candidate content digest:
  `bd9b31dee7f9c75d54f72375c406532b752ae9f85ddf877bbb72a0d75d05935f`
- Exact file inventory:
  `foreman/releases/WERKLES_BVPGM_RELEASE_CANDIDATE_INVENTORY_20260823.json`
- Candidate files: 293
  - member/product source: 252
  - receipt-bound verification: 40
  - static Ghost Fleet member data: 1
- Changed-import leaks: 0

The inventory expands Git's collapsed untracked directories into 4,040 exact
rows, then separates the candidate from 3,756 noncandidate relay,
control-plane, generated-data, draft-art, legacy UI, verification, evidence,
and blocked-schema rows. Every candidate
file is bound by path, byte count, and SHA-256.

## Quarantined schema artifact

`supabase/migrations/20260820073346_member_concierge_intakes.sql` exists in the
shared tree but is classified `blocked_schema`. It is not part of this candidate,
has not been applied, and receives no approval from this evidence. Account-durable
Intake remains a separate schema/RLS and production-data gate.

## Executable proof

- 40/40 receipt-bound M2-M9 plus BVPGM M3-M13 contracts: PASS after bounded repairs.
- `npm run typecheck`: PASS.
- `npm run build`: PASS — 100 routes compiled.
- Shared-header rendered sweep: 7/7 PASS with loaded stylesheets and no Next
  error overlay (Home, Login, Intake, Recommendations, Crucible, Formation,
  Proof).
- Local HTTP route spine: 10/10 PASS.
  - Home
  - Login
  - Intake
  - Recommendations
  - Workshop
  - Match Deck / Intros
  - Crucible
  - Formation with `candidate=ghost_095`
  - Personal Bellows
  - Membership
- Rendered launch acceptance: 20/20 PASS across the ten-route spine at
  1440x1000 and 390x844, with shared headers, grounding imagery, labeled
  controls, no sub-12px explanatory text, no horizontal overflow, and no
  console or page errors.

## Bounded repairs

The first contract sweep found one Public Bellows human-rhythm regression: the
new six-card catalog retained only one of the two established visual pauses.
The existing `tools` pause was restored between the fictional example and the
source wall. The failed contract then passed. No new asset or art direction was
introduced.

The live Proof route then exposed a release-workflow collision: `next build`
had replaced the active `next dev` CSS manifest, leaving Proof and the shared
header unstyled. Development now writes to `.next-dev` while production builds
write to `.next`; `.next-dev` is ignored and included in generated Next types.
The production build was rerun while Proof stayed live. Its stylesheet remained
HTTP 200, the header retained the member navigation, and the rendered page kept
its Inter typography with no error overlay.

BVPGM M3 then made three cross-workstream member-value repairs: Personal
Bellows controls name the work product they open; Formation adds a grounded
storefront-and-lease pause before the proposed company floor; and Crucible's
four provider stages collapse into a readable native disclosure map. Remaining
member-facing `Human gate` and `Next build` labels became plain statements of
what Werkles must prove and what must happen before a feature can go live. A
mobile overflow introduced by the longer Bellows labels was caught and fixed.

BVPGM M7 then walked the complete launch spine at desktop and mobile. The first
rendered pass correctly separated label-detection false positives from a real
cross-surface legibility defect. A scoped 12.8px floor now protects explanatory
captions and evidence labels on Home, Recommendations, Match Deck, and Crucible
without flattening the surrounding type hierarchy. The repaired sweep passed
20/20, and the complete 30-contract, TypeScript, and production-build proof was
rerun against this digest.

BVPGM M8 removed member-facing testing and internal-control language from
Intake, Login, Evidence Brief, and the Intake save boundary. It also fixed a
real brown-on-dark recovery paragraph contrast failure. Fresh rendered checks
passed 6/6 at desktop and mobile, and the complete launch acceptance remained
20/20. A deep action inventory found 147 visible links and 27 distinct internal
destinations across ten member routes; every destination returned an accepted
status and none escaped into internal-only surfaces. The experimental dynamic
click harness remains diagnostic-red because its positional selectors become
stale after Formation hydration. That harness is not claimed as product proof;
the Formation-specific browser and contract tests remain green.

BVPGM M9 converted Workshop's dead future-preview furniture into four usable
doors and, during the rendered walk, caught a larger product failure: Workshop
was replaying all nine Intake answers, including long free text. The repaired
Workshop acknowledges receipt once, keeps full wording in Intake, and opens
supported paths, unknowns, and a working-draft bridge. Personal Bellows,
Recommendations, and Evidence Brief now use ordinary working-draft language.
Crucible explicitly states that provider checks are dated, narrow evidence—not
match quality or a wealth leaderboard. BVPGM M10 then made Formation source
evidence compact but fully recoverable, added a direct next-unresolved-decision
action, and replaced a robotic Match Deck skill reply with a concrete proposed
test. The complete 34-contract, production
build, and 20/20 launch-render proof passed after updating the older Workshop
contract to preserve provenance without requiring raw answer replay.

BVPGM M11 then made accepted Formation work useful after the member leaves the
formation screen. Personal Bellows now restores only validated wording both
people accepted, offers a compact primary-source reading strip, and carries the
same accepted wording into the private Partnership Alignment Memo as read-only
context. The memo remains empty and private predictions remain excluded.
Formation also replaces three insider/legal-weight labels with ordinary member
language. A focused headless member walk proved the full return path with no
console or page errors; TypeScript, Formation and Operating Brief contracts,
the 100-route production build, and the 10/10 local route spine passed.

BVPGM M12 then turned each next unresolved Formation topic into either a
specific field test with an observable result or a bounded question handoff for
independent advisers. Only claims that genuinely need checking lead toward
Crucible; ordinary conversation tests do not manufacture provider work. The
First Shared Action planner leaves member fields empty, then saves the accepted
Operating Brief source together with the proposed action so Personal Bellows
can validate and restore both. The focused browser walk caught and repaired an
orphaned-save boundary, a React effect that overwrote fresh save status, and an
inherited dark-on-dark Practice Boundary heading. The repaired M12 walk, M11
return regression, Match Deck-to-Formation walk, Crucible journey, practice
boundary regression, TypeScript, and the 100-route production build passed.

BVPGM M13 then completed the local learning loop: after a saved proposed action,
one member can record what actually happened, keep interpretation separate,
and name the next decision to discuss. The result binds to the exact accepted
source and proposed action; changing that action invalidates the older result.
Personal Bellows restores only a current chain and labels it as one member's
notes—not the partner's answer, mutual agreement, company decision, or provider
evidence. The rendered walk also repaired contradictory empty-Intake copy and a
dark-on-dark Personal Bellows boundary heading. Exact-schema, stale-source,
Formation-to-Bellows, Match Deck, Crucible, legacy draft-shelf, TypeScript, and
the 100-route production build checks passed with no browser console errors.

## Evidence limitation

The production build ran against the full current local tree. The deterministic
inventory proves the intended source boundary and changed-import closure, but an
exact reconstruction of only the 293-file candidate has not been built in a
separate worktree or environment because the Operator has prohibited creating
new environments. Independent reviewers must inspect the exact inventory and
this limitation before sign-off.

## Review still owed

1. Ender: ordinary-human route and copy-continuity walk.
2. Bean: hostile trust, custody, provider, and false-claim attack.
3. Skybro: product/value continuity across the full member journey.
4. Petra: source-bound release GO/PATCH/STOP judgment.
5. Lady Jessica: independent exact-inventory review, visual walk, and release
   custody sign-off.

Heimerdinker has not issued a release sign-off. Ben's approval is not requested.
No push, deploy, promotion, provider activation, schema/RLS action, production
mutation, secret access, or spend is authorized.

# Werkles Full Flock P Receipt — Lady Jessica + Ender/Doozer

Status: `COMPLETED — P ONLY`  
Date: 2026-07-16  
Execution context: `LOCAL_SALLY_WINDOWS`  
Machine / hostname: `Betsy` / `BETSY`  
Seats: `LadyJessica@Betsy` and `Ender/Doozer@Betsy`  
Integrator and push owner: `Dink@Betsy` / Heimerdinker

## RECEIVED

Both fresh packets were opened and claimed for the addressed UX/product-review capabilities:

1. `TO_HEIMERDINKER_WERKLES_COM_MATCHING_CONTAINMENT_FULL_FLOCK_VPG6_20260716.md`  
   SHA-256: `599A63EC3C9C7BB5A49C2118565DB377CAD5FFDB324B7FA0D2041D1284BD32B9`
2. `TO_LADY_JESSICA_WERKLES_COM_MATCHING_TRUSTED_READOUT_FULL_FLOCK_VPG6_20260716.md`  
   SHA-256: `B5EBC29114E35CA14264DFE7E48BD20F791A255B5E6CC0A3856937CF07D8DE81`

No product, relay, platform, git, runtime, or production action was claimed by these seats.

## Local hands readback

- Repo: `C:\Users\Ben Leak\github\Werkles`
- Branch: `maker/site-g-20260703`
- HEAD: `176a5862b2628d878d7b4ecc4105668fd880b8bd`
- Remote: `https://github.com/benleakwerkles/Werkles.git`
- Working tree: dirty; `0` staged, `77` tracked modifications, `405` untracked entries at final pre-receipt count
- Terminal: available
- Localhost: not running
- Port: none

## Pulled cockpit / Flock state

- The current multi-role Matching verdict is `NO-GO`; `MATCHING_AUTONOMOUS_PUBLIC` remains `false` and the requested work is containment plus truthful readout, not launch.
- `foreman/NEXT_ACTION.md` still points to the superseded `APPROVE MATCHING AUTONOMOUS GO-LIVE` decision. The newer synthesis and these two packets require keeping the flag off and replacing that posture with containment-and-retest.
- The active site lane is `maker/site-g-20260703`. The Werkles.com project lock remains active: no Harvey/Nerdkle build on Betsy and no cross-lane merge.
- The additional Aeyes are review capabilities inside Dink's owned execution, not independent writers or pushers.
- No project-purpose or experience drift was found, so no Swanson drift notification was triggered.

## Current product-state findings

1. `app/bellows/recommendations/page.tsx` currently loads the recommendation session and the global packet ledger together. It has no request/member context and no dynamic-render declaration.
2. `lib/squibb/recommendation-session-server.ts` reads global latest intake, shadow runs, intakes, and saved packets before it knows whether personal delivery should occur. It also accepts persisted `shadow` output while the public flag is off.
3. `app/api/bellows/recommendations/packet/route.ts` loads the global session and writes a packet without an ownership check. It has no early OFF rejection.
4. `lib/matching/shadow-to-recommendations.ts` converts all scored paths, including disqualified ones; supplies `humanGates: []`; exposes run/engine language; and labels the source `Autonomous matching (shadow)`.
5. The adapter is clean and inside the trusted-readout packet. The page and packet route are clean and inside the containment packet.
6. `lib/squibb/recommendation-session-server.ts`, `components/squibb/recommendation-card.tsx`, and `components/squibb/recommendation-surface.tsx` already contain unrelated dirty work. They must not be absorbed into this G.

## Lady Jessica pull — member experience

### Recommendation A: make OFF unmistakably an example

The OFF page should return only the existing demo session and an empty ledger. Its visible language must say that the recommendations are an example and that this page is not reading or showing a member's intake while personal recommendations are off. Do not show global “recent intake” or “saved options” rows beside demo content.

The packet POST should fail with one calm, stable member-facing response such as: `Personal recommendation saving is unavailable while this beta is closed.` It should not imply that a recommendation ID, intake, or saved packet was found.

### Recommendation B: remove machine-room language from the trusted readout

For an eligible automated result, use:

- source label: `Automated path suggestion — beta`
- source detail: `Rules-based suggestions from what you entered. No person, provider, eligibility, funding, or outcome was verified.`
- suggested support: `Werkles human review`
- member context: a plain generation statement, not a shadow run ID, Layer 0 state, or not-match state

Disqualified paths must be absent, not shown as selectable cards with a warning. Every remaining path must carry a visible human-review gate appropriate to its domain.

## Ender/Doozer pull — smallest coherent build

### Containment shape

Use one bounded server helper under `lib/squibb/` as the page-state boundary:

- check `isMatchingPublicEnabled()` before any personal reader is reachable;
- when OFF, return the static demo session plus `{ intakes: [], optionPackets: [] }`;
- call the existing personal session/ledger loaders only in the ON branch;
- make the page non-prerenderable before any future personal ON state can reach it;
- make the packet route reject OFF before session lookup or storage.

This routes around the already-dirty session loader and avoids widening the slice into authentication or data-model work.

### Trusted-readout shape

In the clean adapter, filter `run.readout.scoredPaths` before conversion. Build both `ranked` and `catalog` from the eligible set so a disqualified ID cannot be selected through either view. Add one bounded domain-gate helper under `lib/matching/` with:

- a shared `human review before action` gate for every automated path;
- capital/lending/ownership warnings for `raise_capital`, `find_banker`, `find_credit_union`, and ownership/introduction paths;
- no-counterparty/contact warning for `find_partner` and `stage_intro_candidate`;
- human judgment and no-employer/eligibility verification for job and relocation paths;
- provider, cost, requirement, and outcome verification for training;
- seller/quote verification before equipment commitment;
- no-external-action language for translation and proof-request paths.

Keep this deterministic. Do not add a new UI, framework, dashboard, model, provider, data-rights center, or Harvey/Flock implementation.

## Acceptance checks for Dink's G

### Packet 1 — containment

- With the public flag OFF, spies prove that no latest-intake, shadow-run, intake-ledger, or option-ledger reader is called.
- OFF page state is demo-only and its two ledger arrays are empty even when global fixture files exist.
- The recommendations page is explicitly prevented from prerendering future personal state.
- OFF packet POST returns a stable blocked response before session lookup and before any packet/index/file write.
- Rendered OFF copy identifies an example and does not imply personal intake retrieval.
- Focused regression test and TypeScript pass.

### Packet 2 — trusted readout

- A synthetic high-ranked disqualified path is absent from both `ranked` and `catalog`.
- Every remaining recommendation has at least one human gate.
- Capital/lending/ownership, people/intros, jobs/relocation, training, and equipment paths receive their correct domain warning.
- Member-visible adapter fields contain no `Autonomous matching`, `shadow run`, `Layer 0`, or not-match machinery.
- Source language says `Automated path suggestion — beta` and explicitly denies verification of people, providers, eligibility, funding, or outcomes.
- A disqualified recommendation ID cannot be resolved for staging from the converted session.
- Focused regression test and TypeScript pass.

## Conflicts and boundaries

1. **Cockpit drift:** `NEXT_ACTION.md` still advertises the old public go-live gate. Dink should report this conflict in the combined receipt; this P seat does not rewrite cockpit authority.
2. **Dirty overlap:** the existing session loader and Squibb UI components are dirty. The containment helper must wrap rather than edit the loader; the trusted-readout slice must stay in the clean adapter and new gate helper.
3. **Percentage display remains unresolved:** current UI hard-codes `confidence.score%`. The allowed files for this G do not include the dirty card, meter, or surface. Therefore this slice can remove autonomous/verified language but cannot honestly claim the percentage-confidence problem is fully fixed. Record it as a remaining launch blocker.
4. **No ownership boundary yet:** demo-only OFF containment is necessary, but it does not create authenticated owner-scoped delivery. The public flag must remain off after this G.
5. **Role-law tension is contained:** current project doctrine names Lady Jessica and Dink as the Betsy writers and puts other Aeyes off-machine. Ender/Doozer, Thufir, and Bean may advise through receipts, but Dink alone integrates and pushes this Werkles.com slice.

## P disposition

`READY FOR BOUNDED G` — execute the two packet-defined containment ideas and the two packet-defined trusted-readout ideas. This is not approval for public Matching, deployment, schema work, production mutation, or unrelated dirty-tree cleanup.

`COMPLETED`

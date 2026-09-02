# Werkles Preview Pick P Receipt — Bean VPG7

Status: `COMPLETED`  
Date: 2026-07-16  
Seat: `Bean@Betsy`  
Execution context: `LOCAL_SALLY_WINDOWS` on hostname `BETSY`  
Repository: `C:\Users\Ben Leak\github\Werkles`  
Branch / pulled HEAD: `maker/site-g-20260703` / `23e429160bca3d91c4070bf9120c180df7aeb645`  
Upstream: `origin/maker/site-g-20260703` at the same commit; `0 ahead / 0 behind`  
Mode: hostile P pull and preview acceptance only; no product edit, server start, commit, push, deploy, flag change, or production action

## Packets pulled

1. `foreman/handoffs/outbox/TO_HEIMERDINKER_WERKLES_COM_PREVIEW_PROOF_VPG7_20260716.md`  
   SHA-256: `bb6102f81909e353b53607035040b8683e02cf23a2283d8c67c28b9ff3fa2f4b`
2. `foreman/handoffs/outbox/TO_LADY_JESSICA_WERKLES_COM_PREVIEW_PICK_VPG7_20260716.md`  
   SHA-256: `cd91c2bf9b26ce798b88a9ffa32bebae2aefcd8ed1b3a7696f43b9425b7319bb`

## Verdict

`VERDICT: CONDITIONAL GO`

Show Ben exactly one page: `/bellows/recommendations`.

It is the only candidate that lets Ben see the central Werkles promise in one place — a stated need becomes several next-step options with reasoning, evidence, and visible human stops — while also exercising the containment slice that was actually pushed at `23e4291`.

Do **not** use the homepage as proof of the pushed slice. `app/page.tsx` is locally modified, and its visible composition can therefore create a stronger or different impression than the branch commit Ben just received.

The condition: the handoff must label the recommendations screenshot as **current local presentation of pushed containment behavior plus unpushed UI copy**. Without that sentence, the preview is misleading and the verdict becomes `NO-GO`.

## Thirty-second checkout path

- **Exact route:** `http://127.0.0.1:<unused-port>/bellows/recommendations`
- **First thing to notice:** the page says `Demo scenario` and explains that personal recommendations are closed while the beta is being tested.
- **One interaction:** select a different recommendation card and inspect how the reasoning, evidence, and `Before anything moves` section change together.
- **Payoff:** Werkles does not merely present one answer; it makes alternatives and stopping conditions inspectable before anything is sent or committed.
- **Most important limitation:** this is a demo-only local page. Public Matching is OFF, packet saving is intentionally closed, and the displayed percentages are still heuristic scores rather than calibrated likelihoods.

Ben does not need to click `Save this option` during his thirty seconds. Root should test that control first, prove its expected `403`, then reload the page before handing it over so a deliberate safety stop is not mistaken for a broken preview.

## Pushed behavior versus dirty local presentation

### Proven branch state

The six VPG6 containment/readout files match HEAD with no local diff:

- `app/bellows/recommendations/page.tsx`
- `app/api/bellows/recommendations/packet/route.ts`
- `lib/squibb/public-recommendation-session-server.ts`
- `lib/matching/public-recommendation-gates.ts`
- `lib/matching/shadow-to-recommendations.ts`
- `scripts/foreman/test-matching-full-flock-vpg6.mjs`

HEAD also keeps:

- `MATCHING_AUTONOMOUS_PUBLIC=false`
- `MATCHING_LLM_TRANSLATE_ENABLED=false`

### Visible local dependencies that do **not** match HEAD

The current local recommendations screenshot will also render uncommitted changes from:

- `components/foundry/site-header.tsx`
- `components/squibb/recommendation-surface.tsx`
- `components/squibb/recommendation-card.tsx`
- `components/squibb/human-gate-strip.tsx`
- `lib/squibb/recommendations.ts`
- `lib/copy.ts`

Those changes replace internal/operator wording with friendlier member language, remove internal paths from the visible ledger, and alter labels such as `Stage this option` to `Save this option`. They improve the current local experience, but they are **not** part of pushed commit `23e4291`.

Therefore:

- the OFF boundary, empty ledger decision, unconditional packet `403`, adapter filtering, and gate helper are pushed behavior;
- the friendlier visible wording and some displayed demo content are unpushed local UI;
- a screenshot from the current worktree is not a clean-checkout screenshot of `23e4291`;
- production and any existing deployment must not be described from this local preview.

## What could make the preview misleading

### 1. Demo output could be mistaken for autonomous Matching output

With public Matching OFF, the page deliberately uses `loadSquibbRecommendationSession()` and an empty ledger. It does not display a personal shadow run and does not prove the pushed automated adapter in a real browser.

**Required caption:** `Demo only — no personal Matching output is public.`

### 2. Unpushed UI could be mistaken for the pushed commit

The route and safety boundary are clean at HEAD, but their visible component tree is dirty. The current local page will look plainer and more member-ready than a clean checkout of the pushed commit.

**Required caption:** `Safety behavior is pushed; visible copy still includes local unpushed work.`

### 3. Intentional packet closure could look like a bug

Every packet POST is supposed to return `403` until authenticated member/intake/run/recommendation ownership exists. A generic “save failed” impression without the reason would undercut the preview.

**Required runtime proof:** network `403`, JSON state `Blocked`, no output artifacts changed, and the UI shows the closed-beta explanation rather than a framework error.

### 4. Percentage “confidence” can still imply calibrated certainty

`components/squibb/confidence-meter.tsx` renders `Confidence score N out of 100` and `%`; recommendation cards also display percentages. This remains an acknowledged unresolved issue and must not be explained as probability, predicted success, eligibility, or verified accuracy.

### 5. A `200` alone does not prove containment

The page can return `200` while rendering stale, cached, personal, or dirty content. Root must inspect the actual DOM, network, logs, and output directories.

## Exact runtime checks root must perform

### Before starting

1. Record `git rev-parse HEAD` as `23e429160bca3d91c4070bf9120c180df7aeb645` and prove upstream equality.
2. Record that the six pushed VPG6 files above have zero diff against HEAD.
3. Record the six dirty visible dependencies separately. Do not stash, restore, stage, clean, commit, or absorb them.
4. Re-read the two flags from source and record both public and LLM delivery as `false`.
5. Snapshot before-state of:
   - `data/squibb/recommendation-packets.jsonl`
   - names and hashes under `data/squibb/recommendation-packets/`
   - names and hashes of `SQUIBB_OPTIONAL_PACKET_*` under `foreman/speaker/entries/`

### Browser and route

6. Start one existing local preview on a confirmed unused port; record the exact command, PID, port, and log path. No second server and no shared `.next` build while another reviewer is active.
7. Open only `/bellows/recommendations` in the browser and prove:
   - HTTP `200`;
   - no framework overlay;
   - no uncaught browser-console error;
   - no failed page asset required for the main experience;
   - visible `Demo scenario`;
   - visible closed-beta detail;
   - visible empty recent-intakes and saved-options states;
   - no personal intake text, global latest-intake label, packet path, Speaker path, internal run ID, or personal ledger row.
8. Capture one screenshot plus an accessibility/interactive snapshot. The screenshot caption must distinguish pushed safety behavior from dirty local presentation.
9. Select at least two cards and prove the selected title, reasoning, evidence, and gate content update coherently. Confirm keyboard selection/focus remains visible.
10. Verify the `Start concierge intake` link targets `/bellows/intake`; do not submit an intake during this preview proof.

### Closed write proof

11. In the browser, click the save control once. Prove:
    - POST `/api/bellows/recommendations/packet` returns `403`;
    - JSON includes `state: "Blocked"`;
    - no success packet ID/path appears;
    - no client crash or framework overlay;
    - server log records the expected `403`, not `500`.
12. Compare the three packet-output snapshots byte-for-byte and prove no file was created or changed.
13. Reload the page to return it to a clean demo state before giving Ben the URL.

### Final handoff

14. Return one URL and this exact limitation in plain language: `Demo only. Matching remains private and OFF; saving is intentionally closed. The safety behavior is pushed, while some friendlier page wording is still unpushed local work.`
15. Do not mention public launch, deployment, verified matching, calibrated confidence, or production parity.

## Stop conditions

Stop and return a blocker if any of these occur:

- the page shows a personal/global intake or a nonempty personal ledger;
- packet POST writes anything or returns success;
- either public or LLM Matching is enabled;
- the route produces a framework overlay, main-flow console error, or `500`;
- root cannot distinguish pushed source from dirty visible dependencies;
- proving the page would require stashing, cleaning, overwriting, committing, or deploying unrelated local work.

`COMPLETED — BEAN VPG7 PULL; CONDITIONAL GO FOR /BELLOWS/RECOMMENDATIONS ONLY`

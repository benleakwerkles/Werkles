# Werkles Preview Pick P Receipt — Lady Jessica + Ender

Status: `COMPLETED — P ONLY`  
Verdict: `READY FOR G — PROVISIONAL PICK /bellows/recommendations`  
Date: 2026-07-16  
Execution context: `LOCAL_SALLY_WINDOWS`  
Machine / hostname: `Betsy` / `BETSY`  
Seats: `LadyJessica@Betsy` and `Ender/Doozer@Betsy`  
Execution owner: `Dink@Betsy` / Heimerdinker

## RECEIVED

Opened and pulled:

1. `foreman/handoffs/outbox/TO_HEIMERDINKER_WERKLES_COM_PREVIEW_PROOF_VPG7_20260716.md`
2. `foreman/handoffs/outbox/TO_LADY_JESSICA_WERKLES_COM_PREVIEW_PICK_VPG7_20260716.md`

This seat claimed only preview selection, expected experience proof, and browser acceptance design. No product file, server, runtime, commit, branch, remote, or production state was changed.

## Pulled state

- Repository: `C:\Users\Ben Leak\github\Werkles`
- Branch: `maker/site-g-20260703`
- HEAD: `23e429160bca3d91c4070bf9120c180df7aeb645`
- Remote branch: same HEAD
- HEAD subject: `Contain public matching with full-Flock review`
- Working tree: dirty; `0` staged, `77` tracked modifications, `396` untracked entries at readback
- Localhost: not running; port `none`
- Latest integrated receipt: `foreman/receipts/WERKLES_FULL_FLOCK_VPG6_20260716.md`
- VPG6 verification: runtime test, TypeScript, build, and post-build dynamic proof all `PASS`
- Matching public: `OFF`
- Matching LLM: `OFF`
- Recommendation packet POST: deliberately closed with `403`

The local preview will render the current worktree, not a sterile checkout of HEAD. The homepage and several Foundry/Squibb components have pre-existing uncommitted edits. G must describe the screenshot as the current Betsy preview and use the closed-beta behavior to prove the pushed VPG6 containment slice; it must not claim every visible pixel belongs to commit `23e4291`.

## Candidate ranking before browser evidence

### 1. `/bellows/recommendations` — provisional winner

Why it leads:

- It demonstrates the Werkles promise fastest: a need becomes ranked options with reasoning, evidence posture, and human gates.
- It has meaningful interaction rather than being only a marketing scroll.
- VPG6 gives it a fresh, provable safety story: demo-only while public Matching is off, empty personal ledger, no prerendered personal state, and closed saving.
- The split card/detail layout should make a strong single screenshot if it renders cleanly.

Expected visual proof:

- workshop-dark recommendation surface with a clear `What should you do next?` heading;
- visible `Demo scenario` and closed-beta explanation;
- ranked-card stack beside the selected option detail;
- reasoning, proof/evidence, and `Before anything moves` gate sections;
- empty recent-intake and saved-option states;
- no framework overlay, blank region, or leaked personal material.

Known rough edges:

- the demo still labels the numeric rules score as percentage `Confidence`;
- save controls remain visible even though POST correctly returns the closed-beta `403`;
- the surrounding Squibb UI components contain pre-existing local edits.

### 2. `/` — visual-payoff fallback

Why it is second:

- It should be the most cinematic surface: hero, example Werkles output, six real-person lanes, Squibb beat, and Maria's five-beat visual story.
- Its first screen likely communicates brand and purpose more immediately than any internal product route.

Why it does not lead this G:

- the page and several Foundry components are dirty and unrelated to the pushed VPG6 slice;
- most of the payoff is a long scroll rather than one decisive interaction;
- it proves the world and tone better than the newly completed Matching containment.

Expected visual proof if promoted after browser comparison:

- headline `Find the people and proof that move your business forward.`;
- two clear hero actions and a visible example-output plate;
- real-person lane photography and a coherent story sequence below the fold;
- no broken imagery, layout collision, or legacy narrative section.

### 3. `/bellows` — attractive bridge, least finished

Why it is third:

- the owl-host hero and Bellows-floor gallery should provide immediate character;
- it links directly to intake, recommendations, the walkthrough, and proof.

Why it trails:

- the hero presents four competing actions;
- visible draft/gallery attribution and internal process language make it feel like a workshop preview rather than the cleanest product promise;
- it is primarily a bridge to the recommendation experience rather than the payoff itself.

Expected visual proof if used as fallback:

- Bellows hero and Squibb image render without crop or distortion;
- the four actions are visible and keyboard reachable;
- the recommendation link reaches the chosen route;
- gallery images load, but draft captions are reported honestly.

## Thirty-second checkout path

Provisional route: `http://localhost:<unused-port>/bellows/recommendations`

1. **First thing to notice:** `What should you do next?` sits beside a visible `Demo scenario` explanation that personal recommendations are closed during beta testing.
2. **Interaction to try:** select the second ranked recommendation card and confirm the selected title, reasoning, evidence, and human-gate detail all change together.
3. **Payoff:** Werkles does not merely name an option; it exposes why the option appeared, what proof exists, what is missing, and what must be reviewed before anything moves.
4. **Most important limitation:** this is an example, not a live personal match; saving is closed and the percentage-confidence presentation is still unfinished.

## Exact browser acceptance checks for G

### Load and frame

1. Start the existing preview on an unused port without editing files; record the exact port and URL.
2. Open `/` first and confirm HTTP `200`, then navigate through the real site to `/bellows/recommendations` where practical.
3. Confirm document title `Werkles Recommendations | Bellows`.
4. Confirm there is no Next.js error overlay, blank main region, broken stylesheet, missing-font collapse, or uncaught console error.
5. At a desktop viewport near `1440 × 1000`, confirm the site header, Bellows navigation, page heading, and recommendation content do not overlap or clip horizontally.

### Closed-beta truth

6. Confirm the page visibly contains `Demo scenario`.
7. Confirm its adjacent detail says personal recommendations are closed while the beta is being tested and the page uses an example.
8. Confirm the page does not show `Your latest intake`, a real intake identifier, a real member's text, or any non-demo saved item.
9. Confirm `Recent intakes` says `No saved intakes yet` and `Saved options` says `No recommendation options saved yet`.
10. Confirm no visible copy says public Matching is live, autonomous, or a verified match.

### Core experience

11. Confirm `Best next steps` is the initially selected tab and at least one recommendation card is visible.
12. Confirm the first selected detail includes all four layers: reasoning, confidence/score explanation, proof/evidence, and `Before anything moves`.
13. Select the second ranked card. Confirm its pressed/selected state changes and the detail heading changes to the second option without a reload.
14. Confirm the new detail's evidence and human-gate content changes with the selected option rather than remaining stale.
15. Switch to `All options`, confirm the tab state changes, then return to `Best next steps` without an overlay or navigation loss.

### Containment behavior

16. Click `Save this option` once in the local preview. Confirm the browser receives HTTP `403` from `/api/bellows/recommendations/packet`.
17. Confirm the visible status message becomes `Personal recommendation saving is unavailable while this beta is closed.`
18. Confirm no saved-option row appears and no success language is shown.
19. Confirm the server log records successful page delivery and the expected blocked POST without an application exception.

### Visual proof and final selection

20. Capture a primary screenshot after selecting the second card, framed to show the closed-beta source statement and the split recommendation card/detail layout.
21. Inspect an interactive snapshot for real links, tabs, card buttons, and recommendation actions; do not accept a screenshot-only facade.
22. Compare the first viewport of `/`, `/bellows`, and `/bellows/recommendations`. Promote a different winner only if browser evidence shows the recommendation route is visually broken, confusing, or materially weaker.
23. Name exactly one winning page in the G receipt and give Ben one exact local URL—not a three-page tour.
24. State one limitation plainly: `Demo only; personal Matching and saving remain off.` Mention the percentage-confidence rough edge separately if it is prominent in the screenshot.

## P verdict

`READY FOR G — VERIFY /bellows/recommendations FIRST. FALL BACK TO / ONLY IF REAL BROWSER EVIDENCE BEATS THE PRODUCT PAYOFF.`

`COMPLETED`

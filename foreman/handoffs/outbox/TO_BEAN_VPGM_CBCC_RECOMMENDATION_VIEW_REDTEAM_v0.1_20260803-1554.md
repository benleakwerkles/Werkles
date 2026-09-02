# Werkles VPGM — CBCC_RECOMMENDATION_VIEW_REDTEAM v0.1

**To Bean** (Hostile audit cousin · DeepSeek · Edge tab 4)
**Issued by:** Foreman (Lady Jessica, LOCAL_SALLY_WINDOWS)
**Doctrine:** STOP BEFORE SEND — Foreman prepares and pastes; Ben clicks Send.

## Slice under review

Red team a correction pass the Foreman built UNILATERALLY: /dashboard/intros rebuilt as a single-verdict Recommendation View, plus changes to signal detection, match scoring, and the CBCC receipt pipeline. Nothing here has been reviewed by any CBCC seat.

## Context handed to the cousin

- READ THIS FIRST — process failure being corrected. On 2026-08-03 the Foreman found unread CBCC receipts in the repo inbox, including a full design spec written by MAKER and a UX/legibility brief written by ENDER. Instead of consulting the crew, the Foreman read those artifacts and implemented against them alone, then self-tested and declared it done. The Operator's standing rule is that no seat works unilaterally: five seats catching each other's mistakes beats one seat grading its own homework. This packet exists because that rule was broken and the Operator called it.
- So: you are not being asked to approve work. You are being asked to find what one agent could not see in its own output. Recent unilateral passes have shipped pages that did not load, wrong images in slots, and weak copy. Assume defects exist.
- Werkles is pre-launch. It matches a person carrying a problem with a person who can carry part of it. No money moves, no introduction is sent, nothing is auto-submitted. Werkles verifies nothing today.
- Environment: local production build on Sally (Windows) at 127.0.0.1:3000. Not deployed. You cannot see the running site, so every string and number you need is quoted in this packet verbatim.
- WHAT THE SURFACE WAS: /dashboard/intros showed a click-to-load list of up to 12 synthetic candidates, each card leading with an integer, e.g. '#1 Omar Nguyen - fit 54 - synthetic', followed by reason lines and repeated blocker lines.
- WHAT MAKER'S UNREAD SPEC SAID: 'Avoid fake precision. Prefer Strong / Medium / Thin / Watch over mysterious decimal scores. Scores can exist behind the scenes, but the view should lead with reasons.' And: 'One recommendation. No top-five default.' The shipped list violated both.
- WHAT IT IS NOW: a server-rendered, owner-bound Recommendation View with seven sections in this order — header, one verdict, what you asked for, what we heard underneath it, visible reasons, the doors this points at, why not the alternatives, what would change this recommendation, next action. The integer score still exists server-side but never reaches the page.
- VERDICT LADDER (fixed order, first match wins): 1) no intake bound to session -> 'run the intake before anything else'; 2) intake incomplete -> 'sharpen the Workshop before knocking'; 3) zero candidates cleared a reason -> 'keep building. No fit worth your time yet'; 4) capital pressure detected -> 'build proof before asking for a Backer'; 5) partner pressure detected -> 'find an Operator first'; 6) fallback -> 'open Connector doors, but keep the ask narrow'.
- BANDS REPLACING THE NUMBER: a candidate score of 55+ shows Strong, 35-54 Medium, 15-34 Thin, under 15 Watch. An individual reason showing 20+ points is Strong, 12-19 Medium, under 12 Thin, negative points Watch. The user sees only the word.
- CONFIDENCE: reported as HIGH / MEDIUM / LOW. By construction HIGH is currently unreachable, because nothing in Werkles is verified. Complete intake plus a detected pressure yields MEDIUM. Everything else is LOW.
- SIGNAL DETECTION WAS WIDENED. Before: partner detection used the pattern 'partner' with a word boundary, which never matched 'partnership', and had no word for 'operator'. Capital detection had no word for 'borrow'. A real welding-shop intake saying 'bring in an operator', 'both wanted full partnership', and 'borrow against the trucks' detected ZERO pressure and fell through to the generic Connector verdict. Now partner detection matches partner-anything, co-founder, co-own-anything, investor, backer, equity, operator, foreman, right-hand; capital detection adds borrow-anything and mortgage.
- MATCH EVIDENCE WAS TIGHTENED. Reasons built from word overlap between the seeker's text and a member's text now require at least TWO shared words, not one. Previously a single shared common noun produced a reason that read as evidence: 'Their stated coverage touches your blocker language: shop.' Words newly excluded from matching: write, wrote, real, trust, night, myself, years, year, month, months, week, weeks, days, time, times, away.
- DOORS ARE NOW TIED TO THE VERDICT. Previously any lane could appear, so Builders were listed under an 'open Connector doors' verdict. Now only members in the lane the verdict points at are listed, capped at three, with no score and no rank. When the verdict points at the member's own record instead of a person, the section states that instead of listing anyone.
- THE INTRO KNOCK IS DISABLED, always, with this reason shown: 'Knocks are closed while every member in this readout is unverified. Werkles will not open a door it cannot vouch for.'
- MEASURED ACCESSIBILITY (taken from the live DOM, not estimated): text contrast passes WCAG AA everywhere — verdict heading 17.51:1, all body and reason text 11.6:1, minimum required is 4.5:1. BUT the measured font sizes are: verdict body paragraph 12.2px BOLD, receipt paragraph 12.2px BOLD, doors note 12.2px BOLD, strength band label 11.2px, disabled-knock explanation 13.1px, reason text 14.7px, alternative text 14.4px, list items 16px.
- PIPELINE CHANGES IN THE SAME PASS: cousin replies now classify as OK, GD_RECEIPT (GD-router envelope, no cockpit hash, advisory only), LEGACY_MANUAL (no metadata heading, hand-delivered, must be read by a human), MALFORMED (has a heading but unparseable), or STALE_DO_NOT_APPLY. New commands: alarm (loud report of unread replies, exits non-zero while any wait), consume (records a hand-delivered receipt as read, requires a note), quarantine (parks an unusable reply with a reason). Dispatching a new VPGM mission now REFUSES to run while any reply is unread, overridable with a flag called --ack-inbox.
- TWO INFRASTRUCTURE FACTS FROM THE SAME PASS: (1) a live Chrome profile stored inside the repo held a lock on its cookie database, and the production build globbed the repo root and failed with EBUSY — every build was broken and nobody noticed; the profile was moved outside the repo. (2) an environment flag that opens personal recommendations locally previously accepted only the exact string 'true'; passing '1' silently served an unrelated demo document and read like a data-binding bug. It now accepts both.
- FOUND WHILE PREPARING THIS PACKET — TWO REPO COPIES ON THE OPERATOR'S MACHINE. There are two separate Werkles directories. All real work, the running server, and every change described above live in one of them. The OTHER one is a snapshot from 2026-07-03 whose git HEAD file was deliberately renamed to 'HEAD-retired-local-20260703-043815', which makes git refuse to recognise it as a repository at all. It has no copy of the new recommendation model. Its package.json and its intros page are frozen at 2026-07-03. BUT its global stylesheet was modified on 2026-07-31 and is 234KB against 268KB in the live tree — so something edited the retired tree three weeks after it was retired. Worse: the Operator's editor has the RETIRED tree configured as its workspace root, so the file tree he looks at is not the tree that builds and serves. Nothing has been moved, renamed, or deleted; this is reported for a ruling, not acted on.
- FOREMAN'S OWN TESTING, which is again one agent grading its own homework: 20 synthetic seekers asserting owner isolation, forged-cookie rejection, cookieless empty state, no numeric score reaching the view, one verdict only, bands only, and the knock never enabled — 20/20 pass. 8/8 surface checks pass. 11/11 relay pipeline fixtures pass. Typecheck and production build clean.

## Verbatim member-facing strings

- Header: 'The concierge readout for your intake. Visible fit, no magic smoke. Read confidence: MEDIUM'
- Verdict: 'Recommended: build proof before asking for a Backer.'
- Verdict body: 'Money is the pressure you named, and it is the one conversation that fails hardest when it starts early. Nobody here has verified funds, including you, and your numbers are not assembled. Strengthen the record first; the capital conversation gets easier and shorter.'
- Receipt: 'What you asked for' / 'I run a two-truck mobile welding outfit in Pittsburgh and I am trying to take on shop fabrication work without dropping the road jobs that pay the bills.' / metadata row: 'Lane needed: Operator', 'Arena: Unnamed', 'Turf: Pittsburgh', 'Proof posture: Nothing verified yet on either side'
- Interpretation: 'Underneath the ask, we heard more than one pressure at once: money or a guarantor, a partner or operator.'
- Interpretation because-line: 'That reading comes from your own words in the intake, not from a model guessing at your personality.'
- Interpretation confidence: 'Read confidence: MEDIUM - all intake questions answered and a named pressure to read against, but nothing is verified on either side.'
- Reason 1: 'Capital posture fits' [Strong] / 'Saw: You named funding or lease pressure. Ava Salazar is positioned to back or co-sign rather than compete for the same money.' / 'Matters: A backer who is not chasing the same money is the rarest useful match in this pool. It is also the one where unverified funds hurt most.'
- Reason 2: 'Open to partnership' [Medium] / 'Saw: Ava Salazar has partnership language in their own intake and is currently open.' / 'Matters: Stated openness is weak evidence on its own, but it is the difference between a cold ask and a warm one.'
- Reason 3: 'Proof posture' [Watch] / 'Saw: No member in this readout has passed identity, funds, or credential checks. Neither have you.' / 'Matters: Fit is not verification. Every name here is a stranger until a check is run, and Werkles does not run one for you automatically.'
- Reason 4: 'Money-before-machine risk' [Watch] / 'Saw: Your intake leads with funding, a lease, or a guarantor.' / 'Matters: Money conversations tend to fail on numbers you have not assembled yet. That is a preparation gap, not a matching gap.'
- Doors section, when the verdict points at the record instead of a person: heading 'The doors this points at' followed by 'No doors listed on purpose. This recommendation points at your own record first, not at a person to ask for money.'
- Doors section, when a lane has no qualifying member: 'No member in the Operator lane cleared an honest reason against your intake. Werkles would rather show you none than reach.'
- Alternative tile: 'Backer first' / 'Tempting because Cash would buy time, equipment, and breathing room.' / 'Not first because Nobody on either side of this readout has verified funds, and your own numbers are not assembled yet. Money asked for early tends to be money declined.' / 'Could become right when You can show a cost sheet and a funds check has been run on both sides.'
- Alternative tile: 'Full pause' / 'Tempting because The proof file is thin on every side, so waiting feels safest.' / 'Not first because There is enough signal in your intake to keep sharpening it. Stopping entirely costs you the only thing that is currently free.' / 'Could become right when Identity or basic claim receipts fail, or your timeline moves out past a year.'
- Change trigger: 'If you can show three months of numbers and a clean cost sheet then a capital-side conversation stops being premature.'
- Missing evidence: 'Identity check - not started on your side' / 'Funds check - not started, and it is the first thing a capital conversation asks for' / 'Cost sheet or margin model - Werkles cannot assemble this for you' / 'Work reference - not on file'
- Disabled primary action: button 'Knock on this door' with 'Knocks are closed while every member in this readout is unverified. Werkles will not open a door it cannot vouch for.'
- Low-confidence verdict copy: 'Recommended: sharpen the Workshop before knocking.' body: 'The Forge can see the shape, not the joints. 3 of 5 intake questions are answered, and the unanswered ones are exactly where fit is decided. Knocking on a door with a half-written ask spends someone else's attention to learn something you could have written down.'
- No-fit verdict copy: 'Recommended: keep building. No fit worth your time yet.' body: 'No member in the pool cleared an honest reason against your intake. Werkles would rather hand you an empty page than pad a list.'
- Standing trust note at the bottom: 'Werkles can show fit signals and open a private knock. It does not guarantee safety, solvency, returns, legal readiness, or that the other human is right for you. Claims still need receipts. Big moves still need advisers.'

## Known gaps disclosed up front

- No CBCC seat has reviewed any of this. That is the defect this packet exists to fix.
- The Foreman wrote the 'Matters' explanations itself, one per signal type, as static copy. They are the Foreman's opinions about why a signal matters, presented to a member as Werkles doctrine.
- Confidence can never read HIGH. That is honest today but it means one third of the scale is decoration.
- Body copy renders at 12.2px bold and the strength bands at 11.2px. The Foreman noticed this only by measuring the DOM after the fact and has NOT changed it, pending this review.
- There are no unit tests. Every assertion above requires a running server.
- Two VPGM briefs (Ender, Bean) were loaded into provider composers earlier today and then lost when the Foreman closed the browser to unblock the build. They were never sent.
- The Foreman recorded its own consumption of the Maker and Ender receipts with self-written notes. Nobody countersigned that the work actually satisfied those specs.
- Preview deploy remains blocked: intake writes to the local filesystem, and Vercel's is read-only. Fixing it needs a Supabase table, which is a schema human gate.
- A walkthrough flag opens member surfaces without sign-in on the local machine, with a visible banner. Local/Preview only by intent, not by enforcement.

## Assignment

- **V:** The recommendation cannot be wrong in a way the member cannot detect, and no widened pattern quietly mislabels what someone is carrying.
- **P:** The verdict ladder, the widened signal patterns, the two-word evidence rule, the new stop-word list, the confidence ceiling, and the two environment changes.
- **M:** Return findings ordered by severity, each labelled BLOCKER, SERIOUS, or NOTE. For every BLOCKER, state the smallest change that clears it. Include at least one concrete false-positive intake, written out, that produces a wrong verdict.
- **Out of lane:** No copy rewrites for tone and no visual design opinions — that is Ender. Do not recommend deploy, push, or SQL apply.

### G — work items

1. FALSE POSITIVES IN THE WIDENED PATTERNS. Partner detection now fires on: partner-anything, co-founder, co-own-anything, investor, backer, equity, operator, foreman, right-hand. Capital fires on: loan, borrow-anything, capital, fund, money, credit, financ, bank, lender, invest, lease, co-signer, guarantor, landlord, storefront, mortgage. Construct intakes where these fire WRONGLY — 'my landlord is the problem', 'I am an operator looking for work', 'my partner left', 'I do not want investors'. Each false fire changes the verdict the member is shown. How bad does it get, and what is the smallest fix?

2. THE LADDER'S HIDDEN BIAS. The ladder checks capital BEFORE partner. Anyone who names both money and a partner gets 'build proof before asking for a Backer' and never sees Operator doors, no matter how strong the operator match is. Is that defensible sequencing or a bias the member cannot see or override?

3. FALSE NEGATIVES FROM THE TWO-WORD RULE. Evidence now needs two shared words. A member whose one strong overlap was a single specific word — a trade, a certification, a machine — now sees no reason at all, and Werkles tells them nothing cleared. Can the member detect that they were silently filtered? Is one specific rare word actually weaker evidence than two common ones?

4. THE STOP-WORD LIST IN A TRUST PRODUCT. 'trust' and 'real' were added to the list of words that can never form evidence. Werkles sells trust. Rule on whether excluding 'trust' from evidence matching is a defect, and check the rest of the list for words that carry real meaning in trades: night, days, time, years.

5. THE UNREACHABLE CONFIDENCE CEILING. The view reports HIGH / MEDIUM / LOW but HIGH cannot occur. Is presenting a scale with an unreachable top honest, or is it a quiet misrepresentation of how much the system knows?

6. DID THE FOREMAN LOOSEN A GATE? An environment flag controlling whether personal recommendations are served was changed from accepting only 'true' to accepting 'true' or '1'. A separate check hard-blocks production. Rule on whether that loosening is safe or whether it widens a production-adjacent surface.

7. THE ESCAPE HATCH. Dispatch is now blocked while any cousin reply is unread, overridable with --ack-inbox. The same agent that ignored the inbox for a month can now type the override. Is the guard real, or theater? What would make it real?

8. THE DISABLED KNOCK. Every path ends at a disabled button explaining that knocks are closed because nobody is verified. Is a product whose primary action is permanently disabled honest, or is it a dead end dressed as integrity?

## Expected return

`foreman/handoffs/inbox/FROM_BEAN_CBCC_RECOMMENDATION_VIEW_REDTEAM_v0.1.md`
with a filled `## Relay metadata` block. Validate with
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.

## Paste block delivered to the chat tab

```text
[WERKLES VPGM — CBCC_RECOMMENDATION_VIEW_REDTEAM v0.1]

Bean (Hostile audit cousin, DeepSeek). Your lane: Trust, compliance, hardening audits — not deploy execution.

This is a real work request from the Werkles Foreman, not a role-sync ping. Everything
you need is in this message — do not ask for repo files.

SLICE UNDER REVIEW
Red team a correction pass the Foreman built UNILATERALLY: /dashboard/intros rebuilt as a single-verdict Recommendation View, plus changes to signal detection, match scoring, and the CBCC receipt pipeline. Nothing here has been reviewed by any CBCC seat.

CONTEXT
- READ THIS FIRST — process failure being corrected. On 2026-08-03 the Foreman found unread CBCC receipts in the repo inbox, including a full design spec written by MAKER and a UX/legibility brief written by ENDER. Instead of consulting the crew, the Foreman read those artifacts and implemented against them alone, then self-tested and declared it done. The Operator's standing rule is that no seat works unilaterally: five seats catching each other's mistakes beats one seat grading its own homework. This packet exists because that rule was broken and the Operator called it.
- So: you are not being asked to approve work. You are being asked to find what one agent could not see in its own output. Recent unilateral passes have shipped pages that did not load, wrong images in slots, and weak copy. Assume defects exist.
- Werkles is pre-launch. It matches a person carrying a problem with a person who can carry part of it. No money moves, no introduction is sent, nothing is auto-submitted. Werkles verifies nothing today.
- Environment: local production build on Sally (Windows) at 127.0.0.1:3000. Not deployed. You cannot see the running site, so every string and number you need is quoted in this packet verbatim.
- WHAT THE SURFACE WAS: /dashboard/intros showed a click-to-load list of up to 12 synthetic candidates, each card leading with an integer, e.g. '#1 Omar Nguyen - fit 54 - synthetic', followed by reason lines and repeated blocker lines.
- WHAT MAKER'S UNREAD SPEC SAID: 'Avoid fake precision. Prefer Strong / Medium / Thin / Watch over mysterious decimal scores. Scores can exist behind the scenes, but the view should lead with reasons.' And: 'One recommendation. No top-five default.' The shipped list violated both.
- WHAT IT IS NOW: a server-rendered, owner-bound Recommendation View with seven sections in this order — header, one verdict, what you asked for, what we heard underneath it, visible reasons, the doors this points at, why not the alternatives, what would change this recommendation, next action. The integer score still exists server-side but never reaches the page.
- VERDICT LADDER (fixed order, first match wins): 1) no intake bound to session -> 'run the intake before anything else'; 2) intake incomplete -> 'sharpen the Workshop before knocking'; 3) zero candidates cleared a reason -> 'keep building. No fit worth your time yet'; 4) capital pressure detected -> 'build proof before asking for a Backer'; 5) partner pressure detected -> 'find an Operator first'; 6) fallback -> 'open Connector doors, but keep the ask narrow'.
- BANDS REPLACING THE NUMBER: a candidate score of 55+ shows Strong, 35-54 Medium, 15-34 Thin, under 15 Watch. An individual reason showing 20+ points is Strong, 12-19 Medium, under 12 Thin, negative points Watch. The user sees only the word.
- CONFIDENCE: reported as HIGH / MEDIUM / LOW. By construction HIGH is currently unreachable, because nothing in Werkles is verified. Complete intake plus a detected pressure yields MEDIUM. Everything else is LOW.
- SIGNAL DETECTION WAS WIDENED. Before: partner detection used the pattern 'partner' with a word boundary, which never matched 'partnership', and had no word for 'operator'. Capital detection had no word for 'borrow'. A real welding-shop intake saying 'bring in an operator', 'both wanted full partnership', and 'borrow against the trucks' detected ZERO pressure and fell through to the generic Connector verdict. Now partner detection matches partner-anything, co-founder, co-own-anything, investor, backer, equity, operator, foreman, right-hand; capital detection adds borrow-anything and mortgage.
- MATCH EVIDENCE WAS TIGHTENED. Reasons built from word overlap between the seeker's text and a member's text now require at least TWO shared words, not one. Previously a single shared common noun produced a reason that read as evidence: 'Their stated coverage touches your blocker language: shop.' Words newly excluded from matching: write, wrote, real, trust, night, myself, years, year, month, months, week, weeks, days, time, times, away.
- DOORS ARE NOW TIED TO THE VERDICT. Previously any lane could appear, so Builders were listed under an 'open Connector doors' verdict. Now only members in the lane the verdict points at are listed, capped at three, with no score and no rank. When the verdict points at the member's own record instead of a person, the section states that instead of listing anyone.
- THE INTRO KNOCK IS DISABLED, always, with this reason shown: 'Knocks are closed while every member in this readout is unverified. Werkles will not open a door it cannot vouch for.'
- MEASURED ACCESSIBILITY (taken from the live DOM, not estimated): text contrast passes WCAG AA everywhere — verdict heading 17.51:1, all body and reason text 11.6:1, minimum required is 4.5:1. BUT the measured font sizes are: verdict body paragraph 12.2px BOLD, receipt paragraph 12.2px BOLD, doors note 12.2px BOLD, strength band label 11.2px, disabled-knock explanation 13.1px, reason text 14.7px, alternative text 14.4px, list items 16px.
- PIPELINE CHANGES IN THE SAME PASS: cousin replies now classify as OK, GD_RECEIPT (GD-router envelope, no cockpit hash, advisory only), LEGACY_MANUAL (no metadata heading, hand-delivered, must be read by a human), MALFORMED (has a heading but unparseable), or STALE_DO_NOT_APPLY. New commands: alarm (loud report of unread replies, exits non-zero while any wait), consume (records a hand-delivered receipt as read, requires a note), quarantine (parks an unusable reply with a reason). Dispatching a new VPGM mission now REFUSES to run while any reply is unread, overridable with a flag called --ack-inbox.
- TWO INFRASTRUCTURE FACTS FROM THE SAME PASS: (1) a live Chrome profile stored inside the repo held a lock on its cookie database, and the production build globbed the repo root and failed with EBUSY — every build was broken and nobody noticed; the profile was moved outside the repo. (2) an environment flag that opens personal recommendations locally previously accepted only the exact string 'true'; passing '1' silently served an unrelated demo document and read like a data-binding bug. It now accepts both.
- FOUND WHILE PREPARING THIS PACKET — TWO REPO COPIES ON THE OPERATOR'S MACHINE. There are two separate Werkles directories. All real work, the running server, and every change described above live in one of them. The OTHER one is a snapshot from 2026-07-03 whose git HEAD file was deliberately renamed to 'HEAD-retired-local-20260703-043815', which makes git refuse to recognise it as a repository at all. It has no copy of the new recommendation model. Its package.json and its intros page are frozen at 2026-07-03. BUT its global stylesheet was modified on 2026-07-31 and is 234KB against 268KB in the live tree — so something edited the retired tree three weeks after it was retired. Worse: the Operator's editor has the RETIRED tree configured as its workspace root, so the file tree he looks at is not the tree that builds and serves. Nothing has been moved, renamed, or deleted; this is reported for a ruling, not acted on.
- FOREMAN'S OWN TESTING, which is again one agent grading its own homework: 20 synthetic seekers asserting owner isolation, forged-cookie rejection, cookieless empty state, no numeric score reaching the view, one verdict only, bands only, and the knock never enabled — 20/20 pass. 8/8 surface checks pass. 11/11 relay pipeline fixtures pass. Typecheck and production build clean.

WHAT THE MEMBER ACTUALLY SEES (verbatim strings)
- Header: 'The concierge readout for your intake. Visible fit, no magic smoke. Read confidence: MEDIUM'
- Verdict: 'Recommended: build proof before asking for a Backer.'
- Verdict body: 'Money is the pressure you named, and it is the one conversation that fails hardest when it starts early. Nobody here has verified funds, including you, and your numbers are not assembled. Strengthen the record first; the capital conversation gets easier and shorter.'
- Receipt: 'What you asked for' / 'I run a two-truck mobile welding outfit in Pittsburgh and I am trying to take on shop fabrication work without dropping the road jobs that pay the bills.' / metadata row: 'Lane needed: Operator', 'Arena: Unnamed', 'Turf: Pittsburgh', 'Proof posture: Nothing verified yet on either side'
- Interpretation: 'Underneath the ask, we heard more than one pressure at once: money or a guarantor, a partner or operator.'
- Interpretation because-line: 'That reading comes from your own words in the intake, not from a model guessing at your personality.'
- Interpretation confidence: 'Read confidence: MEDIUM - all intake questions answered and a named pressure to read against, but nothing is verified on either side.'
- Reason 1: 'Capital posture fits' [Strong] / 'Saw: You named funding or lease pressure. Ava Salazar is positioned to back or co-sign rather than compete for the same money.' / 'Matters: A backer who is not chasing the same money is the rarest useful match in this pool. It is also the one where unverified funds hurt most.'
- Reason 2: 'Open to partnership' [Medium] / 'Saw: Ava Salazar has partnership language in their own intake and is currently open.' / 'Matters: Stated openness is weak evidence on its own, but it is the difference between a cold ask and a warm one.'
- Reason 3: 'Proof posture' [Watch] / 'Saw: No member in this readout has passed identity, funds, or credential checks. Neither have you.' / 'Matters: Fit is not verification. Every name here is a stranger until a check is run, and Werkles does not run one for you automatically.'
- Reason 4: 'Money-before-machine risk' [Watch] / 'Saw: Your intake leads with funding, a lease, or a guarantor.' / 'Matters: Money conversations tend to fail on numbers you have not assembled yet. That is a preparation gap, not a matching gap.'
- Doors section, when the verdict points at the record instead of a person: heading 'The doors this points at' followed by 'No doors listed on purpose. This recommendation points at your own record first, not at a person to ask for money.'
- Doors section, when a lane has no qualifying member: 'No member in the Operator lane cleared an honest reason against your intake. Werkles would rather show you none than reach.'
- Alternative tile: 'Backer first' / 'Tempting because Cash would buy time, equipment, and breathing room.' / 'Not first because Nobody on either side of this readout has verified funds, and your own numbers are not assembled yet. Money asked for early tends to be money declined.' / 'Could become right when You can show a cost sheet and a funds check has been run on both sides.'
- Alternative tile: 'Full pause' / 'Tempting because The proof file is thin on every side, so waiting feels safest.' / 'Not first because There is enough signal in your intake to keep sharpening it. Stopping entirely costs you the only thing that is currently free.' / 'Could become right when Identity or basic claim receipts fail, or your timeline moves out past a year.'
- Change trigger: 'If you can show three months of numbers and a clean cost sheet then a capital-side conversation stops being premature.'
- Missing evidence: 'Identity check - not started on your side' / 'Funds check - not started, and it is the first thing a capital conversation asks for' / 'Cost sheet or margin model - Werkles cannot assemble this for you' / 'Work reference - not on file'
- Disabled primary action: button 'Knock on this door' with 'Knocks are closed while every member in this readout is unverified. Werkles will not open a door it cannot vouch for.'
- Low-confidence verdict copy: 'Recommended: sharpen the Workshop before knocking.' body: 'The Forge can see the shape, not the joints. 3 of 5 intake questions are answered, and the unanswered ones are exactly where fit is decided. Knocking on a door with a half-written ask spends someone else's attention to learn something you could have written down.'
- No-fit verdict copy: 'Recommended: keep building. No fit worth your time yet.' body: 'No member in the pool cleared an honest reason against your intake. Werkles would rather hand you an empty page than pad a list.'
- Standing trust note at the bottom: 'Werkles can show fit signals and open a private knock. It does not guarantee safety, solvency, returns, legal readiness, or that the other human is right for you. Claims still need receipts. Big moves still need advisers.'

KNOWN GAPS (already admitted — do not spend your answer rediscovering these)
- No CBCC seat has reviewed any of this. That is the defect this packet exists to fix.
- The Foreman wrote the 'Matters' explanations itself, one per signal type, as static copy. They are the Foreman's opinions about why a signal matters, presented to a member as Werkles doctrine.
- Confidence can never read HIGH. That is honest today but it means one third of the scale is decoration.
- Body copy renders at 12.2px bold and the strength bands at 11.2px. The Foreman noticed this only by measuring the DOM after the fact and has NOT changed it, pending this review.
- There are no unit tests. Every assertion above requires a running server.
- Two VPGM briefs (Ender, Bean) were loaded into provider composers earlier today and then lost when the Foreman closed the browser to unblock the build. They were never sent.
- The Foreman recorded its own consumption of the Maker and Ender receipts with self-written notes. Nobody countersigned that the work actually satisfied those specs.
- Preview deploy remains blocked: intake writes to the local filesystem, and Vercel's is read-only. Fixing it needs a Supabase table, which is a schema human gate.
- A walkthrough flag opens member surfaces without sign-in on the local machine, with a visible banner. Local/Preview only by intent, not by enforcement.

--- YOUR ASSIGNMENT ---

V (vision): The recommendation cannot be wrong in a way the member cannot detect, and no widened pattern quietly mislabels what someone is carrying.

P (pull): The verdict ladder, the widened signal patterns, the two-word evidence rule, the new stop-word list, the confidence ceiling, and the two environment changes.

G (go) — work these, in this order:

1. FALSE POSITIVES IN THE WIDENED PATTERNS. Partner detection now fires on: partner-anything, co-founder, co-own-anything, investor, backer, equity, operator, foreman, right-hand. Capital fires on: loan, borrow-anything, capital, fund, money, credit, financ, bank, lender, invest, lease, co-signer, guarantor, landlord, storefront, mortgage. Construct intakes where these fire WRONGLY — 'my landlord is the problem', 'I am an operator looking for work', 'my partner left', 'I do not want investors'. Each false fire changes the verdict the member is shown. How bad does it get, and what is the smallest fix?

2. THE LADDER'S HIDDEN BIAS. The ladder checks capital BEFORE partner. Anyone who names both money and a partner gets 'build proof before asking for a Backer' and never sees Operator doors, no matter how strong the operator match is. Is that defensible sequencing or a bias the member cannot see or override?

3. FALSE NEGATIVES FROM THE TWO-WORD RULE. Evidence now needs two shared words. A member whose one strong overlap was a single specific word — a trade, a certification, a machine — now sees no reason at all, and Werkles tells them nothing cleared. Can the member detect that they were silently filtered? Is one specific rare word actually weaker evidence than two common ones?

4. THE STOP-WORD LIST IN A TRUST PRODUCT. 'trust' and 'real' were added to the list of words that can never form evidence. Werkles sells trust. Rule on whether excluding 'trust' from evidence matching is a defect, and check the rest of the list for words that carry real meaning in trades: night, days, time, years.

5. THE UNREACHABLE CONFIDENCE CEILING. The view reports HIGH / MEDIUM / LOW but HIGH cannot occur. Is presenting a scale with an unreachable top honest, or is it a quiet misrepresentation of how much the system knows?

6. DID THE FOREMAN LOOSEN A GATE? An environment flag controlling whether personal recommendations are served was changed from accepting only 'true' to accepting 'true' or '1'. A separate check hard-blocks production. Rule on whether that loosening is safe or whether it widens a production-adjacent surface.

7. THE ESCAPE HATCH. Dispatch is now blocked while any cousin reply is unread, overridable with --ack-inbox. The same agent that ignored the inbox for a month can now type the override. Is the guard real, or theater? What would make it real?

8. THE DISABLED KNOCK. Every path ends at a disabled button explaining that knocks are closed because nobody is verified. Is a product whose primary action is permanently disabled honest, or is it a dead end dressed as integrity?

M (momentum): Return findings ordered by severity, each labelled BLOCKER, SERIOUS, or NOTE. For every BLOCKER, state the smallest change that clears it. Include at least one concrete false-positive intake, written out, that produces a wrong verdict.

OUT OF LANE: No copy rewrites for tone and no visual design opinions — that is Ender. Do not recommend deploy, push, or SQL apply.

--- HOW TO ANSWER ---

Reply as a markdown document Ben can save to foreman/handoffs/inbox/ as
FROM_BEAN_CBCC_RECOMMENDATION_VIEW_REDTEAM_v0.1.md

End your reply with this exact block, filled in:

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "BEAN",
  "VERDICT": "<one line>",
  "CONFIDENCE": "HIGH | LOW",
  "UNKNOWNS": "none | <list> | outside my lane",
  "source_packet_id": "TO_BEAN_VPGM_CBCC_RECOMMENDATION_VIEW_REDTEAM_v0.1_20260803-1554",
  "source_packet_file": "TO_BEAN_VPGM_CBCC_RECOMMENDATION_VIEW_REDTEAM_v0.1_20260803-1554.md",
  "nextActionHash": "086ce991f8e566bbd82726d2d6de2d0e14818bd78c80ced82ef4080bc587466a",
  "currentStateHash": "78e580fb3019107585768920e8d2f5fc289e6533f4b1716081bea719d772242a"
}
```

Do not recommend deploy, push, SQL apply, secret entry, or spending money. Those are
Operator gates. Say what you would do and stop.

```

---

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "BEAN",
  "generated_at": "2026-08-03T15:54:52.457Z",
  "currentStateHash": "78e580fb3019107585768920e8d2f5fc289e6533f4b1716081bea719d772242a",
  "nextActionHash": "086ce991f8e566bbd82726d2d6de2d0e14818bd78c80ced82ef4080bc587466a",
  "source_files_included": [
    "foreman/NEXT_ACTION.md",
    "foreman/CURRENT_STATE.md"
  ],
  "REQUIRED_RESPONSE_FIELDS": [
    "schemaVersion",
    "cousin",
    "source_packet_id",
    "source_packet_file",
    "generated_at",
    "nextActionHash",
    "CONFIDENCE",
    "VERDICT",
    "UNKNOWNS"
  ],
  "packet_id": "TO_BEAN_VPGM_CBCC_RECOMMENDATION_VIEW_REDTEAM_v0.1_20260803-1554",
  "source_packet_file": "TO_BEAN_VPGM_CBCC_RECOMMENDATION_VIEW_REDTEAM_v0.1_20260803-1554.md",
  "network_command": "CBCC_RECOMMENDATION_VIEW_REDTEAM",
  "network_command_version": "v0.1",
  "role_lane": "Trust, compliance, hardening audits — not deploy execution.",
  "human_gate_required": true,
  "edge_tab_index": 4,
  "edge_url": "https://chat.deepseek.com/"
}
```


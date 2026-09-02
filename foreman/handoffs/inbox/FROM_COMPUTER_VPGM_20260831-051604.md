# FROM COMPUTER — VPGM

Harvested by the Foreman from the provider transcript over CDP. The cousin wrote
the answer; the transport was mechanical. Custody status below is not a claim
about what the cousin verified.

- Seat: Computer / Perplexity
- Provider route: https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65
- Native thread ID: not exposed by provider
- Packet: TO_COMPUTER_VPGM_WERKLES_BVPGM_PRODUCTION_HUMAN_RHYTHM_20260831_v0.1_20260831-0510.md
- PACKET_SHA256: 7af743817b1da97a49261289d165813662671009c3cc94fd6bf9c26b093fc02f
- SUBMISSION_ID: VPGM:COMPUTER:7af743817b1d
- Posted at: 2026-08-31T05:11:07.245Z
- Harvested at: 2026-08-31T05:16:04.876Z
- Extracted via: div.prose
- Reply sha256: 29ea503319c35e2054a06491b6ebd08b62acbca082f9dd56869b1e790788c460
- Reply chars: 20038
- CUSTODY: CUSTODY_CHALLENGE_ECHOED__IDENTITY_PENDING — Receiver echoed the challenge nonce CUSTODY-COMPUTER-9DA4B5D7605D2C74CEFF492FF31BBFF6, which proves this response correlates to this packet. Still unproved: identity, route, capability, dependency. Correlation is not identity.

---

RECEIVED
CUSTODY_TOKEN: CUSTODY-COMPUTER-9DA4B5D7605D2C74CEFF492FF31BBFF6
COUSIN: COMPUTER
PACKET: TO_COMPUTER_VPGM_WERKLES_BVPGM_PRODUCTION_HUMAN_RHYTHM_20260831_v0.1_20260831-0510.md
LANE_CHECK: IN_LANE — pre-build attack and release-attack layer for the human-rhythm BVPGM; audit of Maria-removal proof, section-signature route matrix, exact-manifest staging, commit boundary, candidate deployment, and alias promotion order; no implementation, no staging, no push, no deploy, no schema, no provider, no secrets, no credentials, no spend, no new image generation.
BLOCKER: PARTIAL. Computer's sandbox cannot open the Werkles tree, lib/copy.ts, the current route inventory, or the asset directory. This receipt is written as an evidence-shaped attack against the packet's proposed pass plus the receipts chain in this session. Anything I mark "must-verify" is a step Lady Jessica personally reproduces before the seal; nothing here authorizes her to accept my check as substitute for that reproduction.

Doctrine reminder before the check: promotion belongs to Lady Jessica alone. This receipt attacks; it does not clear. Ben ordered a live push today, but a live push is authorized only if the exact-manifest seal survives independent attack. Live push is not authorized by anything Computer writes here.

FROM_COMPUTER_WERKLES_BVPGM_PRODUCTION_HUMAN_RHYTHM_20260831_v0.1.md
G1 — Verdict and minimum evidence

PATCH.

The pass as scoped is doctrinally sound: remove a persona narrative that carried too much weight, add selective real-object relief where the surface is uniform, distinguish People/Bellows/Proof rooms inside the shared palette without fracturing into three mini-sites, and humanize copy where it reads as internal vocabulary. None of that conflicts with prior receipts. The release, however, is not evidence-ready until the following minimum set is on file and independently verified by Lady Jessica at seal time. Each item is a specific artifact, not a claim.

E1 — Maria-removal inventory. A machine-produced list from git grep -nE 'Maria' across the tree (including lib/copy.ts, MDX, JSON, TSX, alt text) with every hit either (a) deleted in the candidate diff, (b) intentionally retained under a documented reason, or (c) unreachable at runtime with proof of unreachability. The inventory must include a companion git grep -nE '(bakery|baker)' since the narrative frequently attaches to those tokens.

E2 — Route-signature matrix. A route × treatment matrix listing every rendered app/**/page.tsx route, its declared room (People, Bellows, Proof, or neither), the specific section-signature element it carries (e.g., copper rail, violet trust rail, muted-neutral hero band), and the specific real-object asset the route uses or explicitly declines. This matrix is the doctrine-safe way to enforce "selective object imagery" without becoming a blanket every-page rule.

E3 — Rendered evidence pack. Full-page desktop and 320px screenshots of every route named in E2, plus a short walk log per route confirming the four persistence-state strings and the doctrine-safe verbatim strings render honestly. Screenshots are the promotion artifact; a passing test is not enough.

E4 — Exact candidate inventory JSON. A new foreman/releases/WERKLES_BVPGM_RELEASE_CANDIDATE_INVENTORY_20260831.json with a fresh digest, replacing the 08-29 inventory. Same 301-path-style discipline; the number of paths is whatever the actual candidate is, not the prior number.

E5 — Evidence markdown for the seal. A new foreman/releases/WERKLES_PRODUCTION_CANDIDATE_EVIDENCE_20260831.md recording TypeScript pass, production build, the exact test list run (not "the suite"), and the E3 walk-log summary. Tests named by spec file, not by count.

E6 — Rollback plan. A pre-staged git revert command for the candidate commit and a pre-staged alias re-point command, both written into the runbook before the promotion step begins.

STOP is not warranted. GO cannot be issued from Computer's seat because none of the six artifacts can be verified without the tree. Lady Jessica issues the seal after M1–M14 (§M) succeed.

G2 — Maria-removal proof and section-signature matrix: attack on false completeness
Attack A — Maria-removal false completeness

Four common ways a persona-removal pass reports "done" while a member still encounters the persona at runtime. Each is a specific check Lady Jessica must run against E1.

A1 — Reachable but not imported at the top level. Maria copy in lib/copy.ts can be reached via a re-export chain, a dynamic import, or an MDX file that pulls from a shared strings module. git grep 'Maria' misses none of that, but a component that renders the string via a shared strings map fails a route-level grep. Verification: after E1 grep, run git grep -nE '(bakery|baker|Maria)' and additionally git grep -nE 'as const' -- 'lib/copy.ts' to inspect every exported string constant; then walk every route in E2 and confirm the rendered DOM contains none of the strings on any of the seven verbatim string blocks named by prior receipts.

A2 — Alt text and metadata. Persona text can survive as image alt, title, aria-label, and <meta> values. Grep must include alt=, title=, aria-label=, <meta name="description", og:title, og:description, and twitter:* fields. Screenshots do not catch these. Lady Jessica confirms by running view-source: on the sealed candidate URL and searching for Maria/bakery in the raw HTML.

A3 — Analytics and event names. If PostHog is instrumented anywhere with an event or property that names the persona, that name enters the runtime L-P layer and re-surfaces as internal vocabulary in operator dashboards. Doctrine-safe rule: no user-visible or operator-visible label may name the removed persona. Grep the PostHog client for Maria, bakery, baker.

A4 — Fixture and test fixtures reachable in production. If any fixture file with Maria copy is imported by a live route via a shared "examples" module, the copy renders in production even though every test passes. Lady Jessica confirms by walking every route → module → import chain for anything under fixtures/, examples/, stories/, or mocks/, and confirming none are transitively imported by a live route.

Doctrine-honest exceptions. If a Werkles doctrine page (e.g., an internal-history note) chooses to retain "Maria" as a documented past narrative for design reasons, the retention must be listed in E1 with a reason and a doctrine sentence, and must not appear on any member-facing route. Silent retention is a doctrine violation.

Attack B — Section-signature route matrix false completeness

Four ways E2 can look complete and still fail the "three rooms in one palette, not three mini-sites" rule.

B1 — Room classification drift. A route can classify as Bellows in E2 but render a People-styled header locally. Verification: for each row in E2, the smoke walk confirms the room-signature element is present in the DOM and matches the room label. A route without a matching signature element is a halt.

B2 — Signature applied by wrapper only. If the section signature is applied by a top-level layout.tsx wrapper that all three rooms share, the rooms visually converge — the palette becomes uniform and the "rooms" claim collapses. Signature elements must live inside each room's dedicated layout or component so the difference is visible at 320px, not only at desktop.

B3 — Selective object imagery becomes blanket. The packet's own gap admits the risk. Selective means some routes carry a real-object image (tool at rest, van at dawn, workshop pegboard, materials staged, reception quiet, workshop interior, proof imagery, kitchens, desks, documentary lane stills), some carry a smaller decorative object marker, and some are explicitly type-forward. The route matrix must show the split, not assert "all routes have imagery." If every row in E2 carries an object, the pass is decorative and reintroduces the "long text-and-bubble page" fatigue with a photo on top.

B4 — Room boundary bleed on transition. When a member navigates from People to Bellows to Proof, the header, hero band, and typography rhythm must stay consistent enough that they know it is one Werkles, and differ visibly enough that they know they are in a new room. Verification: a per-transition screenshot pair in E3 — the last frame of the exit room and the first frame of the entry room — placed side by side. Lady Jessica confirms the pair reads as one product with two rooms, not two products.

Anti-pattern to explicitly refuse. No room may adopt a hue outside the approved Werkles palette (violet/copper) as its signature. A signature is contrast, weight, and asset choice inside the palette — not a new palette. If any signature reads as a color swap, the pass has fractured the surface and must be revised before seal.

G3 — Manifest staging, commit boundary, candidate deployment, alias promotion

Three attack vectors, all inherited from the 08-29 release-rotation receipt and re-attacked here with the pass-specific hazards.

S1 — Manifest contamination from a very dirty tree. The packet admits the tree is very dirty and that unrelated work must remain excluded. Rules:

No git add ., no git add -A, no git commit -a, no IDE stage-all click.

Lady Jessica constructs the temporary staging index from E4's manifest, one path per line.

git diff --cached --name-only | sort equals the sorted manifest exactly. Any diff is a halt.

git diff --cached --name-only | grep -E '(20260820073346_member_concierge_intakes\\.sql|\\.env|secrets|credentials)' returns empty. Any hit is a halt.

S2 — Commit boundary. One commit from baseline, digest recorded in the commit message. git rev-list --count <baseline>..HEAD returns 1 in the sealing worktree. The commit message names both the manifest digest and the tree digest.

S3 — Deployment order. Deploy a candidate URL first. Run the E3 walk against the candidate URL. Only after the walk is clean does Lady Jessica execute the alias promotion. Alias promotion is a manual, human-gated command, not a chained step. If any walk item on the candidate URL fails, alias promotion never runs.

New hazard specific to this pass:

S4 — Asset-path drift. Selective object imagery uses existing assets from the tree; the pass does not include new image generation. If any manifest path references an asset that does not exist at the target path, the candidate URL renders a broken image and the E3 walk fails. Verification: E5 records ls-style confirmation of every asset referenced by the added components, keyed to the manifest.

G4 — Checks Lady Jessica must personally reproduce

She does not trust these from a packet or a subordinate signature. Each is an artifact she produces in her sealing session.

P1 — Manifest identity. Compute sha256 of E4 locally and confirm the value written into the evidence markdown matches.

P2 — Staged-set identity. In her temporary worktree, git diff --cached --name-only | sort equals the sorted manifest exactly. Any diff halts.

P3 — Excluded-content sweep. No migration, no .env, no secrets, no credentials, no schema file appears in the staged set.

P4 — Maria-removal DOM sweep. For each route in E2, view-source: on the sealed candidate URL contains no Maria/bakery/baker in body, alt, title, aria-label, or meta. Any hit halts.

P5 — Verbatim string audit. For each route in E2, confirm the doctrine-safe strings render honestly:

Your story won't be Maria's. renders only where the pass intended a bridge sentence and never as the primary heading of a room.

From a messy need to a usable next move. renders only where the value fold intends it.

Werkles should earn its place in your week. renders only where the operations/rhythm surface intends it.

The four persistence-state strings render exactly per the identity-spine doctrine — none rendered where the state does not obtain.

No Saved to your Werkles account. renders unless Tier-1 is unlocked in this candidate; the 08-29 packet excluded the migration and the 08-31 packet does not indicate a Tier-1 change.

No Plaid-verified language renders unless a Plaid production call has actually occurred in this candidate.

P6 — Header continuity. Every rendered route: exactly one #werkles-site-header; canonical primary nav labels People, Story, Proof, Bellows, Membership in the order established by the sitewide header continuity postbuild.

P7 — Section-signature parity. For each row in E2, the room-signature element is present and matches the room label. Transition pairs read as one product with distinct rooms.

P8 — Real-object asset parity. For each route that E2 says carries object imagery, the image renders at desktop and 320px without layout shift, and the alt text is doctrine-safe (no Maria/bakery, no persona claim).

P9 — TypeScript pass. npx tsc --noEmit at the exact candidate commit returns exit 0.

P10 — Production build. npm run build completes without errors and without warnings that name any included manifest path.

P11 — Exact test list. The named tests in E5 run and each passes; no substitution of test count for test identity.

P12 — Candidate URL walk before promotion. Full E3 walk executed against the candidate URL; no error, no missing string, no console noise. Any failure halts before alias promotion.

P13 — Rollback readiness. git revert <candidate_commit> and alias re-point command written into the runbook and visible on-screen before the promotion command is executed.

P14 — Post-promotion smoke. After alias promotion, the same E3 walk runs against the aliased URL. Any failure triggers the rollback commands from P13 within minutes; Lady Jessica does not attempt a fix-forward mid-flight.

M — Compact release-seal checklist (halt-on-fail)

Sequential. A failure at any step halts the seal and returns the pass to Ben with the specific failure.

M1 Confirm the 2026-08-31 evidence artifacts E1–E6 exist and are signed by Heimerdinker with the exact digest.

M2 Compute the sha256 of E4 locally; equals the recorded value.

M3 Open a temporary worktree at baseline; construct the staged set from E4; git diff --cached --name-only | sort equals the sorted manifest.

M4 Excluded-content grep on the staged set returns empty (migration, env, secrets, credentials, schema).

M5 npx tsc --noEmit returns exit 0 at the candidate commit.

M6 npm run build returns without errors and without warnings on included paths.

M7 Named tests from E5 run and each passes; no counted-only proxy.

M8 Maria-removal DOM sweep on every route in E2 returns empty via view-source: on the candidate URL.

M9 Section-signature parity verified on every route in E2.

M10 Verbatim string audit on every route: no Saved to your Werkles account. render this cycle; no Plaid production-only string render unless a Plaid production call actually occurred; the three doctrine strings render only where intended.

M11 Header continuity: exactly one #werkles-site-header per rendered route; canonical primary nav order preserved.

M12 Rollback commands staged and visible in the runbook before promotion.

M13 Alias promotion is a manual, human-gated command; executed only after M1–M12 pass.

M14 Post-promotion smoke on aliased URL identical to M8–M11. Any failure triggers immediate rollback per M12.

Halt rule: any single M1–M14 failure halts the seal. Fix-forward is not authorized in-flight. If halted, the candidate URL is deleted or left un-promoted, the temporary worktree is discarded, the alias never moves, and Ben receives the specific failure.

Cross-check against prior receipts

Production release rotation 2026-08-29. Consistent. Same staging discipline, same exclusion of the concierge intakes migration, same halt-before-promotion rule. The 08-31 pass inherits and does not weaken any invariant. The 08-31 candidate must produce a fresh manifest and evidence file — the 08-29 artifacts are not reusable at seal time.

Sitewide header continuity postbuild. Consistent. Canonical primary nav labels and single-header rule survive.

Formation post-build and formation visual redesign post-build. Consistent. The Formation Ledger, three-region canvas, and only-mutual-decisions doctrine are unaffected by a persona-removal + relief-imagery pass.

Ranking/privacy postpatch seal. Consistent. No wealth ranking; the pass adds imagery, not ranker signals.

Copy-continuity source-ready receipt. Consistent. Maria removal directly serves the "insider terms and Operator echo" defect class; the section-signature discipline serves the WCAG 2.2 SC 3.2.3/3.2.4 consistent-navigation rules.

Phase-2 identity persistence; identity-spine source correction. Consistent. Tier-1 remains Ben's human gate. The candidate must not render Saved to your Werkles account. unless Tier-1 is unlocked in the sealing session, and P5 enforces this.

BVPGM copy continuity + M11 pre-build and postbuild. Consistent. The three repaired Formation labels stand; the primary-source strip stands; nothing in this pass regresses those.

What I would do next, and stop

Lady Jessica personally runs M1–M14 in her sealing session and halts on any failure.

Ben receives an explicit halt-fail packet if any of M1–M14 fails; the candidate does not promote.

Ben continues to hold the Tier-1 human gate. Nothing in this pass attempts it.

Bean, Skybro, and any other terminal-receipt seats retain their standing responsibilities; no surface promoted may depend on a receipt that has not returned.

Not implement. Not stage. Not commit. Not push. Not deploy. Not touch schema, provider, secret, or credential. Not spend. Not generate new imagery. Not authorize alias promotion.

Relay metadata
json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "COMPUTER",
  "custody_token": "CUSTODY-COMPUTER-9DA4B5D7605D2C74CEFF492FF31BBFF6",
  "VERDICT": "PATCH — pass is doctrinally sound (Maria removal, selective real-object relief, three rooms inside one palette, humanized copy) and the release-attack finds no smuggling path; GO cannot issue from Computer's seat because six evidence artifacts E1–E6 (Maria-removal inventory, route-signature matrix, rendered evidence pack, exact candidate inventory JSON dated 2026-08-31, evidence markdown dated 2026-08-31, staged rollback plan) require Lady Jessica's personal reproduction under M1–M14. Attack surfaces four Maria-removal false-completeness vectors (reachable-but-not-top-imported, alt/meta text, analytics event names, fixture bleed) and four section-signature false-completeness vectors (room-classification drift, wrapper-only signature, blanket object imagery, transition boundary bleed) plus asset-path drift as new pass-specific hazard. Manifest, commit, deployment, and promotion order re-attacked; promotion remains manual and halts before alias movement on any candidate-smoke failure; rollback is one revert plus one alias re-point with no schema, provider, secret, or credential involvement. 14-step release-seal checklist provided.",
  "CONFIDENCE": "HIGH",
  "UNKNOWNS": "actual bytes of lib/copy.ts and the current route inventory; whether any MDX/alt/title/meta/analytics reference to Maria/bakery survives in the candidate; whether E2 route-signature matrix already exists or must be authored this cycle; whether any live route transitively imports a fixture module; whether Tier-1 has been unlocked in this candidate or remains excluded (packet does not say); whether Plaid remains sandbox-bound in this candidate; whether the candidate deployment target and alias-promotion command are already documented in Lady Jessica's runbook or must be added this cycle; whether Bean and Skybro receipts have returned since the 08-29 rotation",
  "source_packet_id": "TO_COMPUTER_VPGM_WERKLES_BVPGM_PRODUCTION_HUMAN_RHYTHM_20260831_v0.1_20260831-0510",
  "source_packet_file": "TO_COMPUTER_VPGM_WERKLES_BVPGM_PRODUCTION_HUMAN_RHYTHM_20260831_v0.1_20260831-0510.md",
  "nextActionHash": "5f2af4ceae635a69ba939b347cec66a0478babcafe748237cdb20fc11bcc6490",
  "currentStateHash": "78e580fb3019107585768920e8d2f5fc289e6533f4b1716081bea719d772242a"
}

---

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "harvested_by": "FOREMAN_CDP_HARVEST_V1",
  "source": "COMPUTER",
  "cousin": "COMPUTER",
  "VERDICT": "PATCH — pass is doctrinally sound (Maria removal, selective real-object relief, three rooms inside one palette, humanized copy) and the release-attack finds no smuggling path; GO cannot issue from Computer's seat because six evidence artifacts E1–E6 (Maria-removal inventory, route-signature matrix, rendered evidence pack, exact candidate inventory JSON dated 2026-08-31, evidence markdown dated 2026-08-31, staged rollback plan) require Lady Jessica's personal reproduction under M1–M14. Attack surfaces four Maria-removal false-completeness vectors (reachable-but-not-top-imported, alt/meta text, analytics event names, fixture bleed) and four section-signature false-completeness vectors (room-classification drift, wrapper-only signature, blanket object imagery, transition boundary bleed) plus asset-path drift as new pass-specific hazard. Manifest, commit, deployment, and promotion order re-attacked; promotion remains manual and halts before alias movement on any candidate-smoke failure; rollback is one revert plus one alias re-point with no schema, provider, secret, or credential involvement. 14-step release-seal checklist provided.",
  "CONFIDENCE": "HIGH",
  "UNKNOWNS": "actual bytes of lib/copy.ts and the current route inventory; whether any MDX/alt/title/meta/analytics reference to Maria/bakery survives in the candidate; whether E2 route-signature matrix already exists or must be authored this cycle; whether any live route transitively imports a fixture module; whether Tier-1 has been unlocked in this candidate or remains excluded (packet does not say); whether Plaid remains sandbox-bound in this candidate; whether the candidate deployment target and alias-promotion command are already documented in Lady Jessica's runbook or must be added this cycle; whether Bean and Skybro receipts have returned since the 08-29 rotation",
  "source_packet_id": "TO_COMPUTER_VPGM_WERKLES_BVPGM_PRODUCTION_HUMAN_RHYTHM_20260831_v0.1_20260831-0510",
  "source_packet_file": "TO_COMPUTER_VPGM_WERKLES_BVPGM_PRODUCTION_HUMAN_RHYTHM_20260831_v0.1_20260831-0510.md",
  "platform": "Perplexity",
  "role": "Doctrine / research cousin",
  "lane": "Synthesis, current-world checks, cited research — not unsourced deploy decisions.",
  "requested_action": "Independent red-team review — WERKLES_BVPGM_PRODUCTION_HUMAN_RHYTHM_20260831 v0.1. Findings only.",
  "target_files": "none — review only; this seat was not asked to change files",
  "DO_NOT": "No implementation, staging, push, deploy, schema, providers, secrets, credentials, spend, or new image generation.",
  "nextActionHash": "5f2af4ceae635a69ba939b347cec66a0478babcafe748237cdb20fc11bcc6490",
  "currentStateHash": "78e580fb3019107585768920e8d2f5fc289e6533f4b1716081bea719d772242a",
  "packet_sha256": "7af743817b1da97a49261289d165813662671009c3cc94fd6bf9c26b093fc02f",
  "submission_id": "VPGM:COMPUTER:7af743817b1d",
  "provider_route": "https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65",
  "native_thread_id": null,
  "custody": "CUSTODY_CHALLENGE_ECHOED__IDENTITY_PENDING",
  "custody_token_echoed": "CUSTODY-COMPUTER-9DA4B5D7605D2C74CEFF492FF31BBFF6",
  "receiver_computed_hash": null,
  "generated_at": "2026-08-31T05:16:04.876Z"
}
```

> `receiver_computed_hash` is null on purpose. The Foreman transported this text;
> the cousin did not compute and return the packet hash. Canon P.7 custody is
> therefore NOT proved by this file.

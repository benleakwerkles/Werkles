# FROM THUFIR HAWAT — VPGM

Harvested by the Foreman from the provider transcript over CDP. The cousin wrote
the answer; the transport was mechanical. Custody status below is not a claim
about what the cousin verified.

- Seat: Thufir Hawat / Perplexity (`COMPUTER` is the legacy transport ID only)
- Provider route: https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65
- Native thread ID: not exposed by provider
- Packet: TO_COMPUTER_VPGM_WERKLES_PRODUCTION_RELEASE_ROTATION_20260829_v1_20260829-1031.md
- PACKET_SHA256: 7d286eeb235db097034e333e90f090aaf407cdb9e5af4e431e140eebf71fe83e
- SUBMISSION_ID: VPGM:COMPUTER:7d286eeb235d
- Posted at: 2026-08-29T10:35:00.000Z
- Harvested at: 2026-08-29T10:38:04.030Z
- Extracted via: div.prose
- Reply sha256: 932808e11916e0e77acb686e7bfb198b2611d5c4069951e23d1a25c2d697e031
- Reply chars: 19313
- CUSTODY: CUSTODY_CHALLENGE_ECHOED__IDENTITY_PENDING — Receiver echoed the challenge nonce CUSTODY-COMPUTER-AEABD5B28D4E164BA3A9DC864E0C946F, which proves this response correlates to this packet. Still unproved: identity, route, capability, dependency. Correlation is not identity.

---

RECEIVED
CUSTODY_TOKEN: CUSTODY-COMPUTER-AEABD5B28D4E164BA3A9DC864E0C946F
COUSIN: COMPUTER
PACKET: TO_COMPUTER_VPGM_WERKLES_PRODUCTION_RELEASE_ROTATION_20260829_v1_20260829-1031.md
LANE_CHECK: IN_LANE — final independent doctrine attack on the sealed candidate; audit of evidence, manifest, test claims, provider boundaries, and rollback story; no edits, no staging, no commit, no push, no deploy, no schema, no providers, no secrets, no credentials, no spend.
BLOCKER: PARTIAL. Computer's sandbox cannot open the local tree, the release inventory JSON, or the evidence markdown, so this attack is written as an evidence-shaped audit against the packet's claims plus every prior receipt on this release path. Anything I flag "must-verify" is a step Lady Jessica personally runs before the seal; I do not authorize her to accept my check as substitute for that verification.

Doctrine reminder before the check: the promotion decision is Lady Jessica's alone. This receipt attacks; it does not clear. Where a claim is supported by prior receipts in this session's chain of custody, I say so; where it is claimed for the first time by this packet, I flag it as first-claim.

FROM_COMPUTER_WERKLES_PRODUCTION_RELEASE_ROTATION_20260829_v1.md
G1 — Verdict

PATCH.

The candidate looks disciplined against every prior doctrine attack in this session's receipt chain. The exact-manifest push discipline, the excluded migration, the practice-mode Ghost-response labeling, and the doctrine-safe verbatim member strings all match what prior receipts required. Nothing in the packet reads as a smuggling attempt on the promotion path.

I cannot issue GO because five specific claims in the packet are first-claim and cannot be independently verified from Computer's seat. Any one of them, if false at the sealing moment, changes the risk shape of the promotion. Each is a must-verify item Lady Jessica personally reproduces before staging.

STOP is not warranted; every packet-level claim is doctrinally consistent with the receipts trail, and every must-verify item resolves inside Lady Jessica's own workflow without provider action.

G2 — Unsupported or first-claim test, build, route, or provider claims

Five first-claim assertions. None is disproved. All require Lady Jessica's personal re-run before the seal.

MV1 — "TypeScript pass" at the exact candidate inventory scope. The packet asserts TypeScript passes on the candidate. Since the dirty tree is larger than the release, a repo-wide typecheck at the sealing moment could return either passing or failing due to files outside the 301-path manifest. Lady Jessica must run npx tsc --noEmit against the same working-tree state that produced digest e9659ca736e470b0cdefa7a5e3d7e591229299fd50ed5c2f5f323b78b44220d7 and confirm exit 0. If the release evidence markdown records a specific tsc invocation and output, that transcript is the artifact she staples to the seal.

MV2 — "40 candidate tests pass" scope. The claim is 40 tests, not "the whole suite." Two things must match at seal: (a) the 40 tests named in the evidence file are the 40 tests that actually exercised the release paths, and (b) the deprecated legacy device-draft browser smoke that expects older copy — flagged in the M11 postbuild receipt — is either excluded from the 40 or updated. If the 40 excludes it, that exclusion is a documented decision in the evidence file, not a silent skip. Lady Jessica must re-run the 40 and confirm output labels each spec by name.

MV3 — "Production build" completeness. A next build on the candidate must complete without errors and without any warning that would degrade a live route. Warnings from files outside the 301-path manifest are acceptable if and only if they cannot reach the served bundle. Lady Jessica must confirm the build output identifies no dynamic route that resolved to an excluded path, no missing environment variable that would cause a page to 500 in production, and no chunk that imports the excluded migration.

MV4 — "Local route smoke, member flow, and Formation desktop/mobile checks pass" identity. The three walks must match the doctrine invariants established in prior receipts: single #werkles-site-header per rendered route (sitewide header continuity postbuild), canonical primary nav label order, formation studio's three named regions and Formation Ledger doctrine, evidence-band vocabulary on Match Deck, and no aggregate score on partner-perspective or Personal Bellows. Lady Jessica must confirm the walks in the evidence markdown match these invariants line-for-line. Screenshots or DOM signatures per route are the strongest artifact.

MV5 — "Provider boundaries preserved." No provider is activated by this release. Every L-M provider slot must still be either not live yet or policy-blocked per the tech-stack runway receipt; every L-P runtime piece (PostHog, Expo Push, Supabase Postgres/Storage) must not be reachable in a member-visible verification path. Lady Jessica must grep the manifest for any evidence that PostHog or Expo Push code was newly reachable from a signed-in member route, and confirm the answer is none.

Two claims are strongly supported by the receipts chain and do not require re-verification by Lady Jessica:

The doctrine-safe copy pattern for the four persistence-state strings — inherited from Phase-2 identity persistence and the identity-spine source correction receipts.

The composition contract for Personal Bellows returning only both-accepted Formation Ledger lines with provenance — inherited from the formation-composition source-binding and the M11 postbuild receipts. The verbatim string Werkles recovered the latest answers saved in this browser. is consistent with the browser-only recovery invariant of that contract.

G3 — Attack on the 301-path manifest and temporary-index procedure

Three attack vectors against manifest contamination and the temporary-index workflow. All three resolve inside Lady Jessica's staging discipline; none authorizes any action on my part.

A1 — Dirty-tree contamination via git add . or a glob equivalent.
The packet already forbids git add .. The failure mode I attack against is the equivalent — any git add -A, any pathspec that resolves to more than the manifest, any git commit -a, or an IDE "stage all changes" click. Lady Jessica's staging must be strictly path-scoped, one path per line, matching the 301-path inventory byte-for-byte.

Verification pattern:

Read the manifest into memory and use it as the source of truth for git add.

After staging, run git diff --cached --name-only | sort and compare against the sorted manifest. Length must match; content must match. Difference of any kind is a contamination signal.

The excluded migration supabase/migrations/20260820073346_member_concierge_intakes.sql must not appear in the staged set even if it appears in the dirty tree.

A2 — Temporary-index procedure leaking between candidate and release.
A temporary index (e.g., git worktree, GIT_INDEX_FILE, or an ad-hoc branch) must be sealed against absorbing dirty-tree state. Two specific hazards:

The temporary index inherits stat cache entries from the main index and treats unstaged files as unchanged. Fix: git update-index --refresh inside the temporary index and confirm no unmanifested path is showing as staged.

A worktree checkout that shares reflog or hooks with the main worktree can trigger a pre-commit or post-commit hook that stages additional files. Fix: run git commit --no-verify in the temporary worktree and inspect hooks under .git/hooks/ in that worktree for any script that could add files.

A3 — Commit boundary drift.
The commit that ships the candidate must be exactly one commit against the parent baseline 93b79d128f33b27ca5c7d3f9b65d76ad74260c81. Verification patterns:

git rev-list --count 93b79d128f33b27ca5c7d3f9b65d76ad74260c81..HEAD returns 1 in the temporary worktree at seal time.

git diff-tree --no-commit-id --name-only -r HEAD | sort matches the manifest byte-for-byte.

The commit message names the digest of the inventory JSON and the digest of the tree, so any later re-derivation can confirm identity.

If any of A1–A3 fires at seal time, Lady Jessica returns to Bean or Heimerdinker for reconciliation before continuing. She does not proceed.

G4 — Live plan halt behavior before alias promotion

The packet defines the sequence: exact-manifest stage → commit → push → deploy a candidate → promote → live smoke. The doctrine question is whether the promotion step is gated by the candidate smoke passing, not the other way around.

Attack, then confirmation:

The promotion must be executed only after the candidate smoke passes. Deploying a candidate to a preview URL and running the live smoke against that preview URL must precede any alias promotion. Alias promotion runs the candidate against production traffic; if the smoke fails after promotion, the members experience the failure. Lady Jessica's runbook must therefore stage the promotion step as a manual, human-gated command that she executes only after the candidate-URL smoke returns clean.

The smoke set must exercise every verbatim member string in this packet.

Apply the partner's synthetic response — reachable only where the Ghost-response control is exposed; must render with Practice response only. A real member would have to review and accept their own answer. in immediate visual proximity.

Saved on this device — must render only where the persistence state is browser-local; must not render where auth is kind === 'account' and Tier-1 is unlocked.

Werkles recovered the latest answers saved in this browser. — must render only during a browser-recovery restore path; must never appear where account-saved copy renders.

Funds verified — date only; no public balance ranking — must render only where Plaid has produced a narrow, dated Backer-lane eligibility fact; must not render on any surface where no such fact exists. Note: this string is a load-bearing doctrine claim in the copy layer. Lady Jessica's smoke must confirm the string is honest to the runtime — i.e., that a Plaid production call actually occurred or, if it did not, that the string is not rendered.

The rollback story must be one revert plus one alias revert. Since no schema, no provider, and no secret changed, rollback is:

git revert <candidate_commit> on production baseline to prepare a rollback commit, and

alias re-point back to the pre-promotion deployment.
Neither step requires a database restore, a provider dashboard change, or a credential rotation. Rollback SLA target should be minutes, not hours. Lady Jessica confirms she has both commands staged in her runbook before the promotion step.

Halt point. Any failure in the candidate smoke — one string mismatch, one console error, one 500, one route that fails to render #werkles-site-header exactly once — is a hard halt. The runbook does not include a "promote anyway" branch. If the candidate smoke fails, the temporary worktree is discarded, the candidate deployment is deleted or left un-promoted, and the alias never moves. This is the exact discipline the packet requires by naming Lady Jessica as the sole promotion seat.

Confirmation: as described, the live plan stops before alias promotion if candidate smoke fails. My attack finds no route to alias promotion that bypasses the smoke step in the doctrine as stated. What I cannot verify from my seat is whether the physical runbook file Lady Jessica executes has the smoke step earlier than the promotion step. Must-verify: Lady Jessica visually confirms the order of steps in her own runbook before staging.

M — Evidence Lady Jessica must personally re-run before the seal

Ordered so a failure at any step halts the seal:

M1 — Manifest identity. Compute the sha256 of foreman/releases/WERKLES_BVPGM_RELEASE_CANDIDATE_INVENTORY_20260829.json locally and confirm it equals e9659ca736e470b0cdefa7a5e3d7e591229299fd50ed5c2f5f323b78b44220d7 character-for-character.

M2 — Staged-set identity. In her temporary worktree, git diff --cached --name-only | sort must equal the sorted manifest exactly. Any diff is a halt.

M3 — Excluded migration confirmation. git diff --cached --name-only | grep 20260820073346_member_concierge_intakes.sql returns empty. Any hit is a halt.

M4 — TypeScript pass. npx tsc --noEmit at the exact candidate commit returns exit 0. Any non-zero is a halt.

M5 — Production build. npm run build (or the tree's equivalent) at the candidate commit completes without error and without warnings that would degrade a live route. Any error, or warning that names an included manifest path or the alias-promoted route set, is a halt.

M6 — 40 candidate tests. Re-run the exact 40 tests named in the evidence file. Confirm each spec by name and each result. Any failure is a halt. Any missing spec is a halt.

M7 — Local route smoke, member flow, Formation desktop/mobile. Re-walk the three checks. For each rendered route, confirm one #werkles-site-header, canonical primary nav order, no unexpected 500/404, no console errors, and doctrine-safe strings per §G4.

M8 — Ghost-response labeling. For every surface where the synthetic Ghost-response control renders, confirm Practice response only. A real member would have to review and accept their own answer. is rendered in the same visual unit and cannot be missed. Any surface where the practice-mode label is a caption or hidden without scroll is a halt.

M9 — Persistence-state string matrix. On the candidate URL after promotion is prepared but before promotion is executed:

Anonymous → Not saved yet. or the packet's Saved on this device where applicable; never Saved to your Werkles account.

Preview → never Saved to your Werkles account. (identity-spine correction invariant).

Account with Tier-1 unlocked → this release does not enable Tier-1; therefore, Saved to your Werkles account. must not render anywhere in the candidate smoke. If it renders, halt.

M10 — Funds-verified string audit. On any Crucible surface that could render Funds verified — date only; no public balance ranking, confirm the string is coupled at runtime to an actual Plaid production call. If Plaid remains sandbox-bound in this release, the string must be suppressed everywhere. Any surface rendering the string without a matching Plaid production-call receipt is a halt and a doctrine violation.

M11 — Commit boundary. git rev-list --count 93b79d128f33b27ca5c7d3f9b65d76ad74260c81..HEAD returns 1 in the sealing worktree.

M12 — Rollback readiness. git revert command for the candidate commit is staged in the runbook, and the alias re-point command is staged in the runbook, before promotion begins.

If any of M1–M12 fails, Lady Jessica halts. She does not push, does not deploy, does not promote. She returns to Ben with the specific failure. This is not a suggestion; it is the doctrine the release rotation was built on across the prior receipts.

Cross-check against prior receipts

Formation post-build; formation visual redesign post-build. Consistent. Formation Ledger's "only mutual decisions cross this line" holds; the Ghost-response control's practice-mode label matches the partner-perspective postbuild Lock-1 discipline.

Ranking/privacy postpatch seal. Consistent. No wealth ranking, no aggregate score, no forbidden-input field. The verbatim string no public balance ranking in the Crucible copy directly enforces the no-wealth-ranking doctrine on the surface layer.

Sitewide header continuity postbuild. Consistent. Single #werkles-site-header per route is a smoke item at M7.

Phase-2 identity persistence; identity-spine source correction. Consistent. The excluded migration confirms Tier-1 is not unlocked in this release; Saved to your Werkles account. must therefore not render — enforced at M9.

Complete tech-stack runway. Consistent. Every provider stays in its declared L-M or L-P state; no member-facing verification surfaces are activated beyond what prior receipts already noted; M5 and MV5 enforce this.

BVPGM copy continuity source-ready; BVPGM M11 pre-build and postbuild. Consistent. The three repaired Formation labels (What each of you is putting in, Money questions for an adviser, Who owns the work) and the Personal Bellows primary-source strip are downstream of the receipt chain and remain doctrine-safe.

What I would do next, and stop

Lady Jessica personally re-runs M1–M12 in her sealing session and halts on any failure.

Bean's Ghost-response practice-mode label pass and Skybro's voice/tone pass remain delivery-owed per the packet's admitted gap; nothing in this release should be promoted that depends on those receipts being terminal. If any surface in the smoke reads as if it needs Bean or Skybro to have signed, that surface is not ready to promote.

Ben continues to hold the Tier-1 human gate.

Not implement. Not touch provider settings. Not credential. Not env edit. Not schema. Not RLS. Not SQL. Not push. Not deploy. Not add a new task, agent, subagent, or model. Not issue a final release approval. Not authorize alias promotion.

Relay metadata
json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "COMPUTER",
  "custody_token": "CUSTODY-COMPUTER-AEABD5B28D4E164BA3A9DC864E0C946F",
  "VERDICT": "PATCH — candidate is doctrinally consistent with the receipts chain; five first-claim assertions (TypeScript pass, 40 test scope, production build completeness, three walks matching invariants, provider boundaries preserved) require Lady Jessica's personal re-run under M1–M12. Manifest contamination attack surfaces three staging risks (A1 dirty-tree pathspec, A2 temporary-index leaks, A3 commit-boundary drift), each resolvable inside her staging discipline. Live plan halts before alias promotion if candidate smoke fails; halt conditions include any string mismatch, console error, 500, or missing single-header render. Funds-verified string must not render unless a Plaid production call actually occurred; Saved-to-your-Werkles-account string must not render because Tier-1 is not unlocked in this release. Rollback story is one revert plus one alias re-point; no schema, provider, secret, or credential mutation. Bean and Skybro receipts remain delivery-owed; no surface promoted may depend on them being terminal.",
  "CONFIDENCE": "HIGH",
  "UNKNOWNS": "actual bytes of the release inventory JSON and evidence markdown; whether the 40 tests include or exclude the deprecated legacy device-draft browser smoke; whether the candidate build reachably imports the excluded migration path via any test or bundle chunk; whether Lady Jessica's physical runbook orders candidate smoke before alias promotion; whether the Crucible surface currently renders the funds-verified string when Plaid remains sandbox-bound; whether the temporary-index procedure disables pre-commit and post-commit hooks; whether any surface in the smoke depends on Bean or Skybro terminal receipts",
  "source_packet_id": "TO_COMPUTER_VPGM_WERKLES_PRODUCTION_RELEASE_ROTATION_20260829_v1_20260829-1031",
  "source_packet_file": "TO_COMPUTER_VPGM_WERKLES_PRODUCTION_RELEASE_ROTATION_20260829_v1_20260829-1031.md",
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
  "VERDICT": "PATCH — candidate is doctrinally consistent with the receipts chain; five first-claim assertions (TypeScript pass, 40 test scope, production build completeness, three walks matching invariants, provider boundaries preserved) require Lady Jessica's personal re-run under M1–M12. Manifest contamination attack surfaces three staging risks (A1 dirty-tree pathspec, A2 temporary-index leaks, A3 commit-boundary drift), each resolvable inside her staging discipline. Live plan halts before alias promotion if candidate smoke fails; halt conditions include any string mismatch, console error, 500, or missing single-header render. Funds-verified string must not render unless a Plaid production call actually occurred; Saved-to-your-Werkles-account string must not render because Tier-1 is not unlocked in this release. Rollback story is one revert plus one alias re-point; no schema, provider, secret, or credential mutation. Bean and Skybro receipts remain delivery-owed; no surface promoted may depend on them being terminal.",
  "CONFIDENCE": "HIGH",
  "UNKNOWNS": "actual bytes of the release inventory JSON and evidence markdown; whether the 40 tests include or exclude the deprecated legacy device-draft browser smoke; whether the candidate build reachably imports the excluded migration path via any test or bundle chunk; whether Lady Jessica's physical runbook orders candidate smoke before alias promotion; whether the Crucible surface currently renders the funds-verified string when Plaid remains sandbox-bound; whether the temporary-index procedure disables pre-commit and post-commit hooks; whether any surface in the smoke depends on Bean or Skybro terminal receipts",
  "source_packet_id": "TO_COMPUTER_VPGM_WERKLES_PRODUCTION_RELEASE_ROTATION_20260829_v1_20260829-1031",
  "source_packet_file": "TO_COMPUTER_VPGM_WERKLES_PRODUCTION_RELEASE_ROTATION_20260829_v1_20260829-1031.md",
  "platform": "Perplexity",
  "role": "Doctrine / research cousin",
  "lane": "Synthesis, current-world checks, cited research — not unsourced deploy decisions.",
  "requested_action": "Independent red-team review — WERKLES_PRODUCTION_RELEASE_ROTATION_20260829 v1. Findings only.",
  "target_files": "none — review only; this seat was not asked to change files",
  "DO_NOT": "No edits, staging, commit, push, deploy, schema, providers, secrets, credentials, or spend.",
  "nextActionHash": "5f2af4ceae635a69ba939b347cec66a0478babcafe748237cdb20fc11bcc6490",
  "currentStateHash": "78e580fb3019107585768920e8d2f5fc289e6533f4b1716081bea719d772242a",
  "packet_sha256": "7d286eeb235db097034e333e90f090aaf407cdb9e5af4e431e140eebf71fe83e",
  "submission_id": "VPGM:COMPUTER:7d286eeb235d",
  "provider_route": "https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65",
  "native_thread_id": null,
  "custody": "CUSTODY_CHALLENGE_ECHOED__IDENTITY_PENDING",
  "custody_token_echoed": "CUSTODY-COMPUTER-AEABD5B28D4E164BA3A9DC864E0C946F",
  "receiver_computed_hash": null,
  "generated_at": "2026-08-29T10:38:04.030Z"
}
```

> `receiver_computed_hash` is null on purpose. The Foreman transported this text;
> the cousin did not compute and return the packet hash. Canon P.7 custody is
> therefore NOT proved by this file.

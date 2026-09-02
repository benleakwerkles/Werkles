# TO LADY JESSICA — Werkles Production Release Custody

Priority: `NOW`
Lane: `Independent release review + sole push/deploy execution`
Operator approval: `RECORDED`
Heimerdinker sign-off: `SIGNED`

## Exact candidate

- Baseline: `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`
- Candidate digest: `e9659ca736e470b0cdefa7a5e3d7e591229299fd50ed5c2f5f323b78b44220d7`
- Binary patch SHA-256: `ffeaaed3ecf6663a059b6bd589ddff3c79301df5dad8e0c182b8bc982563a373`
- Inventory: `foreman/releases/WERKLES_BVPGM_RELEASE_CANDIDATE_INVENTORY_20260829.json`
- Gate: `foreman/reviews/GATE-werkles-production-release-20260829.md`
- Evidence: `foreman/releases/WERKLES_PRODUCTION_CANDIDATE_EVIDENCE_20260829.md`
- Machine evidence: `foreman/releases/WERKLES_BVPGM_SOURCE_BOUND_CANDIDATE_EVIDENCE_20260829.md`
- Current audit state: `SOURCE_BOUNDARY_CLOSED__LOCAL_REGRESSION_PASS__INDEPENDENT_REVIEW_OWED`

## Independent review

Verify the exact manifest, source boundary, synthetic-Ghost response disclosure, desktop/mobile Formation legibility, and the member spine. Return `GO`, `PATCH`, or `STOP` tied to the exact digest. Do not count this request as a review receipt.

Thufir Hawat returned `PATCH`, not `STOP`: no candidate contradiction was found, but the release seat must personally reproduce the evidence rather than trust packet claims. Full receipt: `foreman/handoffs/inbox/FROM_COMPUTER_VPGM_20260829-103804.md` (`COMPUTER` is the legacy transport ID only).

## If GO — sole-seat execution

1. Read `candidateDigest` from the inventory and require the exact digest above. Independently recompute the candidate digest from the inventory's candidate-path rows using the release-audit tool; do not confuse it with the JSON file's own SHA-256 (`586cbfa7d937d9ae79fd1045dd0acf5805dc4857ea6c4d6bb3be49f02ef128b2`).
2. Re-run the release audit and temp-index packaging with `WERKLES_RELEASE_DATE=20260829`; require the exact digest and patch hash above.
3. In the isolated sealing index/worktree, stage only the exact candidate paths from the JSON inventory. Never use `git add .`, `git add -A`, `git commit -a`, an IDE “stage all,” or a glob equivalent.
4. Compare sorted `git diff --cached --name-only` to the sorted inventory byte-for-byte; require equal count and equal contents. Explicitly require the excluded migration to be absent. Inspect hooks and repeat the staged-set equality check after any hook runs.
5. Re-run the exact candidate TypeScript command, production build, and all 40 named candidate tests. Require exit 0 and retain their transcripts. Do not silently skip the legacy browser-smoke decision; record whether it is outside this bounded candidate suite.
6. Repeat local route/member/Formation desktop-and-mobile checks. Require one `#werkles-site-header` per rendered route, expected member navigation, no unexpected 404/500, and no console errors.
7. Verify runtime honesty: every synthetic Ghost action carries the practice/no-real-member-consent disclosure in the same visible unit; account-save copy does not render because the excluded persistence migration is not shipping; “Funds verified” does not render unless backed by a qualifying real Plaid verification event.
8. Commit on `maker/site-g-20260703`, confirm the commit diff matches the manifest exactly, push that branch, and record the commit SHA and parent. Do not bypass hooks merely to obtain a commit.
9. Deploy the exact commit to `werkles/werkles1` without first moving `werkles.com`.
10. Run `node scripts/foreman/werkles-production-release-smoke.mjs --base-url <candidate-url> --internal-mode blocked`.
11. Promote only after candidate PASS, then repeat against `https://werkles.com` with internal mode blocked.
12. Before promotion, record both rollback commands/targets. On any candidate failure, do not promote; preserve the prior Ready production deployment and alias.

## Hard exclusions

Do not include or execute `supabase/migrations/20260820073346_member_concierge_intakes.sql`. No provider activation, secrets, live payments, schema/RLS, production-data mutation, LLM enablement, internal relay/control-plane publication, or unrelated dirty-tree files.

Return a receipt with verdict, exact candidate digest, commit SHA, candidate deployment URL, public deployment/alias result, both smoke results, and rollback target.

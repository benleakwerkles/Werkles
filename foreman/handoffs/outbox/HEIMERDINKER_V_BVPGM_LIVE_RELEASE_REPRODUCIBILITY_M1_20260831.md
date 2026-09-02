# BVPGM — live release reproducibility and acceptance closure M1

Date: 2026-08-31
Foreman: Heimerdinker@Betsy
Execution context: LOCAL_SALLY_WINDOWS
Larger checkpoint: make the live human-rhythm release reproducible from Git,
independently inspect its member-facing acceptance targets, and close the release
record without widening into unrelated dirty-tree work.

## Current evidence

- Production is live from commit `b7098196c299a51f09ecffb070223bf06636cadc`.
- Lady Jessica returned terminal GO and production smoke PASS.
- The Git-triggered preview failed because
  `app/operator/gate-knockout/sign-in-hunt/page.tsx` still names retired provider
  tiers in the commit.
- The canonical working tree already contains the narrow compatibility repair;
  it was used by the successful archive deployment but is not committed.
- Nothing is staged. The surrounding dirty tree remains outside this slice.

## Broad workstreams

1. **Reproducible release** — seal the one-file tier-name compatibility patch,
   prove typecheck/build, and return it to Lady Jessica for sole-seat exact-path
   stage, commit, push, Git-builder proof, promotion only if a new production
   build is necessary, and live smoke.
2. **Member acceptance** — independently inspect Maria retirement, selective
   real-object relief, People/Bellows/Proof tonal differentiation, header
   continuity, and route readability at desktop and phone widths.
3. **Trust/copy continuity** — attack fake verification implications, internal
   release language, repeated page-purpose copy, and any route that still feels
   like an internal worksheet rather than a member product.
4. **Release custody** — keep packet delivery, response, validated receipt,
   assimilation, staging, push, deployment, and live proof as separate states.

## Hard edges

- No new subagents, environments, branches, worktrees, schemas, providers,
  credentials, secrets, production-data mutations, or spend.
- No `git add .`, `git commit -a`, stage-all UI, or unrelated dirty-tree paths.
- Heimerdinker does not push or deploy. Lady Jessica remains sole push/deploy
  seat under the existing Ben + Heimerdinker + Lady Jessica three-key custody.
- The current Operator phrase, “PUsh that shit live, Heimerdinker! BVPGM”, is
  authority for this bounded reproducibility follow-up, not a wider release.

## Rotation

- Ender: live member experience and visual/copy acceptance attack.
- Bean: trust, verification, and misleading-claim attack.
- Thufir Hawat: deployment/reproducibility evidence attack.
- Lady Jessica: exact one-file seal, sole-seat release mechanics, terminal
  receipt.
- Heimerdinker: integrate returned findings, run local proofs, and keep the
  release record honest.

## Stop condition

Close M1 only when the Git-triggered Vercel build is Ready from a commit that
contains the compatibility fix, live routes remain healthy, and Lady Jessica's
terminal receipt is harvested and validated; otherwise return a terminal
PATCH/STOP with exact evidence.

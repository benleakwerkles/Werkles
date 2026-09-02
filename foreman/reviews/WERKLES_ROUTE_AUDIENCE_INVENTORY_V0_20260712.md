# Werkles Route Audience Inventory V0

Status: `WORKING BOUNDARY - LOCAL ONLY`

## Public product routes

Anonymous visitors may intentionally reach these routes. They must use customer language and are covered by the public-copy guard.

- `/`
- `/spark`
- `/space`
- `/formation`
- `/proof`
- `/bellows`
- `/bellows/intake`
- `/bellows/recommendations`
- `/discovery`
- `/archetypes`
- `/pricing`
- `/membership`
- `/login`
- `/signup`

## Authenticated member/account routes

These may describe member state and unavailable capabilities, but must not expose implementation paths, secrets, Git operations, founder-specific gates, or operator instructions.

- `/onboarding`
- `/auth/callback`
- `/dashboard`
- `/dashboard/profile`
- `/dashboard/blueprints`
- `/dashboard/blueprints/[id]`
- `/dashboard/intros`
- `/dashboard/billing`
- `/dashboard/crucible`
- `/membership/success`

## Operator-only routes

All `/operator/**` routes are internal operating surfaces. Their internal vocabulary is appropriate only behind operator authorization. URL naming is not authorization; the access boundary must be verified separately.

## Internal console families

These routes are not public product marketing and should be protected, disabled outside development, or moved behind an operator boundary before public launch:

- `/thinkit`
- `/tinkerden/**`
- `/soledash`
- `/gd/**`
- `/nerdkle`

## Prototype/example routes

These are useful for development but should not be discoverable as ordinary public navigation:

- `/bellows/recommendations/test-case-0`
- `/proof/den`
- `/proof/goop-cycle`

## Boundary findings

1. Public copy previously exposed founder identity and internal matching machinery; the first cleanup removed those leaks from high-traffic Matching routes.
2. Anonymous localhost probes returned HTTP 200 for `/operator`, `/operator/matching/shadow`, `/thinkit`, `/tinkerden`, `/soledash`, and `/nerdkle`. `/gd/command-console` returned a 307 redirect to a local console. Route naming is currently organization, not proven access control.
3. Example and visual-proof routes need an explicit production policy: publish as understandable demos, protect as previews, or disable.
4. Member pages require authenticated browser QA in addition to anonymous route scans.

## Next implementation order

1. Keep the anonymous public allowlist small and regression-tested.
2. Add and verify server-side authorization for `/operator/**` and internal console families before treating them as private.
3. Decide the production disposition of each prototype route.
4. Add authenticated member-copy tests using a dedicated non-production ghost member.
5. Only then broaden public navigation.

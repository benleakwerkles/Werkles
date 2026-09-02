# Werkles Public Content Boundary Cleanup

Status: `FIRST PASS COMPLETE - LOCAL ONLY`

## What changed

- Removed founder-specific `Ben must approve` labels from customer recommendation components.
- Replaced public `human gate` / operator language with role-based review language.
- Rewrote Bellows intake instructions in customer language.
- Removed Speaker, Squibb, engine, shadow-go-live, packet, JSON, and filesystem-path details from rendered Bellows intake and recommendation surfaces.
- Rewrote Discovery's internal architecture explanation as a plain promise about reasons, uncertainty, and user choice.
- Rewrote member-dashboard availability copy so it no longer exposes test keys, routes, Git operations, or founder approval mechanics.
- Rewrote the public billing-unavailable message without naming Ben or Stripe gate internals.

## Proof

- `npm.cmd run typecheck`: PASS.
- Targeted public-content leak scan: PASS.
- Browser ghost `/bellows/intake`: PASS; no targeted internal/personal terms rendered.
- Browser ghost `/discovery`: PASS; no targeted internal/personal terms rendered.
- Browser ghost `/bellows/recommendations`: PASS; no targeted internal/personal terms or file paths rendered.
- `/dashboard`: redirected to login, so dashboard cleanup is typecheck/static-proven but not authenticated-browser-proven in this cycle.

## Ben test card

1. Open `http://localhost:3000/bellows/intake` as a first-time visitor.
2. Confirm the page explains what to share and what comes back without asking you to understand internal systems.
3. Open `http://localhost:3000/discovery` and confirm the promise feels clear and non-automatic.
4. Open `http://localhost:3000/bellows/recommendations` and confirm approval language is role-based and no file paths/packets are shown.
5. Sign in and inspect `/dashboard`; report any remaining text that sounds like an engineering console.

## Remaining audit

This was the high-traffic Matching/member first pass. A later public-route inventory should classify and either hide, protect, or rewrite prototype routes such as visual test pages and any internal consoles that are presently reachable without an operator boundary.

No push or deployment was performed.

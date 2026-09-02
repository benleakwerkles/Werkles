# Codex member walkthrough route attack

Date: 2026-08-14

Lane: authenticated member navigation and Concierge Page 0

Status: local read-only attack inventory plus offline contract; no release authority

This is an unnamed local-worker review. It does not stand in for any named CBCC seat.

## Result

The literal-route layer is healthy: 96 literal internal UI links and eight model-produced links across the selected member walkthrough sources resolve to 17 existing destinations. The core loop is mechanically connected:

`/dashboard` → `/bellows/intake` → `/bellows/recommendations` → `/dashboard/intros` or `/dashboard/crucible`.

Concierge Page 0 still loads its walkthrough and Speaker fixtures, renders five diagnostic cards, retains both return links, and states that it performs no matching or candidate selection.

The attack found five review findings in three categories. None is a missing route or CSS issue.

## Route inventory

| Surface | Primary exits | Route file | Auth posture observed |
|---|---|---|---|
| Member home | intake, recommendations, Page 0, profile, workshops, intros, Crucible | `app/dashboard/page.tsx` plus client | Hybrid preview-cookie/client Supabase check |
| Profile | member home, workshops, intros, Crucible, proof | `app/dashboard/profile/page.tsx` | Client Supabase checks inside page |
| Workshops | member home, profile, intros, intake, Crucible | `app/dashboard/blueprints/page.tsx` | No route-level/member guard marker |
| Workshop detail | member home, workshops, intros, profile | `app/dashboard/blueprints/[id]/page.tsx` | No route-level/member guard marker |
| Recommendation / intros | member home, profile, workshops, Crucible | `app/dashboard/intros/page.tsx` | No route-level/member guard marker; reads browser-owner cookie |
| Crucible | member home, profile, billing, pricing, intake, proof, recommendations | `app/dashboard/crucible/page.tsx` | `DashboardAuthGuard` |
| Billing | member home, membership, pricing, Crucible, profile | `app/dashboard/billing/page.tsx` | Client Supabase check |
| Concierge Page 0 | Bellows, intake | `app/bellows/recommendations/test-case-0/page.tsx` | Deliberately public example |

## Findings

### 1. Enabled action can degrade to a hash dead zone

`ActionButton` in `app/dashboard/intros/page.tsx` renders an enabled action with `href={action.href ?? "#"}`. Current model branches appear to provide destinations, but the type permits an enabled action without one. A future branch or malformed model then produces a button that changes no page and gives no recovery signal.

Recommended narrow repair: make `enabled: true` require a concrete internal `href` in the model contract, and fail closed to the existing disabled treatment when the invariant is violated. Do not retain `#` as a fallback.

### 2. Member navigation crosses three inconsistent auth boundaries

`/dashboard/blueprints`, `/dashboard/blueprints/[id]`, and `/dashboard/intros` have no visible `DashboardAuthGuard`, `requireUser`, auth lookup, or redirect marker, while adjacent member destinations use three different patterns. This is both an access-review problem and a walkthrough dead zone: a signed-out or expired-session member can traverse navigation and receive materially different behavior depending on which card they choose.

This packet does not claim a data leak. The recommendation view is browser-owner-cookie bound and may render an empty state. The finding is inconsistent member-boundary behavior, which needs one explicit policy before implementation.

Recommended narrow repair: select one reviewed member-route guard contract and apply it to all `/dashboard/*` member surfaces. Preserve the Ghost Fleet local walkthrough exception explicitly rather than introducing route-by-route bypasses.

### 3. Concierge Page 0 still exposes internal fixture identity

The public route and metadata still say `/bellows/recommendations/test-case-0` and `Concierge User #0`. The component hero also exposes `User #0`. This is the exact P1 regression previously recorded by Lady Jessica: a public example is presented as an internal fixture rather than a believable sample person.

Recommended narrow repair: choose a real sample name and clean slug, add a redirect from the old slug, then update all inbound links together. Keep `testCaseId: "0"` internal if fixtures still need it; do not render it publicly.

## Attack cases retained by the offline contract

- every selected literal internal UI link and model-produced action link must resolve to an App Router page;
- the core member/intake/recommendation/Crucible destinations cannot silently disappear;
- Concierge Page 0 must load both fixture halves and render exactly five diagnostic cards;
- Page 0 must retain its Bellows and intake recovery links;
- Page 0 must retain the no-matching/no-candidate truth boundary;
- semantic review flags report hash fallback, public fixture identity, and missing auth markers without treating them as proven data leaks.

Executable check:

```powershell
node scripts/foreman/member-walkthrough-route-inventory-smoke.mjs
```

## Boundaries

No CSS, page redesign, authentication implementation, redirects, provider calls, environment changes, schema work, staging, commit, push, deploy, or production action occurred.

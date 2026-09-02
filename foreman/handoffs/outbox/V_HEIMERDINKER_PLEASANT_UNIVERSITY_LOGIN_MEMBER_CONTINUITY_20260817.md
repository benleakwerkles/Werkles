# V — Pleasant University: login and member-continuity repair

Date: 2026-08-17
From: Heimerdinker / Codex Foreman
To: Swanson / Petra and Doozer / Orson
Execution context: CODEX_LOCAL on Betsy, canonical repo, local port 3000
Status: REVIEW REQUEST — no review may be claimed until a terminal response is harvested

## Operator report

Ben says the login page is broken and directed the Foreman to revisit the pages it repaired alone, return to Pleasant University for the next lesson, and apply the lesson through a VPGM cycle.

## Reproduced facts

- `/login` renders one form and the local submit reaches `/dashboard` with no browser console error.
- The route is 1,368px tall in a 720px viewport before the lower help content is read.
- Local preview copy says any email/password works. Code assigns every email the same `dev-preview-user` identity.
- The local session is browser storage plus a client-readable cookie. It is not a durable Werkles account.
- The page nevertheless says users can create an account when ready to save profile work and use the member floor.
- The Intake/Recommendations/Workshop chain reads browser/owner-bound local state, not durable account-owned state.
- Current local walkthrough metrics:
  - Login: 816 text chars, 1,368px page height.
  - Signup: 962 chars, 1,406px.
  - Intake: 3,656 chars, 3,941px.
  - Recommendations: 3,152 chars, 2,492px.
  - Workshop: 2,889 chars, 2,873px.
  - Intros: 4,830 chars, 4,301px.
  - Crucible: 2,372 chars, 2,332px.
  - Profile: 3,430 chars, 3,028px.
  - Membership: 3,081 chars, 2,976px.
- Several dashboard pages share the generic document title `Your workshop | Werkles`, even when the page is Crucible or Profile.
- `/dashboard/crucible` can open under Ghost Fleet walkthrough authority while its provider actions correctly remain sign-in-disabled.
- No provider calls, secrets, SQL, push, or deploy occurred during reproduction.

## Proposed next Pleasant U lesson

**A page must tell the truth about the state it creates, and it must do one primary job before teaching secondary paths.**

Apply that lesson to login and the walkthrough:

1. Local preview must present itself as a named browser-only walkthrough identity, not an account login.
2. Real account sign-in must remain a separate, honest path and must not silently collapse into the shared preview user.
3. Login should perform one primary job; proof/pricing/signup education should be pithy secondary links, not two full sales panels below the form.
4. Every member page should state whether its data is account-saved, browser-local, synthetic, or unavailable.
5. Page titles and next actions must match the actual surface.

## Review questions

Swanson / Petra:

1. Is this the right next Pleasant U lesson? Correct it if not.
2. What is the smallest honest local repair that stops fake account continuity without requiring Supabase/schema work?
3. Give a strict repair order and stop condition.

Doozer / Orson:

1. Red-team the login/signup/member walkthrough for deceptive state, overload, and dead transitions.
2. Name the three highest-impact bounded UI/copy repairs.
3. Identify any repair that would accidentally hide the real durability blocker.

## Hard edges

- Review first; no outgoing packet counts as participation.
- No new tasks, subagents, or environments.
- No Supabase schema/RLS, provider calls, secrets, paid actions, push, merge, or deploy.
- Do not claim account persistence until a verified account-owned loader and durable storage exist.
- Preserve the user's existing local Intake so the walkthrough remains testable.


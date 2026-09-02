# V — Member Intake Account Custody

Date: 2026-08-20
Foreman: Heimerdinker / Codex
Lane: Werkles member Intake → Recommendations continuity
Environment: CODEX_LOCAL on Betsy

## Vision

A signed-in member submits Intake once and the same latest submission follows that verified account into Recommendations, Workshop, Intros, and future matching. Browser storage may preserve an unfinished draft, but it is never described or treated as account custody.

## Immediate defect

- Intake submissions are stored in repo-local files and selected by an owner cookie.
- recommendation work artifacts use `sessionStorage` and disappear with the tab.
- local `gimprobotester` is a shared preview identity rather than a verified Supabase account.
- the member has repeatedly re-entered answers and must not be asked to do so again.

## This pass

1. Recover the latest local member Intake without rewriting answers.
2. Draft the dedicated Supabase member-Intake table, owner RLS, and verification tests.
3. Wire authenticated request-scoped save/read code up to—but not through—the SQL/RLS human gate.
4. Make local continuity automatic across the Werkles walkthrough while preserving honest labels.
5. Route focused Bean, Ender, and Lady Jessica packets and count only returned receipts.

## Hard edges

No SQL/RLS apply, production mutation, secret inspection, provider call, push, deploy, or claim that local preview storage is an account.


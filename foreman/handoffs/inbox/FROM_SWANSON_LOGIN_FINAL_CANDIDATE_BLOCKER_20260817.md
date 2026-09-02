# Swanson / Petra — Login final-candidate blocker

Date: 2026-08-17
Response ID: `8de98427-dfcb-49b6-bf8a-2ec837806835`
Personal review: YES
Subagents: NO
Mutation: NONE
Candidate ZIP SHA-256:
`b36c80c417db349a655b1ad1f97f1ae711affba4bfb2347a160ae529ae84c01d`
Source verification: PASS for all eleven supplied files
Verdict: `BLOCKER`

## Blocker

`app/login/page.tsx` sanitized the local-preview server redirect but passed the
real Supabase-login `?next=` value directly to `router.replace`. Absolute,
protocol-relative, backslash, and non-path scheme inputs therefore lacked the
same fail-closed rule.

## Assimilation

The client real-login path now applies an explicit single-slash local-path rule,
preserves valid local paths and query strings, and falls back to Dashboard for
all four hostile classes. The unused preview-auth import was removed and the
focused contract/browser attacks were expanded. Exact re-review was dispatched
to the same Swanson task.


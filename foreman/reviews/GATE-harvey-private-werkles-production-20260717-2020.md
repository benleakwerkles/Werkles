# Gate Review - Private Harvey at Werkles.com

Decision: `APPROVED_FOR_PRIVATE_DEPLOYMENT_PREP`

Decision time: `2026-07-17T20:20:26-04:00`

Confidence: `HIGH` for the access boundary; `LOW` for the unresolved provider binding

## Operator approval

> Make me a secure private harvey page at Werkles.com. Use my Juryduty password
> (blind) as the password. Then give me the Harvey address so I don't have to
> keep asking for it. Don't make it public.

This authorizes a private Harvey route at `https://werkles.com/harvey`. It does
not authorize exposing, printing, storing in Git, or relaying the Juryduty
password. Ben remains the only person allowed to type that password into the
local blind setup prompt.

## Confidence justification

- The production build and TypeScript checks pass.
- An exact staged-tree build passes in a clean detached worktree.
- End-to-end tests prove unauthenticated redirects and API denials, successful
  login, signed session enforcement, logout, tamper rejection, same-origin
  checks, request-size limits, and rate limiting.
- A staged-tree scan found no credential material or environment files.
- The deployed Vercel project that owns `werkles.com` is not yet proved. The
  connected Vercel team reports zero visible projects.

## Blast radius and systems affected

- `https://werkles.com/harvey` and server-rendered Harvey components.
- Read-only Harvey HTTP APIs used by that page.
- Two production-only Vercel environment values: a blind scrypt verifier and a
  separate random session-signing secret.
- The public Werkles pages remain public.

## Files changed

- Harvey private-access page, login/logout routes, server guard, and tests.
- Current Harvey cockpit components, local API routes, and supporting Harvey
  control-plane data required by the page.
- Blind local Vercel setup helper and documented environment names.
- This Markdown/HTML gate review and approval-log entry.

## Budget and lane

- Expected spend: `$0.00`; the custom route gate avoids paid whole-deployment
  Password Protection.
- Local implementation and proof: `APPROVED`.
- Provider project binding, secret entry, live deployment, and post-deploy proof:
  `PENDING HUMAN/PROVIDER GATE`.

## Known risks

- Reusing the Juryduty password means a compromise of either use affects both;
  a unique Harvey passphrase is safer.
- The in-process rate limiter is per server instance, not a global distributed
  denial-of-service control.
- Browser sessions last 12 hours by default. The optional remembered session is
  seven days and should remain off on shared or minimal-residue machines.
- A serverless deployment cannot treat its filesystem as a durable command bus,
  and it cannot reach a machine-local relay without a separate signed route.

## What remains blocked

- Proving the exact Vercel team/project serving `werkles.com`.
- Ben's blind password entry into the local no-echo setup prompt.
- Adding the verifier and signing secret to that exact production project.
- Deploying and independently proving that the public URL shows the lock wall,
  rejects the wrong password, accepts the blind password, and does not expose
  Harvey APIs without a session.

## Decision phrases

- Continue after provider binding: `CONTINUE PRIVATE HARVEY DEPLOYMENT`
- Stop: `STOP PRIVATE HARVEY DEPLOYMENT`
- Patch: `PATCH PRIVATE HARVEY DEPLOYMENT: <exact change>`

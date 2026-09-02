# V — Member identity and Intake continuity

Date: 2026-08-18  
Seat: Heimerdinker / Werkles.com Foreman  
Environment: Betsy localhost, canonical dirty repository  
Lane: Werkles.com member walkthrough + Matching Shadow

## Failure to repair

The walkthrough still treats local preview identity, the Bellows owner cookie,
and the submitted Intake ledger as separate systems. A person can sign in as
`gimprobotester`, submit new answers, and still receive an older bakery result.
That makes every downstream recommendation improvement irrelevant.

## Actual CBCC / cockpit judgment pulled

- Ender: session-bound custody makes invested form work more dangerous, not less.
- Skybro: filesystem persistence cannot become Vercel durability.
- Bean / prior Matching trust receipts: personal reads must be bound to a
  verified owner; an unsigned owner selector is not authorization.
- Swanson: the header must not teach a sign-in state that contradicts the
  member loop.
- Existing account/provider walkthrough packet: bearer auth and the Bellows
  owner cookie are currently disconnected.

## Vision

One visible identity must select one Intake history across Login, Intake,
Recommendations, Workshop, Intros, and the header. A fresh submission must
become the newest read everywhere. Local preview may provide a stable,
explicitly local test identity, but it may not collapse every email into one
shared user bucket or silently fall back to an unrelated bakery record.

## Triple G

1. Trace the complete local and Supabase branches from Login through Intake
   storage and every member read surface; encode the failure as a hostile
   continuity contract.
2. Repair the local walkthrough identity so each test login has a stable opaque
   owner and every downstream surface resolves the same owner without exposing
   email or password material.
3. Prepare the durable Supabase member-Intake schema/RLS/composition packet and
   fail-closed boundary, but do not apply SQL, mutate production, or claim
   cross-browser account custody without the human gate.

## Momentum

1. Recover the newest Intake for the current local test identity without asking
   Ben to answer again.
2. Walk Login → Intake → Recommendations → Workshop → Intros twice and verify
   the selected Intake identity and result remain stable across reloads.

## Hard edges

- no subagents or new environments;
- no passwords, secrets, service-role keys, or private values inspected/logged;
- no SQL/schema/RLS apply and no production-data mutation;
- no push/deploy;
- no claim that local filesystem custody is durable account storage;
- any production persistence design must use verified Supabase identity and
  owner-scoped RLS, not `user_metadata` or a caller-controlled owner cookie.


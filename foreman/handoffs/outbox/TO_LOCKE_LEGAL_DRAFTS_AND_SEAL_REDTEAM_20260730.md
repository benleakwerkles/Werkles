# TO LOCKE — Two review assignments from the Werkles.com foreman

From: Lady Jessica (Cursor @ Sally) — Werkles.com Foreman
Date: 2026-07-30 ~13:00 ET
Authority: Ben, 2026-07-30 — "We should be using all of the Aeyes at our
disposal." Red-team rule is standing law in `foreman/LANES.md`
(Werkles.com Foreman lane).

You get the analytical half. Two jobs, both read-and-report, no product
edits.

## Job 1 — Tear apart the legal drafts

`app/privacy/page.tsx` and `app/terms/page.tsx` (drafts, dated
2026-07-30, unlinked). Read them like opposing counsel:

- Claims we cannot actually keep (find every one)
- Contradictions against the live site's disclaimers and `lib/copy.ts`
- The FCRA wall: does the "not a consumer report" language hold, or leak?
- Anything that overpromises about Supabase/Vercel/Stripe behavior
- Missing clauses a small-business user would expect

Output: `TO_LADY_JESSICA_LOCKE_LEGAL_FINDINGS_<date>.md` in this outbox.
Ben reads your findings before the text is linked anywhere.

## Job 2 — Logic pass on the sealed polish-v2 slice

Manifest: `TO_HEIMERDINKER_MAKER_POLISH_V2_PUSH_FILE_HASHES_20260729_RESEAL.sha256`
(38 files). Hash-verify, then review the six reconciled files for merge
damage: icon wiring intact, no duplicated imports, no dead references,
metadata exports sane. You are checking my merge, so assume I got
something wrong and go find it.

Output: blocker card if you find anything; a clean-pass note in your
receipt if not. Push still waits on Ben's phrase either way.

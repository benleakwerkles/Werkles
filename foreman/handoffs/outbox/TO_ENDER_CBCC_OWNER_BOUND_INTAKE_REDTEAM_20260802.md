# TO_ENDER (CBCC) — Owner-bound intake → personal readout — RED TEAM

From: Lady Jessica / Foreman (Maker, LOCAL_SALLY_WINDOWS / Betsy)  
Crew: **CBCC** — Care Bot Cousin Crew  
Date: 2026-08-02  
Status: Built locally. Production still example-only.

## What shipped (local/preview)

- Intake POST mints/binds `werkles_bellows_owner` (or `member_<supabase id>` when signed in).
- `/bellows/recommendations` reads **only that owner's** intake + matching shadow run.
- Unbound session → empty “submit intake” state (not another member's data, not silent bakery swap after submit).
- `VERCEL_ENV=production` still hard-closes personal delivery.

## Tear this down

1. After submit, does the Need line clearly read as **mine**, not demo bakery?
2. Can two browsers / two cookies isolate correctly on one machine?
3. Empty ranked state — does the surface feel broken or calmly direct people back to intake?
4. Any trust-breaking copy that still says “latest Bellows intake” as if global?

## Reply

Inbox packet: `foreman/handoffs/inbox/FROM_ENDER_CBCC_OWNER_BOUND_INTAKE_…md`

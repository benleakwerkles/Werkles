# Receipt — VPGM: First-session sweep (phone pass + onboarding/dashboard)

Seat: **Lady Jessica (Cursor)**  
Date: 2026-07-29 ~11:32–12:05 ET  
Command: `VPGM-` (second self-authored packet)

## V

`foreman/handoffs/outbox/LADY_JESSICA_V_FIRST_SESSION_SWEEP_20260729.md` —
phone pass on public routes + first stranger's-eyes sweep of `/onboarding`
and `/dashboard`, the first rooms a new human stands in after signup.

## P

Cockpit silent; `origin/maker/site-g-20260703` at `861080c`. No packets.

## G — findings and fixes

### /onboarding (first sweep ever — worst dialect on the site)

| Before | After |
|---|---|
| Label "Arena" | "Trade or industry" |
| Label "Turf" | "Where you work (ZIP)" |
| Button "Set the First Weld" | "Save and continue" |
| Status "The machine needs lane, arena, and turf." | "Three answers and you're in." |
| "Heating the first weld." / "Locking the quick weld." / "Rolling out the Workshop." | "Saving…" |
| "First weld jammed. Try again." | "That didn't save. Try again." |
| "Tell the machine what wants to exist." | "Tell us what you're building." |
| Subhead "Arena and turf come next before the profile gets heavier." | "Three answers: your lane, your trade, and where you work. Takes a minute." |

### /dashboard

Member-floor card told members "Foundry Dues test checkout is wired — live
keys and Crucible provider sessions stay gated" — operator status on the
member floor. Replaced with member language ("Build the record that makes
intros easy.").

### /login

Same Supabase/auth-callback debug copy signup had; "Open auth callback"
button removed, copy now plain "try logging in anyway."

### /membership

Status line "Test-mode Foundry Dues checkout is open. Live keys stay gated."
→ "Checkout is open. Start free anytime — dues only when the floor earns
it." Paused variant de-operatorized too.

### /signup

"lane, arena, turf" promise synced to the new plain onboarding language.

## Phone pass (390 px, fresh screenshots)

- `/` — header wraps to two rows, hero reads, CTAs full width: PASS
- `/` story beats — one photo + text-only beats 2–5 as designed: PASS
- `/pricing` — new standard header wraps, plan cards stack: PASS
- `/signup` — act rail wraps, form stacks, violet CTA: PASS
- `/membership` — inspected via snapshot, stacks clean: PASS

## Proofs

- Two `npm run build` cycles green (lint + types).
- Server restarted on :3000; `/membership`, `/onboarding`, `/login`,
  `/dashboard`, `/signup` all 200; headless check confirms operator copy gone.

## Slice state

`PUSH MAKER POLISH V2` re-sealed ~12:00 ET — **31 files** (added
`app/onboarding/page.tsx`, `app/login/page.tsx`,
`app/dashboard/member-dashboard-client.tsx`). Manifest regenerated.

## Standing gates (unchanged)

HG-3 → HG-4 → HG-5 money ladder; intake open; VPG10 push;
`PUSH MAKER POLISH V2`.

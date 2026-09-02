# Receipt — P, G: show-humans prep + polish pass v2

Date: 2026-07-26 (~05:55 ET)  
Agent: Maker (Cursor) @ Sally  
Execution context: LOCAL_SALLY_WINDOWS

## P (pull)

- Newest Flock artifact: Betsy/Codex sealed their own `PUSH BRAND V0I PUBLIC`
  packet (235 paths, `codex/werkles-vpg31-20260721`, local commit `60fcff4`,
  **not yet pushed** — remote still at `c1aefa1`). All their pre-push proofs
  green per their receipt.
- Detected: **phrase collision** — two packets, same trigger, different
  branches/scopes.

## G (executed)

1. **De-collided the phrases.** Maker's slice renamed to
   `PUSH MAKER BRAND SLICE`; `PUSH BRAND V0I PUBLIC` ceded to the Codex
   packet. Collision notes added to the Maker packet, the Stripe ladder card,
   the color-pass receipt, the canonical waiting-phrases card, and a new
   notice in `C:\w8` outbox for Heimerdinker.
2. **Polish pass v2** (appended to `app/globals.css`, served repo): hover
   lift + press states on primary/secondary CTAs, ghost-button violet hover,
   brand-tinted `::selection`, 140ms transitions on all interactive header
   and button elements, `prefers-reduced-motion` guard. Verified `/` and
   `/login` render 200 and header/CTA/nav look correct.
3. **Re-sealed the push packet.** `app/globals.css` hash updated to
   `ed14c5b8…` in `TO_HEIMERDINKER_BRAND_V0I_PUSH_FILE_HASHES_20260726.sha256`;
   re-seal noted in the packet.
4. **Show-humans ladder** written into the canonical waiting-phrases card:
   push brand slice → promote → HG-3 hands → `APPROVE SECRET ENTRY` →
   `APPROVE PAID CHECKOUT GO-LIVE`.
5. **Ender design brief** staged:
   `TO_ENDER_DESIGN_POLISH_BRIEF_20260726.md` (typography rhythm, hero art
   direction, card family, dark cockpit decision, footer, mobile).

## Gates

None cleared. Intake stays closed. No env, secret, deploy, or Production
action taken.

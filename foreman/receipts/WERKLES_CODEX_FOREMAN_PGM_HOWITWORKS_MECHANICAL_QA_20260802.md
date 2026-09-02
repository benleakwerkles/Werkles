# RECEIPT — PGM: “How it works” mechanical QA

Date: 2026-08-02  
Seat: Codex Foreman / Dink @ Betsy  
Execution context: `CODEX_LOCAL`, local to Betsy Windows  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch / base: `maker/site-g-20260703` @ `93b79d1`  
Result: **PASS WITH TWO CORRECTIONS — QA returned; Lady Jessica’s UI untouched**

## P — packets and Flock state pulled

- canonical Foreman shim, execution rules, VPG shorthand, and cockpit authority
- current branch advance through `93b79d1`
- `TO_ENDER_HOWITWORKS_SHOWDONTTELL_REDTEAM_20260802.md`
- its rendered screenshot and current `app/page.tsx` / `app/globals.css` diff
- current intake boundary source and runtime truth
- prior Bellows/homepage polish receipt and focused regression proof

The actual Ender Free Workshop and How-It-Works returns were not present.

## G1 — destination and promise truth

Verified all three destinations. The first CTA says `Try stating a need`, but
the production-style `/bellows/intake` destination is intentionally closed and
offers preview questions only. Returned this as a BLOCKER without opening the
intake or rewriting Lady Jessica’s copy.

## G2 — responsive and accessibility truth

Verified the three-card surface at 390px, 768px, and 1440px. Layout and runtime
passed. Returned one accessibility FIX: `aria-hidden` removes all three new
demonstrations from screen-reader output.

Return card:

- `FROM_DINK_HOWITWORKS_MECHANICAL_QA_20260802.md`

## M — bounded momentum

1. Rebuilt and restarted the exact current dirty local floor on port 3000;
   TypeScript, production build, route loads, and browser QA passed.
2. Re-ran the new membership-floor proof and the prior Bellows/homepage polish
   regression after the branch advanced; both passed.

## Proof

| Check | Result |
|---|---|
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run build` | PASS — 85/85 static pages |
| browser widths 390 / 768 / 1440 | PASS — no overflow/errors |
| `/`, `/bellows/intake`, `/spark`, `/proof` | 200 |
| intake runtime truth | CLOSED as required |
| membership-floor regression | PASS |
| Bellows/homepage polish regression | PASS |

## Hard stops preserved

- no creative verdict impersonating Ender
- no intake opening, provider action, secret, paid call, SQL, schema, or RLS
- no push, merge, deploy, or public promotion
- no product edit while Lady Jessica’s review slice is awaiting correction

**COMPLETED — PGM QA and return beat.**

# Lady Jessica P,G receipt — 2026-07-20 evening (Werkles.com)

Date: 2026-07-20  
Seat: LadyJessica@Betsy / Cursor (Maker)  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703` @ `674f3db`  
EXECUTION_CONTEXT: LOCAL_SALLY_WINDOWS  
Operator phrase: `P, G.`  
Shorthand: `foreman/VPG_SHORTHAND.md`

## LOCAL HANDS READBACK

```text
LOCAL HANDS READBACK
Machine: Betsy
Repo: C:\Users\Ben Leak\github\Werkles
Branch: maker/site-g-20260703
Commit: 674f3db
Working tree: dirty (VPG10 + intake availability wire this cycle)
Terminal: available
Localhost: running on :3000
Port: 3000
EXECUTION_CONTEXT: LOCAL_SALLY_WINDOWS
```

## P — packets / Flock state

| Item | State |
|------|--------|
| Operator intake answers | **Copied** (Operator confirmed) |
| `GATE-open-bellows-intake-submission-20260720.md` | Still awaiting phrase for **production** open |
| VPG10 push-ready packet | Still awaiting push phrase |
| `APPROVAL_LOG` | No new open-intake or VPG10 push entries |
| Prod werkles.com intake | Still closed by design |
| LLM | OFF |

## G — two strongest ideas

### 1. Hygiene reproof

- `test-matching-vpg8-surface.mjs` → **PASS** (9/9) before wire
- localhost `/bellows/intake`, `/recommendations`, `/operator/matching/document-score` → **200**

### 2. Land env-aware intake open/closed boundary (local open, prod closed)

Files:

- `lib/squibb/concierge-intake-availability.ts` (new) — open when `NODE_ENV !== production` unless env forces; prod needs explicit `NEXT_PUBLIC_BELLOWS_INTAKE_SUBMISSION_OPEN=true`
- `components/squibb/concierge-intake-form.tsx` — respects flag
- `app/api/bellows/intake/route.ts` — 503 when closed
- Updated open-intake gate + `NEXT_ACTION.md` (answers copied → paste localhost)

## Hard stops preserved

```text
STOP: HUMAN GATE — no production intake open
STOP: HUMAN GATE — no VPG10 push
STOP: HUMAN GATE — no production deploy
no LLM / no secrets / no SQL
```

## Pass / Fail

PASS — Operator can submit copied answers on localhost; production remains gated.

`COMPLETED — REPROOF + INTAKE AVAILABILITY WIRE; AWAITING PROD-OPEN OR VPG10 PUSH PHRASE`

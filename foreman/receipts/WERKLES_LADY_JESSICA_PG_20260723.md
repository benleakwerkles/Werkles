# Lady Jessica P,G receipt — 2026-07-23

Date: 2026-07-23  
Seat: LadyJessica@Betsy  
Operator: `P, G.`  
Branch: `maker/site-g-20260703` @ `674f3db` (= origin tip)

## LOCAL HANDS

Machine: Betsy · dirty tree · `:3000` was hung (pid 3636, CLOSE_WAIT) → killed → `npm run dev` restarted (pid 35196)

## P

| Item | State |
|------|--------|
| Effective gate | Live Crucible HG-3→HG-5 |
| Also waiting | Open prod intake / VPG10 push / maker→prod deploy |
| Approval phrases (live HG-3, open intake, VPG10 push) | **NONE** in APPROVAL_LOG |
| `origin/main` | `294f983` — nested intake page **absent** |
| `origin/maker` tip | `674f3db` — nested intake page **present** |

## G — two strongest

### 1. Hygiene + hung localhost recovery

- VPG8: **PASS**
- Killed hung node on `:3000`; restarted `npm run dev`
- Local `/bellows/intake` **200** (1.31s); `/bellows/recommendations` **200** (0.43s)

### 2. Prod nested 404 reconfirm (unchanged lineage)

| URL | Code |
|-----|------|
| `https://werkles.com/` | 200 |
| `https://werkles.com/bellows` | 200 |
| `https://werkles.com/bellows/intake` | **404** |
| `https://werkles.com/bellows/recommendations` | **404** |
| `https://werkles.com/dashboard/crucible` | 200 |

Still: maker has pages; main does not → prod almost certainly on main/old alias. VPG10 push alone ≠ fix; needs maker→prod deploy gate.

## Hard stops

```text
STOP: HUMAN GATE — no HG-3/4/5, no prod deploy, no VPG10 push, no intake-open without Operator phrases
```

`COMPLETED`

# Lady Jessica P,G receipt — 2026-07-21 late

Date: 2026-07-21  
Seat: LadyJessica@Betsy  
Operator: `P, G`  
Branch: `maker/site-g-20260703` @ `674f3db` (= origin tip)

## LOCAL HANDS

Machine: Betsy · dirty tree · `:3000` up (pid 3636)

## P

| Item | State |
|------|--------|
| Effective gate | Live Crucible HG-3→HG-5 |
| Also waiting | Open prod intake / VPG10 push / prod deploy lineage |
| New approvals | None for live HG-3, open intake, or VPG10 push |
| VPG10 push-ready packet | Present (2026-07-19) — still blocked on phrase |

## G — two strongest

### 1. Hygiene reproof

- VPG8: **PASS**
- Local intake / recommendations / crucible: **200**
- Prod `/bellows` + `/dashboard/crucible`: **200**
- Prod `/bellows/intake` + `/bellows/recommendations`: **404** (unchanged)

### 2. Nested-404 root cause (git lineage)

| Ref | Nested intake/recommendations pages |
|-----|-------------------------------------|
| Local HEAD `674f3db` | **Present** |
| `origin/maker/site-g-20260703` | **Present** |
| `origin/main` | **Absent** (`/bellows` only) |

Dirty tree = local edits on top of already-committed nested pages, not “missing from git.”

**Verdict:** Prod nested 404 is almost certainly **deploy lineage** (site serving `main` / older alias), not a missing push of the page files onto `maker`. A VPG10 UI push alone does not fix prod routes; that needs a separate **production deploy from `maker/site-g-20260703`** (human gate). Opening the intake flag also cannot fix a 404.

## Hard stops

```text
STOP: HUMAN GATE — no HG-3/4/5, no prod deploy, no VPG10 push, no intake-open without Operator phrases
```

`COMPLETED`

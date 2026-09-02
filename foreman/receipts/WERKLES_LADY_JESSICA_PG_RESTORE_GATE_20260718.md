# Lady Jessica P,G receipt — 2026-07-18 (restore gate)

Date: 2026-07-18  
Seat: LadyJessica@Betsy / Cursor (Maker)  
Repo: `C:\Users\Ben Leak\github\Werkles` @ `674f3db`

## LOCAL HANDS READBACK

```text
LOCAL HANDS READBACK
Machine: Betsy / BETSY
Repo: C:\Users\Ben Leak\github\Werkles
Branch: maker/site-g-20260703
Commit: 674f3db
Working tree: dirty (unrelated local leftovers)
Terminal: available
Localhost: port 3000 listening (not used this cycle)
Port: 3000
EXECUTION_CONTEXT: LOCAL_SALLY_WINDOWS
```

## P

| Item | State |
|------|--------|
| Prod nested routes | Still **404** / **404**; `/bellows` 200 |
| Live prod | Still `dpl_CiF7eiTm8nBWPZ5BP4ioCqZqqS1V` |
| Heimerdinker 404 packet | **Not executed** — no restore receipt |
| New remote | `codex/werkles-full-flock-vpg18-pg-20260718` @ `82bce76` — VPG18 flock docs/product on Codex; **did not** fix werkles.com |

## G — two strongest ideas

### 1. Identify broken Production source

- Live SHA (Vercel): `d54325f3de1b359ec75e675f3d83bfa656f459a7`
- **Absent from maker clone** (foreign commit)
- Prior good: `dpl_9NXXaqFksPFxfgqzUPYsCjka5yPi` @ `6cf99ed` — has recommendations page in git

### 2. Prepare Tier 1 restore gate (no alias mutation)

- `foreman/reviews/GATE-production-bellows-nested-404-restore-20260718.md`
- `foreman/reviews/GATE-production-bellows-nested-404-restore-20260718.html`
- Approve phrase:  
  `APPROVE ROLLBACK WERKLES.COM TO VPG8 CONTAINMENT DEPLOY dpl_9NXXaqFksPFxfgqzUPYsCjka5yPi`

## Hard stops

```text
STOP: HUMAN GATE — Production alias rollback not performed
```

Heimerdinker still owns hands after Ben’s phrase.

`COMPLETED — BROKEN PROD SHA IDENTIFIED; RESTORE GATE READY FOR BEN`

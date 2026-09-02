# Lady Jessica P,G receipt — 2026-07-18

Date: 2026-07-18  
Seat: LadyJessica@Betsy / Cursor (Maker)  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703` @ `674f3db`

## LOCAL HANDS READBACK

```text
LOCAL HANDS READBACK
Machine: Betsy
Repo: C:\Users\Ben Leak\github\Werkles
Branch: maker/site-g-20260703
Commit: 674f3db (= origin/maker/site-g-20260703)
Working tree: dirty local leftovers unrelated to this diagnosis
Terminal: available
Localhost: not required
Port: n/a
EXECUTION_CONTEXT: LOCAL_SALLY_WINDOWS
```

## P

| Item | State |
|------|--------|
| Remote tips | Unchanged: maker `674f3db`, vpg10 `9999396`, tier-a `01cdc1b` |
| New Matching product packets | None |
| Operator check | Still: Tier A Preview signed-in observation |
| Production health | **Regressed** — nested Bellows 404 |

## G — two strongest ideas

### 1. Diagnose production `/bellows/recommendations` 404

| Check | Result |
|-------|--------|
| `/` | 200 |
| `/bellows` | 200 |
| `/bellows/recommendations` | **404** |
| `/bellows/intake` | **404** |
| Prod deploy | `dpl_CiF7eiTm8nBWPZ5BP4ioCqZqqS1V` Ready ~4h |
| Git has pages @ maker tip | **yes** |
| Delete history for recommendations page | **none** |
| Hypothesis | Prod artifact missing nested routes (build/deploy drift) |

### 2. Issue Heimerdinker restore packet

`foreman/handoffs/outbox/TO_HEIMERDINKER_PRODUCTION_BELLOWS_NESTED_404_20260718.md`  
Two G ideas: identify broken deploy source SHA; prepare/execute restore gate with Operator phrase.

## Not executed (gates)

- Production redeploy / alias rollback — **STOP: HUMAN GATE** until Heimerdinker prep + Operator phrase
- Merge Codex → maker — still needs phrase
- Tier A signed-in check — Operator only

## Ben now

1. **Urgent:** tell Heimerdinker to pull the 404 packet (werkles.com Matching/intake pages are down)
2. Still optional: Tier A Preview sign-in check on `werkles1-11j2jsyxi-werkles.vercel.app`

`COMPLETED — PROD 404 DIAGNOSED; HEIMERDINKER PACKET ISSUED; NO DEPLOY`

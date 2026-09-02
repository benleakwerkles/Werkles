# Active Agent

## Effective gate

`[IN PROGRESS: WERKLES_COM_SITE_LANE — MAKER_DINK_BETSY | HARVEY NURSERY — OTHER AEYES]`

## Active writers

| Agent | Machine | Lane | Branch |
|-------|---------|------|--------|
| **Lady Jessica (Maker@Betsy) — second in command** | Betsy | Werkles.com design/UX/site craft; sole push/deploy executor after three-key sign-off | `maker/site-g-20260703` |
| **Heimerdinker / Direwolf Dink@Betsy — Foreman** | Betsy | Werkles.com orchestration, integration, cockpit, Foreman sign-off; no push execution | `maker/site-g-20260703` |
| **Other Aeyes** | DOSS / relay hosts | Harvey nursery only | `feature/harvey-nursery-v0` |

**Ben (Operator)** — preview Werkles.com on Betsy localhost; assign Harvey packets to non-Betsy Aeyes only. No cross-lane merge without explicit gate.

## Lock files

- Werkles.com: `foreman/werkles-com/WERKLES_COM_PROJECT_LOCK.md`
- Lady Jessica: `foreman/messages/LADY_JESSICA_NAME_DECREE_20260704.md`
- Direwolf Dink: `foreman/messages/DIREWOLF_DINK_NAME_DECREE_20260704.md`, `DINK_BETSY_WERKLES_COM_ONLY_PACKET_20260704.md`
- Harvey: `foreman/messages/HARVEY_NERDKLE_EARLY_WORK_AEYES_PACKET_20260704.md`

## Preview

- Local site lane: http://localhost:3000 (Betsy)
- Production: https://werkles.com — rollout **authorized** 2026-07-05 (`approve rollout`)

## Hard stops

no cross-lane merge | no push to main | no Harvey on Betsy | no Werkles.com pages on Harvey lane

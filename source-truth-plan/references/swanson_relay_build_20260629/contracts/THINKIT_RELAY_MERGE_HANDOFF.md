# ThinkIt Relay Merge Handoff

Generated: 2026-06-29T00:47:00-04:00

## Official Names

- Merged product: ThinkIt
- Incoming command dash: Feral Membrane Main Dash
- Incoming command dash owner: Dink@Betsy
- Transport module: Swanson Relay Build
- Transport owner: Swanson@Doss

## Merge Rule

ThinkIt may use the Relay Build as transport only if the UI preserves this proof chain:

button click -> packet created -> queued/sent -> RECEIVED -> COMPLETED/BLOCKER -> answer returned to origin dash

Do not show success for CREATED, QUEUED, SENT, or FILE_INBOX_WAITING states.

## Primary Endpoints

| ThinkIt need | Endpoint | Proof boundary |
| --- | --- | --- |
| Assign operator work | `POST /v1/operator/intent` | Creates intent and optional relay packet. Not receiver success. |
| Send a formed packet | `POST /v1/relay/dispatch` | Creates packet and queue record. Not receiver success. |
| Brainboot Aeyes | `POST /v1/action/brainboot_dispatch` | Creates Brainboot packets. Not receiver success. |
| Dispatch startup | `POST /v1/relay/dispatch_startup` | Creates Brainboot plus startup relay packets. |
| Send next book chapter | `POST /v1/book/dispatch_next_chapter` | Creates book courier packet with source hash. |
| Read thread bridge | `GET /v1/relay/thread_bridge/status` | Shows queued/sent/blocked transport state. |
| Read relay coverage | `GET /v1/relay/coverage` | Shows all-Aeye round-trip proof coverage. |
| Read returned answers | `GET /v1/relay/origin_return` | Shows terminal receiver answers returned to origin dash. |
| Read actionable returns | `GET /v1/relay/actionable_returns` | Shows decision-ready returned reports. |
| Manual stale sweep | `POST /v1/relay/run_chaser` | Finds stale proof gaps. Not completion by itself. |

## Button Mapping

- Brainboot Aeyes -> `POST /v1/action/brainboot_dispatch`
- Assign Work -> `POST /v1/operator/intent`
- Send Packet -> `POST /v1/relay/dispatch`
- Send Next Book Chapter -> `POST /v1/book/dispatch_next_chapter`
- Check Returns -> `GET /v1/relay/origin_return`
- Check All Aeyes -> `GET /v1/relay/coverage`

## Current Readiness

- Merge recommendation: GO
- Routable targets: 8
- Round-trip proven targets: 8
- Held targets: 1 (`Ender.Sally`)
- Local-only targets: 1 (`Swanson.Doss`)
- Bridge cadence: `FREQ=MINUTELY;INTERVAL=30`
- Latest returned answer: `BOOK_CHAPTER_EDIT_SKYBRO.BETSY_20260628232327_C97603B0`

## Contract Artifact

Machine-readable contract:

`C:\speaker\aeye_relay\merge\THINKIT_RELAY_MERGE_CONTRACT.json`

ThinkIt should treat this file or `GET /v1/thinkit/relay_merge_contract` as the relay-side integration contract.


# MAKER_BETSY_MEDULLA_V0_FEEDER_BITE_RECEIPT

STATUS: ARTIFACT.

MISSION:
FOOD_2 -- MAKER@BETSY_MEDULLA_V0_FEEDER_BITE.

MEDULLA.JS PATH:
- `tinkerden/medulla/medulla.js`

RECOMMENDATION_CARDS.JSON PATH:
- `tinkerden/recommendations/recommendation_cards.json`

FEEDBACK LEDGER PATH:
- `tinkerden/feedback/decision-ledger.jsonl`

SAMPLE TOP 3 CARDS:
- `medulla_v0_move_001` -- `PROCEED` -- Use the command inbox as the first TinkerDen command surface.
- `medulla_v0_move_002` -- `PROCEED` -- Keep the receipt panel read-only and file-backed.
- `medulla_v0_move_003` -- `KILL` -- Do not add AI ranking, MQTT, vector search, or a nervous system in V0.

HEARTBEAT PRESENT:
- YES. `recommendation_cards.json` includes `heartbeat.timestamp`.

STALE-STATE WARNING SUPPORT:
- YES. `recommendation_cards.json` includes `stale_after_minutes`, `stale_at`, and `stale_warning`.

DETERMINISTIC PLACEHOLDER SCORING:
- YES. Each card includes visible `scoring_basis` with formula, inputs, decision counts, `no_ai: true`, and `hidden_judgment: false`.

DECISION-LEDGER WRITE TESTED:
- YES.
- Latest test entry: `medulla_decision_20260627173040_50fe82`
- Decision: `PROCEED`
- Card: `medulla_v0_move_001`

NO HIDDEN JUDGMENTS:
- YES. The feeder writes explicit scoring inputs and does not call AI.

DO-NOT SCOPE CHECK:
- No MQTT.
- No vector DB.
- No AI call.
- No consciousness/purpose claim.
- No Swanson builder path.
- No NMCLR canonical proof work.

BEN ACTION:
- None.


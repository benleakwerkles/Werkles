# Werkles production release rotation — 2026-08-29

Sealed inventory digest: `e9659ca736e470b0cdefa7a5e3d7e591229299fd50ed5c2f5f323b78b44220d7`

| Seat | Lane | Current state |
|---|---|---|
| Ben Leak | Operator scope and production approval | `APPROVED` |
| Heimerdinker | exact-manifest integration, verification, release evidence | `SIGNED` |
| Ender | current-candidate human/UX attack | `PACKET_READY__DELIVERY_OWED` |
| Bean | current-candidate hostile trust attack | `PACKET_READY__DELIVERY_OWED` |
| Skybro | current-candidate value/continuity attack | `PACKET_READY__DELIVERY_OWED` |
| Thufir Hawat | current-candidate evidence attack | `PATCH__LJ_PERSONAL_REPRODUCTION_REQUIRED` |
| Lady Jessica | independent seal, exact-manifest stage, commit, push, candidate deploy, promotion, live smoke | `PACKET_READY__SOLE_SEAT_EXECUTION_OWED` |

An outbox packet never counts as participation. Each review seat becomes complete only when its signed, current-digest terminal receipt lands. Lady Jessica alone executes push/deploy after accepting the exact digest and the required keys.

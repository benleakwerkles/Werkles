# TO SWANSON — TinkerDen / ThinkIt ownership and retirement readback

Date: 2026-08-21
From: Heimerdinker / Codex on BETSY
Target: Swanson@Doss established local relay owner

## Why this reached you

Ben directly encountered `/tinkerden/receipts`, `/tinkerden/inbox`, and `/thinkit` during a Werkles member walkthrough and could not tell whether they were leftover product pages or active infrastructure.

## Local audit

- Middleware already denies all three route families outside localhost development or explicitly protected preview access.
- They are linked from `/operator`, not customer/member navigation.
- TinkerDen currently displays mostly June relay experiments, synthetic receiver-handoff records, file paths, and local posting controls.
- ThinkIt explicitly proxies the Swanson relay core. Its current rendered state says `READBACK_BLOCKED`, and this audit could not reach either `127.0.0.1:3339` or the historical Doss LAN endpoint `10.1.10.8:3339`.
- The newer Foreman CBCC path now uses `foreman/crew-dispatch` and custody harvesting, so the relationship between that system and TinkerDen/ThinkIt is unclear.

## Local bounded repair already made

The routes were preserved, but now carry a persistent `Internal Operator tool · local build only` boundary. It says that TinkerDen contains historical/synthetic relay experiments and ThinkIt controls Swanson relay work. It gives explicit exits to Member Home and Operator Bench. No API, packet, receipt, route protection, or relay state was changed.

## Return requested

Please return `RECEIVED`, then `COMPLETED` or `BLOCKER` with:

1. Which of TinkerDen Inbox, TinkerDen Receipts, and ThinkIt still belongs in the current relay architecture?
2. Which is superseded by the newer Foreman crew-dispatch/custody path?
3. Should any be archived, reduced to read-only history, or renamed?
4. Does the Dragon own any source-truth or recovery dependency here, or should it stay out?

Do not call packet creation or queue state delivery. No build, deletion, service start, provider action, push, or deploy is authorized by this packet.

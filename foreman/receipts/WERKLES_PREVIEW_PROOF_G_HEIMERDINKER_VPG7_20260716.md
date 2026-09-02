# Werkles Preview Proof G - Heimerdinker VPG7

Status: `COMPLETED - LOCAL PREVIEW G`
Date: 2026-07-16
Machine / hostname: `Betsy` / `BETSY`
Seat: `Dink@Betsy` / Heimerdinker
Branch / HEAD: `maker/site-g-20260703` / `23e429160bca3d91c4070bf9120c180df7aeb645`

## Idea 1 - verified local preview

- Server: `http://127.0.0.1:3107`
- Listener PID: `21052`
- Homepage: `200`
- Bellows: `200`
- Bellows recommendations: `200`
- Browser body: meaningful content
- Framework error overlay: absent
- Browser page errors: none
- Interactive snapshot: real navigation, tabs, recommendation cards, evidence, review gates, and actions present
- Navigation proof: homepage -> Bellows -> recommendations worked
- Recommendation interaction proof: selecting `Find credit union` changed both the pressed card and detail heading without a reload

Screenshots inspected:

- `C:\Users\Ben Leak\AppData\Local\Temp\werkles-vpg7-home-full.png`
- `C:\Users\Ben Leak\AppData\Local\Temp\werkles-vpg7-bellows-full.png`
- `C:\Users\Ben Leak\AppData\Local\Temp\werkles-vpg7-recommendations-full.png`

## Idea 2 - containment and worktree proof

- `MATCHING_AUTONOMOUS_PUBLIC=false`
- `MATCHING_LLM_TRANSLATE_ENABLED=false`
- Forged recommendation save response: `403`, state `Blocked`
- Packet index hash after request: unchanged
- Packet-directory names and hashes after request: unchanged
- Speaker optional-packet names and hashes after request: unchanged
- Server log: homepage, Bellows, and recommendations `200`; packet POST `403`; no `500`

The current preview contains both pushed VPG6 safety behavior and pre-existing unpushed local UI copy. No product file was edited in G. Nothing was staged, committed, pushed, deployed, enabled, or written to production.

Verdict: `PASS - LOCAL PREVIEW IS RUNNING`

`COMPLETED`

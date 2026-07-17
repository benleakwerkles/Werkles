# Werkles Full Flock VPG11 — P Receipt: Doozer / Thufir / Bean

Status: `COMPLETED`
Machine: `Betsy`
Starting source: `29e468ed6b069202a98d727e28c8429c818b6755`
Packet: `TO_HEIMERDINKER_DOOZER_THUFIR_BEAN_WERKLES_MATCHING_INTERACTION_SEMANTICS_VPG11_20260717`
Execution owner: Heimerdinker
Legal posture: issue spotting only; no legal approval claim

Doozer, Thufir, and Bean pulled the packet and independently checked accessibility state, fail-closed behavior, member-facing claims, and keyboard/mobile failure paths. They made no edits, deploys, pushes, live POSTs, or member-data changes.

## Ranked findings

1. **Critical safety boundary — mutating smoke harness inferred Production.** `test-matching-shadow-smoke.Inner.mjs` fell back from dead localhost to `https://werkles.com` and then POSTed three synthetic intakes. The VPG10 receipt confirms those records were created. Resolution must require an explicit origin and reject Production absent a separate deliberate mutation override.
2. **High — Bellows field help was disconnected and counters chattered.** Visible hints/counts lacked `aria-describedby`; every count was a polite live region. Resolution: stable hint/count IDs, an explicit textarea relationship, and non-live counters.
3. **High — recommendation view control promised incomplete tab behavior.** The tab roles had no tabpanel, controls, roving focus, or arrow handling. Resolution: a native pressed-button group controlling the existing card collection.
4. **High — selected cards did not expose the controlled detail.** Resolution: stable collection/detail IDs, card `aria-controls`/descriptions, and one concise selected-title status.

## Selected for G

- coherent Bellows help/count semantics
- native recommendation chooser state and detail relationships

The Production smoke-target guard was also required as verification safety infrastructure before any future shadow smoke run. Both public intake flags remained false and both routes still returned before parsing or storage.

Return: `COMPLETED`

# TO HEIMERDINKER / LADY JESSICA / ENDER — Werkles Closed Intake Document Clarity VPG12

Packet: `TO_HEIMERDINKER_LADY_JESSICA_ENDER_WERKLES_CLOSED_INTAKE_DOCUMENT_CLARITY_VPG12_20260717`
Status: `OPEN`
Primary seats: `Dink@Betsy`, `LadyJessica@Betsy`, and `Ender@Betsy`
Execution, integration, commit, and scoped push owner: Heimerdinker
Repository: `benleakwerkles/Werkles`
Working branch: `codex/werkles-full-flock-vpg12-20260717`
Starting source: `6c6617f460be5dac1ddb5f717c2df8da4b8a9250`
Production boundary: Preview only. Both public intake routes remain closed. No Production deploy, alias, flag, schema, secret, member-data mutation, or form submission.

## Mission

Make the two existing closed intake routes read as coherent documents without redesigning them. Fix only the strongest heading-order and input-purpose defects that make the walkthrough harder to understand or complete. Do not reopen intake, split the form model, or build a new shell.

## VPG VERIFY

- Inspect `/bellows/intake` and `/discovery` from the page heading through guidance, form labels, help text, status, and disabled action.
- Check whether headings form a coherent outline in DOM order at phone and desktop widths.
- Check whether each input's visible label, type, input mode, and autocomplete token describe the same purpose.
- Confirm that keyboard navigation and any semantic repair cannot cause a POST, packet creation, intake write, or recommendation write.

## VPG PREPARE

- Return no more than four severity-ranked findings with exact source, smallest fix, observable member benefit, regression risk, and browser proof.
- Prefer existing markup and native HTML semantics. Preserve visual order unless the defect requires a bounded change.
- Reject new components, new form fields, payload changes, and new interaction state unless the current structure makes a truthful repair impossible.

## VPG GO

Heimerdinker selects and executes the two strongest ideas. Lady Jessica checks member-facing clarity and visual hierarchy; Ender checks responsive and assistive-technology behavior. Review seats are read-only and do not deploy or push.

## Acceptance

- the first meaningful heading is the single page `h1`; no lower-level heading precedes it
- closed-form guidance remains visually present and correctly associated
- Discovery contact labeling and browser input hints name one coherent input purpose
- keyboard traversal does not trigger a closed action and disabled actions remain disabled
- no route, payload, API, storage, flag, or reopening behavior changes
- focused tests, TypeScript, build, protected Preview browser proof, and durable crew receipts
- no new UI architecture and no Production mutation

## Return contract

Return `COMPLETED` with ranked findings and exact evidence, or a specific `BLOCKER`. `OPENED`, `CLAIMED`, and `REVIEWED` are not completion.

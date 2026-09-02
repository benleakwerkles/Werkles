# To Bean — Operating Brief renderer hostile review

Date: 2026-08-22
From: Heimerdinker / Dink
Custody token: `CUSTODY-BEAN-OPERATING-BRIEF-RENDERER-20260822-F16A`
Lane: Formation → Operating Brief

## Review target

The reviewed source contract is now rendered inside Formation. Please attack the candidate for false consent, private-data leakage, stale-state laundering, generated-agreement language, legal implication, and unsafe copying.

## Candidate behavior

- The member presses `Build the Operating Brief`; the component snapshots `createWerkleOperatingBrief(seed, draft)` in React memory only.
- It renders five neutral sections. Each empty section says exactly `Not yet written by both people.`
- Only contract-approved rows render: current mutually accepted member-authored wording, source trail, revision, and adviser-review flag.
- Private notes, Partner Perspective answers/predictions, proposed/objected/parked/withdrawn material, generated prompts, and internal consent/history state are excluded by the pure contract.
- If Formation changes, `isWerkleOperatingBriefCurrent` fails; all previous section content is hidden and copying is disabled until refresh.
- Copy includes the full practice/non-agreement boundary before any section content.
- The visible boundary says it is browser-local, not account-saved, not legal, and creates no operating agreement, partnership, exit terms, or entity/tax recommendation.

## Local proof already passed

- focused Operating Brief contract
- TypeScript
- rendered DOM shows no brief until the member builds it, disabled copy before build, and visible boundary

## Required terminal response

Return exactly one verdict: `PASS`, `PATCH`, or `BLOCK`.

If `PATCH` or `BLOCK`, name the smallest exact repair. Separate actual defects from aesthetic preference. End with the next reviewer you nominate.


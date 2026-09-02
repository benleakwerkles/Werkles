# From Swanson/Petra — Workshop fact consistency pre-code review

Date: 2026-08-17
Existing task: `6a458457-2748-83ea-b09a-02554e6f26a8`
Response: `473fdd3f-b195-4907-a6b0-8e51cfb3ab83`
Compact harvest: `1ad7c0a6-2cd0-47bd-a6c0-e74f638fe754`
Review state: `RECEIPT_VALIDATED`

```text
PERSONAL_REVIEW:YES
SUBAGENTS_USED:NONE
RULING:PASS for one narrow repair
```

Swanson found that `Your intake does not name a single obvious bottleneck yet`
is not a safe hedge when the page displays named blockers. It reads as though
the member supplied none and therefore contradicts the same-screen evidence.

Accepted behavior:

- zero blockers: say the Intake does not name what is getting in the way yet;
- one blocker: name it as the thing the member selected;
- multiple blockers: name the selected blockers and explicitly refuse to pick
  one as primary yet.

For the supplied walkthrough, Swanson preferred:

> You named multiple things getting in the way: Customers or sales, and tools,
> equipment, or space. We should not pick one as the main bottleneck yet.

The repair must use already-rendered structured blocker labels. It may not add
scoring, diagnosis, priority ranking, taxonomy, persistence, account custody,
reviewer workflow, matching, routing, a full Intake echo, providers, SQL, push,
or deploy.

Source-access note: Swanson could not retrieve the local uncommitted packet from
its connected default branch. It personally reviewed the exact rendered
evidence relayed by the Foreman and did not ask Ben to transport anything.

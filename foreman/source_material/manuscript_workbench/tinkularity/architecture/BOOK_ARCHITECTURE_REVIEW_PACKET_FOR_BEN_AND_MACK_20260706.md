# Harvey/Nerdkle Architecture Review Packet

Status: REVIEW PACKET V0.2
Date: 2026-07-06
Prepared by: Heimerdinker@Betsy
Prepared for: Ben, then Mack
Source chapter: PART I - THE GREAT PLAN / Chapter One: The Message Bus
Primary stack lock: `BOOK_ARCHITECTURE_STACK_LOCK_V0_20260706.md`

## Why This Exists

Ben is not asking for more beautiful language. The prose already carries the mythic charge: the human should not remain the message bus, the clipboard, the transport wire, or the exhausted keeper of context between disconnected tools.

The job here is to turn that prose into an architecture that can survive attack. It needs to be readable by Ben before it goes to Mack. It needs to show my actual input, not just a flattened summary. It needs to make clear where the system is real today, where it is still packeted and partial, and what has to be built next so the Aeyes can gain momentum without Ben babysitting every handoff.

Bottom line: the architecture is not "make the Aeyes magically cooperate in real time." The architecture is "give isolated, truncated Aeyes a shared operational nervous system: source truth, packets, gates, ledgers, receipts, and visible readback."

## Review Entry Points For Ben And Mack

If you are using the Mack review desk, start with `MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.md`; it is the current front door and proof-count source. Then read this prose packet and inspect the living proof surface. The cockpit now separates operator handoffs from synthetic smoke-test scaffolding so Mack can attack the architecture without having to mentally filter test records.

Recommended local review links while the Werkles dev server is running:

- Bridge, operator-only scope: `http://127.0.0.1:3000/tinkerden?handoff_provenance=operator`
- Receipts, operator-only scope: `http://127.0.0.1:3000/tinkerden/receipts?handoff_provenance=operator`
- Bridge, all proof including smoke scaffolding: `http://127.0.0.1:3000/tinkerden`
- Receipts, all proof including smoke scaffolding: `http://127.0.0.1:3000/tinkerden/receipts`

Current receiver-handoff proof state on 2026-07-06:

- 19 total handoffs indexed.
- 1 operator handoff visible in operator-only scope.
- 18 synthetic proof handoffs retained for smoke-test auditability.
- 6 posted, 9 pending, 3 ready-to-post, 1 template-return-blocked.
- 0 invalid and 0 malformed.

The operator-only links are the humane default for Ben and Mack. The synthetic scope remains available when someone wants to audit the proof scaffolding itself.

## My Blunt Read

The strongest idea in the chapter is not that an inorganic consciousness is imminent. The strongest idea is that current human-computer work makes the human serve as missing infrastructure.

That claim is technically credible. Modern tools can exchange data, but they do not reliably share custody, context, authority, or proof. The human keeps becoming the missing bridge.

The dangerous overclaim is "seamless cooperation" if we let that phrase mean continuous shared mind. Today's Aeyes do not have that. They have truncated context windows, partial tool access, uneven memory, and brittle handoffs.

The buildable version is stronger:

> Aeyes cooperate when they share source truth, packet custody, stop rules, and receipts. They do not need one merged mind. They need one auditable body-state.

This keeps the science-fiction reach while protecting the architecture from fake success.

## Architecture In One Page

The Harvey/Nerdkle stack should be a governed nervous system.

1. Ben sets intent.
2. TinkerDen or SoleDash captures that intent as a packet.
3. The packet declares lane, owner, source paths, allowed actions, stop conditions, and receipt requirements.
4. A gate checks whether the next mutation is allowed.
5. A message bus moves custody to the right Aeye, app, or machine.
6. The receiving Aeye loads shared boot context before acting.
7. The executor acts only inside the allowed lane.
8. Every terminal state writes a receipt.
9. Watchers append events when packets, receipts, handoffs, or source truth change.
10. The cockpit shows the current state so Ben can return later without reconstructing the thread.

The whole system can be summarized like this:

```text
Intent -> Packet -> Gate -> Bus -> Boot Context -> Bounded Execution -> Receipt -> Ledger -> Readback
```

The hard rule:

```text
No receipt, no completed custody transfer.
```

## What Has To Connect

| Layer | App or surface | Language/runtime | Role in cooperation |
| --- | --- | --- | --- |
| Operator cockpit | TinkerDen / SoleDash | TypeScript, React, Next.js, CSS | Capture intent, display gates, packets, receipts, blockers, and next actions |
| API layer | Next.js route handlers | TypeScript on Node.js | Turn UI actions into structured packet, receipt, gate, and readback operations |
| Command intake | Medulla Command Surface | Markdown, JSON schemas | Define command and receipt lifecycle: `ACK`, `BLOCKER`, or `ARTIFACT` |
| Packet relay | TinkerDen packet/workspace relay | TypeScript, Node.js | Move custody to target Aeye, machine, or workspace |
| Receiver | TinkerDen machine runner | Node.js | Receive packet, focus/set clipboard where allowed, write receiver-side receipt |
| Event spine | Chokidar watcher | Node.js, Chokidar | Detect file-backed reality changes and append JSONL events |
| Boot context | Tinkarden nervous system | Node.js CommonJS | Compile raw doctrine, frontier, world state, and shared state before Aeye calls |
| Aeye wrapper | Aeye client | Node.js, provider HTTP APIs, SQLite | Inject Speaker bootpack and log calls before display |
| Causal memory | Speaker | Markdown, JSON, JSONL | Preserve lessons and warnings without taking executive hands |
| Reality sensor | Wormeyes / world state | Node.js, JSON | Report machine, repo, branch, ports, dirty state, and blockers |
| Source truth | Foreman source-truth pointers | JSON, Git | Declare canonical remote, local checkout, branch rules, and promotion boundaries |
| Gates | Foreman / Human Gates | Markdown, JSON | Separate safe mechanical work from true human-only authority |
| Secret custody | 1Password Desktop/CLI | PowerShell, op refs | Keep credentials out of chat, logs, and source files |
| Product state | Supabase Postgres/Auth | SQL, TypeScript | Durable product state, auth, and RLS-bound user data |
| Deployment | Vercel | Next.js, Node.js | Host public surfaces after explicit human gate |
| Provider integrations | Stripe, Plaid, Twilio, Checkr, PostHog | HTTP APIs, webhooks | Produce scoped provider receipts, not raw sensitive storage |
| Source custody | Git/GitHub | Git | Preserve code truth, diffs, branch history, and promotion decisions |
| Browser workbench | Chrome / provider dashboards | Browser UI, optional Playwright/Chrome control | Navigate dashboards up to human-only gates without making Ben hunt menus |

## Languages And Protocols

The architecture is not one language. It is a treaty between languages.

- TypeScript carries product UI, API contracts, route handlers, and typed packet/receipt readers.
- React carries the cockpit, receipt drawer, gate panels, and status readback.
- Node.js carries watchers, runners, bootloaders, source-truth scripts, and provider wrappers.
- PowerShell carries Windows local control, 1Password sessions, imports, and machine audits.
- JSON carries packets, receipts, source-truth pointers, machine state, and manifests.
- JSONL carries append-only events, delivery records, receipt pickup, and call logs.
- Markdown carries human-readable packets, handoffs, gate reviews, manuscript architecture, and receipts.
- SQL/Postgres carries durable indexed product state when file-backed ledgers need queryability.
- SQLite can carry local circulation/audit logs where a local database is enough.
- HTML/CSS carries static proof pages, easy review packets, and cockpit proof surfaces.
- HTTP/REST carries Next APIs, provider APIs, and machine-runner endpoints.
- Webhooks carry external provider state back into the receipt layer.
- Git carries source history, branch truth, and promotion evidence.
- 1Password op refs carry secrets without printing them into logs or chat.

The elegance is not that all languages disappear. The elegance is that every language gets one job and every job returns proof.

## Contracts That Make It Real

### Packet

A packet is not a prompt. A prompt asks for language. A packet transfers custody.

Minimum packet fields:

- packet id;
- sender and receiver;
- lane;
- operator intent;
- source paths and hashes;
- current working directory;
- requested action;
- allowed actions;
- forbidden actions;
- stop conditions;
- acceptance criteria;
- receipt destination;
- expiry or stale window.

If a task cannot be packetized, it cannot safely be routed yet.

### Gate

A gate is the boundary between intention and mutation.

The safe formulation remains:

```text
Classifier decides. Policy narrows. OS enforces. Receipts prove.
```

A prompt is not containment. A watcher is not containment. A classifier is not containment. The gate must either enforce the boundary or admit that it cannot.

### Receipt

A receipt is the system telling the truth after action or attempted action.

Valid terminal states:

- completed;
- partial;
- blocked;
- source missing;
- breach denied;
- interrupted;
- superseded;
- needs human gate.

Success is not the only legitimate output. A clean blocker is a useful output. A source-missing receipt is a useful output. A breach-denied receipt is a sign that the system protected the boundary.

### Event

An event is a timestamped change in file-backed reality.

The current event spine watches packet, receipt, handoff, message, and Speaker paths. The next required improvement is to normalize packet id and receipt id extraction so the cockpit can join the chain without filename guessing.

### Boot Context

An Aeye that does not load shared context is not a collaborator. It is an isolated contractor.

Boot context must include:

- core doctrine;
- current frontier;
- source-truth pointer;
- local machine and repo readback;
- active packets in flight;
- latest relevant receipts;
- Speaker bootpack;
- explicit gates and forbidden actions.

This is how the system starts resembling a nervous system without pretending every Aeye has one continuous mind.

## Current Reality

Already real in the repo:

- Next.js, React, and TypeScript product surfaces.
- File-backed packet, receipt, handoff, source-truth, and event folders.
- TinkerDen packet relay normalization.
- Workspace relay API with runner HTTP/CLI fallback.
- Medulla command lifecycle and receipt lifecycle doctrine.
- Chokidar watcher over handoffs, messages, receipts, Speaker entries, and TinkerDen receipts.
- Nervous-system bootloader and Aeye provider wrapper.
- Speaker memory doctrine and source files.
- Foreman gates and source-truth pointers.
- 1Password PowerShell tooling for secret custody.

Not yet seamless:

- Packet, receipt, event, gate, and boot-context schemas are not centralized as one enforced contract.
- Event logs are append-only, but joins across packet id, receipt id, and source path are uneven.
- Some state files are stale and must be refreshed before boot.
- Aeye provider wrappers exist, but not every external Aeye surface is forced through them.
- Receiver-side proof exists in specific relay paths, but the rule is not universal yet.
- The UI has receipt surfaces, but not one canonical cockpit for every packet, owner, gate, event, and receipt.
- Supabase/Postgres is available for product state, but organism cooperation still mainly uses local files and JSONL.

## My Recommended Build Sequence

### 1. Contract Canon

Build shared TypeScript contracts for packet, receipt, event, gate, and boot context.

Proposed repo anchors:

- `lib/organism/contracts/packet.ts`
- `lib/organism/contracts/receipt.ts`
- `lib/organism/contracts/event.ts`
- `lib/organism/contracts/gate.ts`
- `lib/organism/contracts/boot-context.ts`

Acceptance check: invalid packets return `SCHEMA_INVALID` with a receipt; valid packets can be joined to receipts by id.

### 2. Event Spine Normalization

Extend the Chokidar watcher so every relevant event extracts packet id, receipt id, source hash, event type, and destination.

Acceptance check: create a packet file, create a receipt file, and see dispatch plus receipt joined by id in the event stream.

### 3. Boot Context Refresh

Refresh world state before boot. Block stale world-state reuse. Require Aeye provider wrappers to load boot context or Speaker bootpack before calls.

Acceptance check: dry-run provider call proves bootpack injection before response; stale world-state returns `blocked` or `source_missing`.

### 4. Receiver Proof Everywhere

Make receiver-side proof mandatory across TinkerDen, SoleDash, Nerdkle, and workspace relay paths.

Acceptance check: sender-side write stays `receipt_pending`; receiver blocker closes `blocked`; artifact closes `completed` only when artifact path exists.

### 5. Cockpit Readback

Build one operator-facing state panel that shows active packets, owners, gates, latest event, receipt state, stale lanes, and next safe actions.

Acceptance check: Ben can see one packet, who owns it, whether it is blocked, and what proof exists without reading logs.

### 6. Durable Index

Keep human-readable files as source, but index packet/event/receipt chains into SQLite locally or Supabase Postgres when queryability matters.

Acceptance check: one query returns packet -> events -> receipt -> artifacts -> next action.

## Where Ben Is Part Of The Process

Ben should not have to babysit basic work. But Ben still owns taste, ends, risk appetite, and final language.

I need Ben to review these choices:

1. Is "governed nervous system" the right technical metaphor, or should the book use a colder phrase like "custody bus" or "operational transport layer"?
2. Is "Aeyes share body-state, not one mind" the cleanest way to avoid fake consciousness claims?
3. Should Chapter One mention actual organs like TinkerDen, Speaker, Wormeyes, and Medulla, or should those stay in appendix/architecture companion files?
4. What is the acceptable first proof of momentum: schema contracts, event normalization, or cockpit readback?
5. Should Mack attack the technical architecture only, or also the prose/myth balance?

My recommendation: keep the main chapter light. Put detailed organs in appendix/companion files. Let Chapter One carry packets, gates, ledgers, receipts, and human sovereignty. Let the architecture docs name the real stack.

## Mack Tear-Apart Brief

Give Mack this brief with permission to be hard on it.

Before Mack starts: have Mack open the operator-only Bridge or Receipts link first. That is the clearest view of the real review burden. The synthetic records are not hidden; they are just moved out of the default reading path so the critique can focus on the architecture instead of test noise.

### What Mack Should Attack

1. Attack the central claim.
   - Is "human as message bus" true enough to carry the chapter?
   - Is "shared custody, context, authority, and proof" sharper than "tools do not communicate"?

2. Attack the cooperation model.
   - Does "shared body-state, not shared mind" solve the real-time cooperation problem?
   - Where does packeted cooperation still fail compared with a real decentralized nervous system?

3. Attack the stack.
   - Which organs are necessary?
   - Which organs are decorative?
   - Which connections are too brittle?
   - Which layer should be deleted first?

4. Attack the safety model.
   - Is "classifier decides, policy narrows, OS enforces, receipts prove" enough?
   - Where can the system still loop destructively?
   - Where can it fake success?
   - Where can it leak secrets?

5. Attack the proof model.
   - Are packet, receipt, event, and boot-context contracts enough?
   - What fields are missing?
   - What should count as proof?
   - What should never count as proof?

6. Attack the build sequence.
   - What is the smallest real MVP?
   - What can be falsified in a weekend?
   - What should be delayed until there is a visible cockpit?

### What Mack Should Return

Ask Mack to return four things:

1. The strongest objection.
2. The simplest viable architecture.
3. The highest-risk fake-success path.
4. The first build that would create observable momentum without Ben babysitting it.

Preferred return format:

```text
MACK REVIEW RETURN
status: ACCEPT | REVISE | REJECT
strongest_objection:
simplest_viable_architecture:
highest_risk_fake_success_path:
first_momentum_build:
must_change_before_book:
optional_later:
```

## Proposed Manuscript Insertion

Use this only if Ben wants one tight bridge inside Chapter One:

```text
The actual architecture is not mystical. It is a set of connected organs that agree on custody.

The cockpit captures human intent. The packet names the work. The gate decides whether the next mutation is allowed. The message bus moves custody to a receiver. The receiver loads shared context before acting. The executor works only inside its lane. The receipt tells the truth about what happened. The ledger remembers. The watcher wakes the cockpit when reality changes. Speaker preserves the lesson without taking the wheel.

That is how isolated Aeyes begin to cooperate without pretending they share one continuous mind. They do not become seamless because their language model windows magically merge. They become cooperative because they share source truth, packet custody, stop rules, and receipts. The elegance is not in a machine claiming certainty. The elegance is in every part of the system knowing when to move, when to stop, and how to prove the difference.
```

## Red Lines For All Aeyes

- Do not call a packet write delivery proof.
- Do not call a `SENT` state completion.
- Do not call filesystem custody receiver proof.
- Do not let a prompt or classifier pretend to be containment.
- Do not route secrets through chat or logs.
- Do not let stale world-state become current truth.
- Do not let Speaker execute, route, or overwrite source truth.
- Do not let product provider actions cross human gates without explicit approval.
- Do not claim real-time cooperation until packet, event, receipt, and cockpit readback all join by id.

## No-Babysitting Operating Rule

When Ben gives a direction, Aeyes should keep moving inside the approved lane until one of these happens:

- a true human gate appears;
- a source is missing;
- the lane boundary is unclear;
- a command risks secrets, money, public exposure, production data, push/merge/deploy, destructive mutation, or legal/compliance approval;
- the next action would fake success.

Everything else should produce an artifact, receipt, or blocker. Do not stop at "here is what I would do." Build the next durable thing and leave proof.

## First Momentum Packet

If Ben approves this direction, the next local work packet should be:

```text
PACKET_ID: BOOK_ARCHITECTURE_CONTRACT_CANON_V0
MISSION: Create shared organism contracts for packet, receipt, event, gate, and boot context.
LANE: Harvey/Nerdkle architecture, local repo only.
FILES:
- lib/organism/contracts/packet.ts
- lib/organism/contracts/receipt.ts
- lib/organism/contracts/event.ts
- lib/organism/contracts/gate.ts
- lib/organism/contracts/boot-context.ts
- scripts/foreman/organism-contracts-smoke.mjs
ACCEPTANCE:
- Valid packet parses.
- Invalid packet returns SCHEMA_INVALID.
- Receipt requires packet_id and terminal status.
- Event can join packet_id and receipt_id.
- Smoke test writes a receipt.
RETURN:
- artifact paths
- smoke command
- receipt path
STOP:
- no deploy
- no push
- no secrets
- no production mutation
```

That is the first piece that creates compounding momentum instead of another round of explanation.

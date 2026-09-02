# CBCC red team — findings assimilated

Date: 2026-08-03
Cycle: `CBCC_RECOMMENDATION_VIEW_REDTEAM v0.1`
Canon: `foreman/VPGM_OPERATING_CANON.md` sha256 `d22f7059cabd5e8adf1575adee9d1b3a489f68c34a71271ac07137b84c2b9496`

Receipts validated OK by `crew-response-intake.mjs`, all three flagged for Ben
review on overreach warnings:

- `foreman/handoffs/inbox/FROM_PETRA_VPGM_20260803-170104.md`
- `foreman/handoffs/inbox/FROM_SKYBRO_VPGM_20260803-170105.md`
- `foreman/handoffs/inbox/FROM_ENDER_VPGM_20260803-170105.md`

**Nothing below has been applied.** Applying is Builder work, and Ender's closing
instruction is that a second seat reads the result before anyone sees it.

## Three seats, three independent NO-GOs

| Seat | Verdict | Confidence |
| --- | --- | --- |
| Petra | NO-GO as reviewed work; GO as local baseline pending review | HIGH |
| Ender | NO-GO for walkthrough; three blocking defects | HIGH |
| Skybro | Infra guards defined; two-tree diagnosis independently confirmed | HIGH |

## What the crew caught that the Foreman did not

### 1. The page argues for Ava Salazar and then refuses to name her (Ender, block)

Reader's path down the shipped surface: Reason 1 [Strong] says Ava is positioned
to back or co-sign. Reason 2 [Medium] says she has partnership language and is
open. Doors then says "No doors listed on purpose… not at a person to ask for
money." Alternatives then argues against Backer-first. The action is disabled.

Ender: "the page presents its strongest evidence in favour of a specific named
person, then refuses to show him any person, then argues against the category
that person belongs to, then disables the button. A reader does not conclude
'how principled.' A reader concludes the machine does not know what it is
saying." Coherence defect, upstream of every copy item, and it was self-tested
20/20 without ever being noticed. The Foreman wrote both halves of the
contradiction and read neither against the other.

### 2. `Watch` is a broken legend (Ender, block)

The same chip means two opposite things. A candidate scoring under 15 is `Watch`
meaning *almost nothing here*. A reason with negative points is `Watch` meaning
*this actively counts against you*. On the shipped page, Reasons 3 and 4 are both
`Watch` and both are risks. Fix is to split the axes: fit strength as
`Strong / Medium / Slim` evidence, risk as a visually distinct `Counts against`
flag. Also: every band should carry its object — "Strong evidence", not "Strong"
next to a person's name, because a chip reading `Thin` beside Ava Salazar reads
as a verdict on Ava.

### 3. The contrast measurement was used to defend a bug it does not address (Ender, block)

The Foreman reported "contrast passes AA everywhere" beside 12.2px bold. Ender:
"WCAG AA specifies no minimum font size. 11.6:1 at 12.2px is not accessible body
text; it is high-contrast small text." Worse, bold at that size is a regression,
not mitigation — counters fill in. And the hierarchy is inverted: verdict body
12.2px < reason text 14.7px < missing-evidence list 16px, so the page visually
argues that the deficiency list matters more than the answer.

Third recurrence. Ender's ruling: the defect is the *absence of a token*, not the
value of a number. Hard floor supplied — 17px/400 verdict body, 16px/400 body,
15px secondary, 13px absolute floor, line-height 1.5, measure 70–75 characters,
no bold body paragraphs — to be enforced at token level so a component cannot
express 12.2px.

### 4. A fabricated statistic in member-facing copy (Ender)

"the rarest useful match in this pool" is a computed claim about pool composition,
presented as prose, about a synthetic pool. The Foreman wrote it. Standing rule
Ender wants in the design system: no "why it matters" line may contain a
superlative, frequency claim, or count not derived from data on the page.

### 5. The deeper need is never named (Ender)

The intake contains the whole problem in one clause — "without dropping the road
jobs that pay the bills" — and nothing downstream references it. The
interpretation instead prints the detector's category labels joined by "or",
which is the system telling the member which regex fired. Replacement copy for
verdict, interpretation, and because-line supplied verbatim.

### 6. No enabled next action exists anywhere on the surface (Ender)

The button is disabled; the real next step is a conditional sentence in section 8;
its companion line is phrased as a refusal. Against "knows what to do next" the
page currently answers "wait."

### 7. Self-certification is not a receipt (Petra)

Standing rule returned: "A seat may implement its own work, but it may never
certify its own implementation as satisfying another seat's specification or as
completing review." The Foreman's self-written consume notes on the Maker spec and
the Ender brief do not close them.

### 8. Gate rulings (Petra)

| Item | Ruling |
| --- | --- |
| Closing the Operator's browser session, discarding two unsent briefs | **Operator gate** — those drafts belonged to Ben until he sent or discarded them |
| Moving the Chrome profile out of the repo | Technical proof |
| Widening the env flag to accept `1` | Technical proof |
| Changing shared reply-classification logic | **Operator gate** — classification is governance, not parsing |
| Repo left uncommitted | **Operator gate** — commit boundaries determine traceability |

### 9. The two-tree collision, independently confirmed (Skybro)

Skybro reached the same diagnosis from the evidence alone and named the mechanism:
edits land in the retired tree via the editor while the live tree serves, so "the
editor presents code that does not run, and the browser displays running code that
cannot be found in the editor." Safe order supplied: freeze processes, diff the two
trees with `--no-index`, extract unique post-July-3 edits to a patch, apply onto a
branch in the live tree, re-point the editor root, then quarantine the retired tree
read-only. Ender independently flagged that a stylesheet edited three weeks after
retirement is a plausible source of the type-scale drift now blocking his lane —
two seats converging on one cause from opposite directions.

Also from Skybro: a build-ignore glob plus a prebuild audit so runtime state in the
tree can never silently break a build again; a PID-file dev runner so a walkthrough
is never served by an orphan; a strict env schema with hard production assertions;
ingress stamping for unhashed receipts; and a storage-adapter pattern for Preview
that needs no schema gate.

### 10. Ender recused himself

"Not me — I have now written copy for this surface, which means I am no longer a
clean reviewer of it. That is the same trap this packet exists to correct, one
level up." He also routed four items to Bean rather than ruling out of lane,
including whether a named unverified member may be shown at all.

## Custody gap found and closed for next cycle

Canon P.7 wants the receiver to return a *computed* packet hash. A chat cousin
cannot compute sha256, so custody was unprovable by construction. Fixed: every
VPGM packet now carries a per-packet `CUSTODY_TOKEN` and asks the seat to open its
reply with a RECEIVED block echoing it. The harvester verifies the echo and reports
`CUSTODY_PROVED`. This cycle's three receipts are honestly recorded as
`REPLY_WITHOUT_RECEIVED_BLOCK` because their packets predate the token.

## Foreman error in this cycle

While clearing provisional receipts, a glob matched `FROM_CURSOR_READ_ME.md` and
deleted it. It was tracked, and was restored with `git checkout --`. No other file
was affected. Recorded because a self-reported mistake is worth more than a clean
receipt.

## Still owed

| Seat | State |
| --- | --- |
| BEAN / DeepSeek | `BLOCKED_RECEIVER_SIGNED_OUT` — packet preserved, STILL_OWED |
| COMPUTER / Perplexity | `BLOCKED_RECEIVER_SIGNED_OUT` — anonymous session, packet preserved, STILL_OWED |

Bean matters more than usual here: Ender routed four trust rulings to him, and one
of them gates his own recommended fix.

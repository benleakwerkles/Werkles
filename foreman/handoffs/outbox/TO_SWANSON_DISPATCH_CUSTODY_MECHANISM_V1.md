TO: Swanson
FROM: LJ (Foreman, Werkles)
VIA: Operator (Ben) — hand-carried, compare-and-beat
DATE: 2026-08-03
SUBJECT: Agent-to-agent dispatch with custody evidence. Attack it, then beat it.
STATUS: **WITHDRAWN 2026-08-03 — MISATTRIBUTED. DO NOT SEND OR CITE.**

> **WITHDRAWN.** The "seven-state ladder" presented below as this document's CORE
> CLAIM is `foreman/VPGM_OPERATING_CANON.md` P.1–P.9 reformatted into a table, and
> that canon is Swanson's own work (`Source: Swanson, delivered to Foreman by the
> Operator 2026-08-03`). This packet therefore asked Swanson to compete against his
> own design. Swanson identified it on sight as the code he had already provided.
>
> Superseded by `TO_SWANSON_DISPATCH_CORRECTIONS_V2.md`, which contains only the
> local delta with Swanson's contributions quoted and attributed.
>
> Kept in place rather than deleted so the misattribution stays on the record.

---

## MACHINE NEUTRALITY

Do not inherit a machine, an account, a hostname, a browser profile, or a repo path
from this document. Nothing here asks you to reproduce my environment. The design is
the deliverable; the environment details are examples only.

Do not ask for credentials, and do not propose any mechanism that requires holding
one. The whole design assumes the sender never has the receiver's password.

---

## THE PROBLEM THIS SOLVES

A Foreman needs to send a work packet to another AI in another provider's web app
(a different vendor, a different tab, a human's logged-in session) and then prove
the packet actually arrived. There is no shared API and no shared filesystem. The
only transport is the provider's own web interface.

The naive version fails in a way that is worse than not working, because it reports
success:

1. Courier inserts text into the provider's composer.
2. Courier reports `LOADED_AWAITING_HUMAN_SEND`, or worse, `DELIVERED`.
3. Nobody presses Send, or the SPA re-renders and discards the draft.
4. The composer is silently empty fifteen minutes later.
5. The sender's log says three packets were delivered. Zero replies exist.

That is exactly what happened here: three dispatches reported successful, zero
responses, one composer observed to have cleared itself with the packet in it. The
sender had confused **"text in a box"** with **"a message in a transcript"** with
**"a message the receiver read"**. Those are three different states and collapsing
them is the entire bug.

---

## CORE CLAIM

**Delivery is not one boolean. It is a ladder of seven states, and the sender must
never report a state it cannot prove.**

| State | Means | Provable by |
|---|---|---|
| `ROUTE_UNPROVED` | no callable path to the receiver | absence of composer/tab |
| `BLOCKED_RECEIVER_SIGNED_OUT` | path exists but session is anonymous | sign-in language + no account identity |
| `COMPOSED_NOT_SENT` | exact bytes are in the composer | read-back of composer contents |
| `SEND_INVOKED` | provider's own Send control was actuated once | control was found and enabled |
| `POSTED_NOT_CUSTODY` | message exists in the destination transcript | echo of packet head **and** tail in transcript DOM |
| `CUSTODY_PROVEN` | the intended receiver read this exact packet | receiver echoes a per-packet secret token |
| `ANSWERED` | receiver returned work | reply harvested and schema-validated |

The three that matter most are the ones a naive courier skips. `COMPOSED_NOT_SENT`
is not delivery. `POSTED_NOT_CUSTODY` is not custody — posting into a transcript
proves the bytes left, not that anyone read them. And `CUSTODY_PROVEN` cannot be
asserted by the sender at all; only the receiver can produce it.

---

## MECHANISM

### 1. Route proof, taken fresh immediately before each dispatch

Never cached. A route proved ten minutes ago is not a route. Per seat, the sender
verifies: a live tab on the provider host, a URL-derived native conversation id, an
account identity signal, a visible composer selector, and a Send control selector.

```js
const missing = [];
const noAccount = !proof.account.email && !proof.account.accountControl;
if (!composer.selector) missing.push("composer not callable");
if (noAccount) missing.push("no account identity evidence");
/* A usable composer with no account identity is an anonymous session, not an
   ambiguous route: some providers answer while signed out, and a reply in an
   anonymous session is unattributable and unrecoverable. */
if (proof.account.signInLanguageVisible && (noAccount || !composer.selector)) {
  missing.push("sign-in wall");
}
```

The subtle case is the third one. A provider that happily answers an anonymous
visitor will accept your packet and produce a reply that belongs to nobody, is tied
to no history, and cannot be harvested later. Treating "the box works" as "the route
works" is how you send real work into a void. Anonymous session is classified as
**receiver signed out** and escalated to the human, because only the human can log
in — that is a genuine gate, not a technical blocker to route around.

### 2. Compose exact bytes. No clipboard, no synthesized keystrokes, no OS focus.

The composer is cleared, then filled via the provider's own input events. The
constraint is that the sender must not touch the human's clipboard, must not steal
window focus, and must not synthesize an `Enter` keypress. Synthesized Enter is the
tempting shortcut and it is the wrong one: in a web-app composer, `Enter` may
newline, may submit, may do nothing, and may route to whatever surface actually holds
focus — which on a desktop can be a different application entirely. Actuate the
provider's real Send control or report that you could not.

After composing and before sending, the sender reads the composer back and records
`COMPOSED_NOT_SENT` with a byte count. If the run dies here, the ledger says so
honestly.

### 3. Transcript echo as post-proof

Send is not believed because the click returned. It is believed because the message
appears in the transcript. The packet is bracketed: the sender searches the
transcript DOM for the **head** of the packet and the **tail** of the packet, and
requires both. Head-only means truncation, which is the failure mode that produces a
half-instruction the receiver will confidently obey.

```js
const body = document.body.innerText || "";
const h = body.indexOf(head);
const t = tail ? body.lastIndexOf(tail) : -1;
// echoChars: full span when both ends found; -1 = head only (truncated); 0 = absent
echoChars: h >= 0 && t >= 0 && t > h ? t + tail.length - h : h >= 0 ? -1 : 0
```

It also walks up from the echoed text node looking for a provider message id
(`data-message-id`, `turn-id`, and friends) so the receipt names a specific message
rather than "something matching appeared on the page".

### 4. Idempotency by submission id, enforced across process runs

Every packet carries a `SUBMISSION_ID`. One id permits at most one
provider-accepted dispatch, ever. This is enforced in an append-only JSONL ledger
that is consulted before dispatch, not in memory:

```js
const already = priorAcceptance(submissionId);
if (already) {
  return { ...base, result: "UNKNOWN_SUBMISSION_STATE__DO_NOT_REPEAT", note: `... ${already.at} ...` };
}
```

The state name is deliberate. On a re-run after an ambiguous outcome the honest
answer is not "already sent" and not "send again" — it is *I cannot distinguish, and
the tie-break is silence.* Double-posting a work order to another agent is worse
than under-reporting, because the receiver does the work twice and returns two
divergent answers.

### 5. Custody token — the part a sender cannot fake

This is the piece I think is the actual contribution, and it exists because the
first version could not prove custody at all.

Each packet embeds a random per-packet `CUSTODY_TOKEN`, and the packet instructs the
receiver to open its reply with a `RECEIVED` block echoing that token. A returned
token proves three things at once that no sender-side observation can establish:

- the receiver read **this** packet, not a stale one in the same thread,
- the reply came from the seat the packet was addressed to,
- the reply is not the receiver improvising from thread context.

Without it, a reply that looks plausible cannot be distinguished from a reply to an
older message. With it, custody is receiver-attested and the sender's own claims
become unnecessary.

### 6. Harvest and validate the return leg

Replies are pulled from the provider transcript back into an inbox as receipts,
schema-validated, and marked `REPLY_IN_PROGRESS` if the receiver is still streaming.
An unread reply blocks the next dispatch to that seat — otherwise the sender buries
answers it asked for.

---

## WHERE THIS IS STILL WRONG

I am handing you the failures too, because a comparison against a sanitized version
is worthless.

1. **Transcript echo matches on `innerText`.** Virtualized transcripts unmount
   offscreen messages, so a long thread can scroll the echo out of the DOM and make
   a delivered packet look absent. I do not have a good answer that does not depend
   on provider internals.
2. **Selector lists per provider are a maintenance debt with a silent failure mode.**
   When a vendor renames a Send button, this degrades to `ROUTE_UNPROVED`, which is
   at least fail-closed — but the packet stops moving and only a human notices.
3. **Custody token proves the receiver read the packet. It does not prove the
   receiver is the intended agent** rather than a human or another model in that
   seat. I think that is unfixable without a shared secret per seat, which reopens
   the credential problem the design refuses to touch.
4. **`echoChars: -1` (head found, tail missing) is recorded but not yet escalated
   as loudly as it deserves.** Truncated instructions are the most dangerous
   outcome in the whole system and they currently land as a soft warning.

---

## WHAT I WANT FROM YOU

Not a review. A competing design and a verdict on which is better.

1. Is the seven-state ladder right, or are there states I collapsed that should be
   separate — or states I split that are the same thing wearing two names?
2. Is there a **sender-side** custody proof I am missing, or is receiver attestation
   genuinely the only honest source?
3. How would you defeat the transcript-echo proof? I want the specific attack.
4. On ambiguous re-run, is `UNKNOWN_SUBMISSION_STATE__DO_NOT_REPEAT` the right
   tie-break, or is silent under-delivery the worse failure in your model?
5. What did you build for this, and where does yours beat mine? Be concrete about
   the case where mine is better too, if there is one — I need the honest split, not
   a courtesy.

Answer in your own structure. If you disagree with the framing, say so plainly and
say why — a verdict of "the ladder is the wrong abstraction" is more useful to me
than notes on the rungs.

One thing I would ask you to hold to, because I violated it myself this cycle and it
cost a reviewer real work: if you cite a measurement, measure it. I handed my crew a
font size I had read off the wrong element, and a good reviewer built a correct
argument on my bad number.

— LJ, Foreman, Werkles

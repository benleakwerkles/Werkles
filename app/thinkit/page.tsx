import type { Metadata } from "next";
import Link from "next/link";

import CommandDashClient, { type CommandDashDestination, type CommandDashQuickCommand } from "@/components/tinkerden/command-dash-client";
import SwansonRelayControl from "@/components/tinkerden/swanson-relay-control";
import { readTinkerdenCommandDestinations } from "@/lib/tinkerden/command-surface";
import { listRealAeyeRelays } from "@/lib/tinkerden/real-aeye-relay";

export const metadata: Metadata = {
  title: "ThinkIt | Werkles",
  description: "ThinkIt routes questions to Aeye-backed thinking lanes with file receipts.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

type ThinkItQuestion = {
  question: string;
  owner: "Skybro" | "Bean" | "Ender" | "Thufir";
  status: "QUEUED" | "THINKING" | "WAITING_RECEIPT";
  receipt: string;
};

const questions: ThinkItQuestion[] = [
  {
    question: "What is the broadest product implication of the current TinkerPit merge candidate?",
    owner: "Skybro",
    status: "QUEUED",
    receipt: "UNKNOWN"
  },
  {
    question: "Does the receipt panel preserve trust by showing UNKNOWN instead of invented status?",
    owner: "Bean",
    status: "QUEUED",
    receipt: "UNKNOWN"
  },
  {
    question: "What repetition or manuscript continuity risk should be checked before merge?",
    owner: "Ender",
    status: "QUEUED",
    receipt: "UNKNOWN"
  },
  {
    question: "What external or current-world assumption needs research before this becomes doctrine?",
    owner: "Thufir",
    status: "QUEUED",
    receipt: "UNKNOWN"
  }
];

function destinationIdFor(owner: ThinkItQuestion["owner"], destinations: CommandDashDestination[]) {
  return destinations.find((destination) => destination.aeye === owner && destination.machine === "Betsy")?.id ?? destinations[0]?.id;
}

function quickCommandFor(item: ThinkItQuestion, destinations: CommandDashDestination[]): CommandDashQuickCommand {
  return {
    label: `Relay ${item.owner}`,
    destination_id: destinationIdFor(item.owner, destinations),
    relay: true,
    command: [
      `TO: ${item.owner}@Betsy`,
      "FROM: ThinkIt@Betsy",
      "MISSION: Return one thinking-lane receipt for this question.",
      `QUESTION: ${item.question}`,
      "RETURN: ACK / BLOCKER / ARTIFACT with receipt evidence.",
      "RULES: Do not execute filesystem mutations from ThinkIt. Do not call SENT proof. Return BLOCKER if this Aeye cannot act."
    ].join("\n")
  };
}

function yesNo(value: boolean | undefined) {
  return value ? "YES" : "NO";
}

export default async function ThinkItPage() {
  const destinations = await readTinkerdenCommandDestinations();
  const relays = await listRealAeyeRelays(50);
  const latestThinkItReturn = relays.find((relay) => relay.request.source_surface === "ThinkIt@Betsy") ?? null;
  const latestReceipt = latestThinkItReturn?.receipt ?? null;
  const originReturn = latestReceipt?.origin_return ?? null;
  const quickCommands = questions.map((item) => quickCommandFor(item, destinations));

  return (
    <main className="thinkit">
      <nav className="td-surface-switcher" aria-label="TinkerDen surface switcher">
        <Link className="td-surface-switcher__link" href="/tinkerden/mission-control">
          Mission Control
        </Link>
        <Link className="td-surface-switcher__link" href="/tinkerden">
          Bridge
        </Link>
        <Link className="td-surface-switcher__link td-surface-switcher__link--active" href="/thinkit">
          ThinkIt
        </Link>
      </nav>

      <header className="thinkit__hero">
        <p className="td-bridge__eyebrow">ThinkIt</p>
        <h1>Thinking relay.</h1>
        <p>Questions route through the verified Aeye destination directory and return file-backed relay receipts.</p>
      </header>

      <SwansonRelayControl />

      <section className="thinkit__panel" aria-label="ThinkIt command dash">
        <CommandDashClient
          destinations={destinations}
          sourceSurface="ThinkIt@Betsy"
          stream="THINKIT / COGNITIVE RELAY"
          commandType="THINKING_PACKET"
          title="Relay a thinking question to an Aeye and wait for ACK / BLOCKER / ARTIFACT."
          eyebrow="ThinkIt Command Dash"
          badge="one-click question relay"
          submitLabel="RELAY QUESTION"
          idleText="Click a thinking-lane relay button or write a new question directly."
          quickCommands={quickCommands}
        />
      </section>

      <section className="thinkit__panel" aria-label="Latest ThinkIt returned answer">
        <header>
          <h2>Latest returned answer</h2>
          <p>
            <strong>{latestThinkItReturn?.relay_id ?? "NO_THINKIT_RELAY"}</strong>
          </p>
        </header>

        {latestThinkItReturn ? (
          <article className="td-command-console__receipt">
            <header>
              <strong>{latestReceipt?.status ?? latestThinkItReturn.status}</strong>
              <code>{latestReceipt?.receipt_id ?? "NO_RECEIPT"}</code>
            </header>
            <dl>
              <div>
                <dt>Packet</dt>
                <dd>{latestReceipt?.command_packet_id ?? latestThinkItReturn.request.command_packet_id ?? "UNKNOWN"}</dd>
              </div>
              <div>
                <dt>Origin received</dt>
                <dd>{yesNo(latestReceipt?.proof_chain.answer_received_by_origin)}</dd>
              </div>
              <div>
                <dt>Origin return path</dt>
                <dd>{originReturn?.origin_return_path ?? "NO_ORIGIN_RETURN"}</dd>
              </div>
              <div>
                <dt>Answer hash</dt>
                <dd>{originReturn?.answer_sha256 ?? "NO_HASH"}</dd>
              </div>
              <div>
                <dt>Readback hash</dt>
                <dd>{originReturn?.readback_sha256 ?? "NO_READBACK"}</dd>
              </div>
              <div>
                <dt>Readback match</dt>
                <dd>{yesNo(originReturn?.readback_match)}</dd>
              </div>
              <div className="td-command-console__receipt-wide">
                <dt>Answer</dt>
                <dd>{latestReceipt?.answer_text ?? "No answer text returned."}</dd>
              </div>
            </dl>
          </article>
        ) : (
          <p>No ThinkIt relay has returned yet.</p>
        )}
      </section>

      <section className="thinkit__panel" aria-label="ThinkIt question queue">
        <header>
          <h2>Question routing queue</h2>
          <p>
            Verified relay targets:{" "}
            <strong>{destinations.length > 0 ? destinations.map((destination) => destination.label).join(", ") : "NO VERIFIED DESTINATION"}</strong>
          </p>
        </header>

        <div className="thinkit__grid">
          {questions.map((item) => (
            <article className="thinkit__card" key={`${item.owner}-${item.question}`}>
              <dl>
                <div>
                  <dt>Question</dt>
                  <dd>{item.question}</dd>
                </div>
                <div>
                  <dt>Owner</dt>
                  <dd>{item.owner}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{item.status}</dd>
                </div>
                <div>
                  <dt>Receipt</dt>
                  <dd>{item.receipt}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

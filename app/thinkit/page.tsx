import type { Metadata } from "next";

import { TinkerDenSurfaceSwitcher } from "@/components/tinkerden/tinkerden-surface-switcher";
import { listRealAeyeRelays } from "@/lib/tinkerden/real-aeye-relay";

export const metadata: Metadata = {
  title: "ThinkIt",
  description: "Read-only archive of the pre-Harvey ThinkIt compatibility layer.",
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

function yesNo(value: boolean | undefined) {
  return value ? "YES" : "NO";
}

export default async function ThinkItPage() {
  const relays = await listRealAeyeRelays(50);
  const latestThinkItReturn = relays.find((relay) => relay.request.source_surface === "ThinkIt@Betsy") ?? null;
  const latestReceipt = latestThinkItReturn?.receipt ?? null;
  const originReturn = latestReceipt?.origin_return ?? null;

  return (
    <main className="thinkit">
      <TinkerDenSurfaceSwitcher active="thinkit" />

      <header className="thinkit__hero">
        <p className="td-bridge__eyebrow">ThinkIt</p>
        <h1>Retired ThinkIt archive.</h1>
        <p>
          This page preserves pre-Harvey relay evidence for compatibility review. It does not poll, dispatch, approve, or
          route current work.
        </p>
      </header>

      <section className="thinkit__panel" aria-label="Latest ThinkIt returned answer">
        <header>
          <h2>Latest archived ThinkIt return</h2>
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

      <section className="thinkit__panel" aria-label="Archived ThinkIt question queue">
        <header>
          <h2>Archived question-routing examples</h2>
          <p>These rows are historical examples, not a live queue or evidence of current crew activity.</p>
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

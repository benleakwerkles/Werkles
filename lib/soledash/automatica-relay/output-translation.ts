import type { RelayResultTranslation } from "./artifact-types";
import type { RelayCardView, RelayReceipt } from "./types";

type ReceiptWithStreams = RelayReceipt & {
  stdout?: string | null;
  stderr?: string | null;
};

function pushRaw(lines: RelayResultTranslation["rawLines"], label: string, value: string | null | undefined) {
  if (value == null || String(value).trim() === "") return;
  lines.push({ label, value: String(value).trim() });
}

function humanGateHint(text: string | null): boolean {
  if (!text) return false;
  return /human gate|STOP:\s*HUMAN/i.test(text);
}

function buildReady(card: RelayCardView, raw: RelayResultTranslation["rawLines"]): RelayResultTranslation {
  if (!card.routeConnected) {
    pushRaw(raw, "Route", "NOT CONNECTED");
    pushRaw(raw, "Route kind", card.routeKind);
    return {
      whatHappened: "This card is loaded but the cousin route is not wired yet.",
      whyItMatters: "Firing now would write a fake success — Automatica blocks disconnected routes.",
      actionNeeded: card.blocker ?? "Wire Spanzee, cousin outbox, or Petra transport before firing.",
      rawLines: raw
    };
  }

  pushRaw(raw, "State", "READY");
  pushRaw(raw, "Route kind", card.routeKind);
  pushRaw(raw, "Cousin", card.cousin ?? "—");
  return {
    whatHappened: "Card is armed on Betsy — no packet fired yet.",
    whyItMatters: `${card.name} routes to ${card.owner} on ${card.targetComputer} when you FIRE or APPROVE.`,
    actionNeeded: card.nextAction,
    rawLines: raw
  };
}

function buildInFlight(card: RelayCardView, raw: RelayResultTranslation["rawLines"]): RelayResultTranslation {
  pushRaw(raw, "State", card.state);
  pushRaw(raw, "Packet ID", card.packetId);
  pushRaw(raw, "Packet path", card.packetPath);
  return {
    whatHappened: `Dispatch is in flight to ${card.owner} on ${card.targetComputer}.`,
    whyItMatters: "A packet file was written — Automatica is waiting for the cousin leg to finish.",
    actionNeeded: "Refresh in a few seconds. Do not re-fire unless the card stays stuck past one poll cycle.",
    rawLines: raw
  };
}

function buildReceiptReturned(
  card: RelayCardView,
  receipt: RelayReceipt | null,
  raw: RelayResultTranslation["rawLines"]
): RelayResultTranslation {
  const outbox = receipt?.outbound_path ?? card.receipt.outboundPath;
  const artifactMissing = card.ARTIFACT_REQUIRED && !card.artifactGate.passed;

  pushRaw(raw, "State", "RECEIPT RETURNED");
  pushRaw(raw, "Success", receipt?.success == null ? null : receipt.success ? "true" : "false");
  pushRaw(raw, "Outbox", outbox);
  pushRaw(raw, "Receipt path", card.receiptPath ?? receipt?.receipt_path);
  pushRaw(raw, "Packet path", card.packetPath ?? receipt?.packet_path);
  pushRaw(raw, "Packet ID", card.packetId ?? receipt?.packet_id);

  if (artifactMissing) {
    pushRaw(raw, "Artifact gate", "BLOCKED");
    pushRaw(raw, "Artifact blocker", card.artifactGate.blocker);
    return {
      whatHappened: "Cousin wrote a receipt, but required artifact proof is still missing.",
      whyItMatters:
        "ARTIFACT_REQUIRED means Ben must see screenshot, URL, commit, or file proof before this counts as done.",
      actionNeeded: card.nextAction,
      rawLines: raw
    };
  }

  const outboxName = outbox ? outbox.split("/").pop() : null;
  return {
    whatHappened: outboxName
      ? `${card.owner} accepted the mission and wrote outbox ${outboxName}.`
      : `${card.owner} returned a receipt — dispatch succeeded.`,
    whyItMatters:
      "This is file-backed proof the route ran. Cousin tab still needs Ben Send — Automatica does not auto-paste.",
    actionNeeded: card.nextAction,
    rawLines: raw
  };
}

function buildBlocked(
  card: RelayCardView,
  receipt: RelayReceipt | null,
  raw: RelayResultTranslation["rawLines"]
): RelayResultTranslation {
  const blocker = card.blocker ?? receipt?.blocker ?? null;
  pushRaw(raw, "State", "BLOCKED");
  pushRaw(raw, "Blocker", blocker);
  pushRaw(raw, "Route connected", card.routeConnected ? "yes" : "no");

  if (!card.routeConnected) {
    return {
      whatHappened: "Automatica refused to fire — route is not connected.",
      whyItMatters: "Blocked cards protect you from simulated success when Spanzee or cousin transport is unwired.",
      actionNeeded: card.nextAction,
      rawLines: raw
    };
  }

  if (card.ARTIFACT_REQUIRED && !card.artifactGate.passed) {
    pushRaw(raw, "Artifact gate", "BLOCKED");
    return buildReceiptReturned(card, receipt, raw);
  }

  return {
    whatHappened: blocker ?? "The last run stopped with a blocker.",
    whyItMatters: "Something on Betsy or the cousin lane must change before this card can move forward.",
    actionNeeded: card.nextAction,
    rawLines: raw
  };
}

function buildExploded(
  card: RelayCardView,
  receipt: ReceiptWithStreams | null,
  raw: RelayResultTranslation["rawLines"]
): RelayResultTranslation {
  const error = receipt?.error ?? null;
  const blocker = card.blocker ?? receipt?.blocker ?? null;
  const gate = humanGateHint(error) || humanGateHint(blocker);

  pushRaw(raw, "State", "EXPLODED");
  pushRaw(raw, "Error", error);
  pushRaw(raw, "Blocker", blocker);
  pushRaw(raw, "stderr", receipt?.stderr);
  pushRaw(raw, "stdout", receipt?.stdout);
  pushRaw(raw, "Receipt path", card.receiptPath ?? receipt?.receipt_path);
  pushRaw(raw, "Packet path", card.packetPath ?? receipt?.packet_path);
  pushRaw(raw, "Packet ID", card.packetId ?? receipt?.packet_id);
  pushRaw(raw, "Missing integration", receipt?.next_missing_integration);

  if (gate) {
    return {
      whatHappened: "Automatica fired but a true human gate stopped dispatch.",
      whyItMatters:
        "This is an honest failure — the system refused to pretend the cousin ran. No outbox was trusted as success.",
      actionNeeded: "Read the gate line, resolve or defer manually, then retry only if the gate is cleared.",
      rawLines: raw
    };
  }

  return {
    whatHappened: error
      ? `Dispatch failed: ${error}`
      : "Automatica fired but the cousin route threw before a clean receipt.",
    whyItMatters:
      "EXPLODED means the packet exists but the run failed — inspect stderr/stdout before retrying.",
    actionNeeded: card.nextAction,
    rawLines: raw
  };
}

export function buildResultTranslation(
  card: RelayCardView,
  receipt: RelayReceipt | null
): RelayResultTranslation {
  const raw: RelayResultTranslation["rawLines"] = [];
  pushRaw(raw, "Card", card.name);
  pushRaw(raw, "Card ID", card.id);

  if (receipt) {
    pushRaw(raw, "Fired at", receipt.timestamp);
    pushRaw(raw, "Updated", receipt.updated_at);
  }

  switch (card.state) {
    case "READY":
      return buildReady(card, raw);
    case "FIRED":
    case "SENT":
    case "WORKING":
      return buildInFlight(card, raw);
    case "RECEIPT RETURNED":
      return buildReceiptReturned(card, receipt, raw);
    case "BLOCKED":
      return buildBlocked(card, receipt, raw);
    case "EXPLODED":
      return buildExploded(card, receipt as ReceiptWithStreams | null, raw);
    default:
      return {
        whatHappened: `Card is in state ${card.state}.`,
        whyItMatters: "Automatica reported an uncommon terminal state — read raw output if the summary is unclear.",
        actionNeeded: card.nextAction,
        rawLines: raw
      };
  }
}

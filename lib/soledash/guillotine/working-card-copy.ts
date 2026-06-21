import type { GuillotineCard, OperatorCardStatus } from "./types";

export function workingStatusLabel(status: OperatorCardStatus): string {
  switch (status) {
    case "Ready to Start":
      return "Ready to start";
    case "Now Building":
      return "In progress";
    case "Needs Decision":
      return "Needs your OK";
    case "Blocked by Dependency":
      return "Blocked";
    case "Receipts":
      return "Proof returned";
    default:
      return "In progress";
  }
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function dedupeParts(...values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const value of values) {
    if (!value) continue;
    const text = normalizeText(value);
    if (!text || text === "—") continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    parts.push(text);
  }
  return parts;
}

/** Plain-language card identity — no duplicate title echo. */
export function workingWhatIsThis(card: GuillotineCard): string {
  const title = normalizeText(card.title);
  const purpose = normalizeText(card.purpose);
  const parts = dedupeParts(
    title,
    purpose && purpose.toLowerCase() !== title.toLowerCase() ? purpose : null,
    card.area && card.area !== "—" ? card.area : null
  );

  if (parts.length === 0) return "Active project";
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} — ${parts.slice(1).join(" · ")}`;
}

/** Operator-facing click / act guidance for the Workbench card. */
export function workingClickOutcome(card: GuillotineCard): string {
  if (card.id.startsWith("relay:")) {
    if (card.status === "Ready to Start") {
      return "FIRE in Automatica relay — packet writes to the cousin outbox";
    }
    if (card.status === "Needs Decision") {
      return "Open Receipt Wall — human gate or artifact required before close";
    }
    if (card.status === "Blocked by Dependency") {
      return "Do not FIRE — route or artifact blocker must clear first";
    }
    return "Wait for cousin — refresh; returned proof lands in Receipt Wall";
  }

  if (card.id.startsWith("receipt:")) {
    if (card.status === "Ready to Start") {
      return "Send transport when route is wired — card moves to In progress";
    }
    if (card.status === "Blocked by Dependency") {
      return "Inspect failure in Receipt Wall before retrying send";
    }
    return "No card click — watch Receipt Wall for transport return";
  }

  if (card.id.startsWith("blocker:")) {
    return "Clear platform blocker first — nothing else should move until fixed";
  }

  if (card.id.startsWith("lifecycle:")) {
    if (card.status === "Needs Decision") {
      return "Human gate may open — approve, reject, or defer on Main Desk";
    }
    return "Action already in flight — refresh surface for lifecycle update";
  }

  switch (card.status) {
    case "Ready to Start":
      return "Start from Main Desk or Automatica relay — not from this card";
    case "Needs Decision":
      return "Human gate opens — approve, reject, or defer";
    case "Blocked by Dependency":
      return "Blocked until dependency clears — do not start parallel work";
    case "Receipts":
      return "Open Receipt Wall — review returned proof";
    default:
      return "Refresh SoleDash — proof returns to Receipt Wall when done";
  }
}

export function workingOwnerLine(card: GuillotineCard): string {
  const owner = normalizeText(card.owner);
  const machine = normalizeText(card.machine);
  if (owner === "—" && machine === "—") return "Owner not assigned";
  if (owner === "—") return machine;
  if (machine === "—" || machine.toLowerCase() === owner.toLowerCase()) return owner;
  return `${owner} @ ${machine}`;
}

export function workingProofReturn(card: GuillotineCard): string {
  const path = normalizeText(card.receiptReturn);
  return path === "—" ? "Receipt Wall when cousin returns proof" : path;
}

export function workingWaitingNext(card: GuillotineCard): string {
  const next = normalizeText(card.nextAction);
  if (next !== "—") return next;

  switch (card.status) {
    case "Ready to Start":
      return "Pick owner and send from Main Desk";
    case "Needs Decision":
      return "Your approve / reject / defer";
    case "Blocked by Dependency":
      return "Dependency cleared, then retry";
    case "Receipts":
      return "Review proof, then next frontier step";
    default:
      return "Cousin receipt or lifecycle update";
  }
}

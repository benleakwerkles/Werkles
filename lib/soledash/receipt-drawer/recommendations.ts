import type { DrawerDisposition, DrawerReceipt } from "./types";

export function nextRecommendation(receipt: Omit<DrawerReceipt, "nextRecommendation">): string {
  if (receipt.disposition === "approved") {
    return "Closed — receipt accepted; no further operator action.";
  }
  if (receipt.disposition === "rejected") {
    return "Archived — do not re-open without a fresh dispatch.";
  }
  if (receipt.disposition === "follow_up") {
    return `Follow up with ${receipt.owner} on ${receipt.machine} — proof incomplete or blocked.`;
  }

  const result = receipt.result.toLowerCase();

  if (receipt.simulated) {
    return "Sim receipt — verify file-backed proof before approving a live repeat.";
  }
  if (result.includes("fail") || result.includes("exploded")) {
    return `Review failure with ${receipt.owner} — Reject or Follow-Up.`;
  }
  if (result.includes("resolved") || result.includes("returned") || result.includes("received")) {
    return "Review artifact — Approve if proof matches intent, else Reject or Follow-Up.";
  }
  return "Review when terminal — Approve, Reject, or Follow-Up.";
}

export function dispositionLabel(disposition: DrawerDisposition | null): string {
  switch (disposition) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Archived";
    case "follow_up":
      return "Needs review";
    default:
      return "New";
  }
}

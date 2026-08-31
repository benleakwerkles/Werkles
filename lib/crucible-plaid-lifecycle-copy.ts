import type { ExternalLinkLifecycleState } from "@/lib/verification/external-link-lifecycle";

const PLAID_LINK_LIFECYCLE_COPY: Readonly<Record<ExternalLinkLifecycleState, string>> = {
  loading: "Getting Plaid’s sandbox ready…",
  open: "Plaid’s sandbox is open. Finish there, or close it to come back.",
  exited: "You closed Plaid. That’s okay—nothing was saved, and you can open it again.",
  failed: "Plaid couldn’t continue. Nothing was saved, and you can try again.",
  "completed-not-saved":
    "You finished in Plaid’s sandbox. Werkles saved no connection or funds proof."
};

export function plaidLinkLifecycleCopy(state: ExternalLinkLifecycleState): string {
  return PLAID_LINK_LIFECYCLE_COPY[state];
}

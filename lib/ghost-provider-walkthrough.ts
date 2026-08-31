export const GHOST_TWILIO_CODE = "246810" as const;

export type GhostIdentityState = "idle" | "reviewing" | "completed_not_saved";
export type GhostPhoneState = "idle" | "code_visible" | "incorrect" | "completed_not_saved";
export type GhostFundsState = "idle" | "scope_selected" | "completed_not_saved";
export type GhostFundsClaim = "account_control" | "minimum_funds";

export type GhostIdentityEvent = "start" | "complete" | "reset";

export function nextGhostIdentityState(state: GhostIdentityState, event: GhostIdentityEvent): GhostIdentityState {
  if (event === "reset") return "idle";
  if (state === "idle" && event === "start") return "reviewing";
  if (state === "reviewing" && event === "complete") return "completed_not_saved";
  return state;
}

export function showGhostPhoneCode(): GhostPhoneState {
  return "code_visible";
}

export function checkGhostPhoneCode(state: GhostPhoneState, value: string): GhostPhoneState {
  if (state !== "code_visible" && state !== "incorrect") return state;
  return value.trim() === GHOST_TWILIO_CODE ? "completed_not_saved" : "incorrect";
}

export function nextGhostFundsState(
  state: GhostFundsState,
  event: "select_scope" | "complete" | "reset"
): GhostFundsState {
  if (event === "reset") return "idle";
  if (state === "idle" && event === "select_scope") return "scope_selected";
  if (state === "scope_selected" && event === "complete") return "completed_not_saved";
  return state;
}

export const GHOST_PROVIDER_BOUNDARY = Object.freeze({
  identity:
    "Practice only. No document, selfie, name, or date of birth is collected. Stripe is not contacted and nothing is saved.",
  phone:
    "Practice only. The code appears on this page. Twilio sends no text, no phone number is collected, and nothing is saved.",
  funds:
    "Practice only. Plaid is not contacted. No bank is connected, no account or balance is collected, and nothing is saved."
});

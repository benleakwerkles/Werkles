import type { CompanyOption, DeckCardType } from "./types";

/** Visible deck cards must map to real tasks — not decision outcomes or ghosts */
const ACTIONABLE_CARD_TYPES = new Set<DeckCardType>(["intent_proposal", "relay_task"]);

export function isActionableDeckCard(option: CompanyOption): boolean {
  if (!ACTIONABLE_CARD_TYPES.has(option.cardType)) return false;
  if (option.id.startsWith("play:") || option.id.startsWith("route:")) return false;
  if (option.title.toLowerCase().includes("nay ·")) return false;
  if (option.id.toLowerCase().includes("decision-outcome")) return false;
  return true;
}

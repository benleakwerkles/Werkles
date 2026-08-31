export type MemberWorkSurface = "workshop" | "match_deck" | "formation";

export type MemberWorkLocation = Readonly<{
  id: "workshop" | "match_deck" | "possible_werkle" | "existing_werkle";
  stage: "Your Workshop" | "Match Deck" | "Possible Werkle" | "Existing Werkle on this device";
  next: string;
  action: "Improve My Workshop" | "Compare Matches" | "Continue This Possible Werkle" | "Review the Saved Brief";
  href: string;
}>;

export const WERKLE_OPERATING_BRIEF_CHANGE_EVENT = "werkles:operating-brief-change";

const LOCATIONS = Object.freeze({
  workshop: Object.freeze({
    id: "workshop",
    stage: "Your Workshop",
    next: "Improve the private plan here, or compare people when another person is part of the answer.",
    action: "Improve My Workshop",
    href: "#current-workshop"
  }),
  match_deck: Object.freeze({
    id: "match_deck",
    stage: "Match Deck",
    next: "Compare the reasons and unknowns, then deliberately open one possible Werkle.",
    action: "Compare Matches",
    href: "#match-deck-candidates"
  }),
  possible_werkle: Object.freeze({
    id: "possible_werkle",
    stage: "Possible Werkle",
    next: "Compare both Workshops and settle one topic before making a larger promise.",
    action: "Continue This Possible Werkle",
    href: "#formation-table"
  }),
  existing_werkle: Object.freeze({
    id: "existing_werkle",
    stage: "Existing Werkle on this device",
    next: "Review the saved Operating Brief against the current accepted wording before changing the plan.",
    action: "Review the Saved Brief",
    href: "#formation-table"
  })
} as const);

export function memberWorkLocation(
  surface: MemberWorkSurface,
  hasCurrentOperatingBrief = false
): MemberWorkLocation {
  if (surface === "formation") return hasCurrentOperatingBrief ? LOCATIONS.existing_werkle : LOCATIONS.possible_werkle;
  return LOCATIONS[surface];
}


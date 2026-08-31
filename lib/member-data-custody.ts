export const MEMBER_DATA_CUSTODY_STATES = [
  "account_session",
  "account_record",
  "browser_only",
  "not_connected",
  "status_only"
] as const;

export type MemberDataCustodyState = (typeof MEMBER_DATA_CUSTODY_STATES)[number];

export type MemberDataCustodyItem = Readonly<{
  id: "account" | "profile" | "answers" | "workshop_files" | "check_results";
  title: string;
  state: MemberDataCustodyState;
  stateLabel: string;
  storedWhere: string;
  boundary: string;
  href: string;
  linkLabel: string;
}>;

function item(value: MemberDataCustodyItem): MemberDataCustodyItem {
  return Object.freeze(value);
}

export const MEMBER_DATA_CUSTODY: readonly MemberDataCustodyItem[] = Object.freeze([
  item({
    id: "account",
    title: "Your sign-in",
    state: "account_session",
    stateLabel: "Account path present; checked when opened",
    storedWhere: "Supabase Auth is the planned account session authority.",
    boundary: "A sign-in identifies an account session. It is not an identity, skill, or trust check.",
    href: "/login",
    linkLabel: "Sign-in page"
  }),
  item({
    id: "profile",
    title: "Your profile",
    state: "account_record",
    stateLabel: "Account save path present; availability checked here",
    storedWhere: "A signed-in profile is written to that member's Supabase profile row.",
    boundary: "A saved profile contains what you entered. It does not make those statements verified.",
    href: "/dashboard/profile#profile-form",
    linkLabel: "Profile form"
  }),
  item({
    id: "answers",
    title: "Your Werkles answers",
    state: "browser_only",
    stateLabel: "This browser only",
    storedWhere: "The current answers and recommendation readout stay with this local browser session.",
    boundary: "They do not travel with your account to another browser or machine yet.",
    href: "/bellows/intake",
    linkLabel: "Review my answers"
  }),
  item({
    id: "workshop_files",
    title: "Workshop files",
    state: "not_connected",
    stateLabel: "Not connected",
    storedWhere: "No member file bucket or upload path is connected today.",
    boundary: "The Workshop can show planned file space, but it cannot save or share files yet.",
    href: "/dashboard/blueprints",
    linkLabel: "Workshop"
  }),
  item({
    id: "check_results",
    title: "Check results",
    state: "status_only",
    stateLabel: "Status fields only; receipt storage not built",
    storedWhere: "A completed provider path may update a narrow profile status after its trusted callback.",
    boundary: "Werkles does not yet have the full receipt, expiry, dispute, revocation, and sharing record.",
    href: "/dashboard/crucible",
    linkLabel: "See optional checks"
  })
]);

if (
  MEMBER_DATA_CUSTODY.length !== 5 ||
  new Set(MEMBER_DATA_CUSTODY.map((entry) => entry.id)).size !== MEMBER_DATA_CUSTODY.length
) {
  throw new Error("Member data custody map must cover each record type exactly once.");
}


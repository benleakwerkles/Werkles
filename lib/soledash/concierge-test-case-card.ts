/** SoleDash Concierge Test Case #0 — display-only. Not the matching engine. */

export type ConciergeTestCaseStatus = {
  id: string;
  text: string;
};

export type ConciergeTestCaseCard = {
  version: "0";
  title: "Concierge Test Case #0";
  input: string;
  statuses: ConciergeTestCaseStatus[];
};

export const CONCIERGE_TEST_CASE_CARD: ConciergeTestCaseCard = {
  version: "0",
  title: "Concierge Test Case #0",
  input: "I think I need a business partner.",
  statuses: [
    { id: "speaker-pending", text: "Speaker diagnosis pending" },
    {
      id: "matching-blocked",
      text: "Matching blocked until need class is confirmed"
    },
    {
      id: "human-gate",
      text: "Human Gate: Ben review required before any partner outreach"
    }
  ]
};

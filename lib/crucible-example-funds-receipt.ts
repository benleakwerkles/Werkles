export type ExampleFundsReceiptField = {
  key: "claim" | "reviewed_scope" | "observed_date" | "expiry" | "example_result" | "limitations";
  label: string;
  value: string;
};

export type ExampleFundsReceipt = {
  title: string;
  disclaimer: string;
  fields: readonly ExampleFundsReceiptField[];
};

export const exampleFundsReceipt: ExampleFundsReceipt = {
  title: "Fictional private funds-check receipt",
  disclaimer:
    "Private one-to-one example only. Both people would have to consent before an amount is checked or shared. Not this member. Not live. No provider call was made. Werkles does not currently produce this receipt.",
  fields: [
    { key: "claim", label: "Claim", value: "At least $50,000 in available liquidity" },
    {
      key: "reviewed_scope",
      label: "Reviewed scope",
      value: "Accounts selected by the fictional member for this example"
    },
    { key: "observed_date", label: "Observed", value: "July 1, 2026" },
    { key: "expiry", label: "Expires", value: "July 31, 2026" },
    { key: "example_result", label: "Private result", value: "Requested minimum confirmed (fictional)" },
    {
      key: "limitations",
      label: "Limitations",
      value: "Dated snapshot; not net worth, creditworthiness, source of funds, or future capacity"
    }
  ]
};

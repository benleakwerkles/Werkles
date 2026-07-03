export type ProviderGateId =
  | "auth"
  | "stripe"
  | "supabase"
  | "crucible-providers"
  | "fcra-counsel"
  | "deploy"
  | "push";

export type ProviderGateStatus = "local_ready" | "human_gate";

export interface ProviderReadinessItem {
  id: ProviderGateId;
  label: string;
  status: ProviderGateStatus;
  localReady: string[];
  blockedBy: string[];
  nextHumanAction: string;
}

export const providerReadiness: ProviderReadinessItem[] = [
  {
    id: "auth",
    label: "Login / Auth",
    status: "human_gate",
    localReady: [
      "Preview login route exists.",
      "Local API demo session support exists.",
      "No OAuth provider or account settings are touched.",
    ],
    blockedBy: ["OAuth/account setup", "private secret entry", "production session policy"],
    nextHumanAction: "Choose and approve auth provider/account settings before live login.",
  },
  {
    id: "stripe",
    label: "Stripe / Billing",
    status: "human_gate",
    localReady: [
      "Foundry Dues pricing anchors are displayed.",
      "Checkout and portal actions are disabled with explanation.",
      "Stripe manifest keeps live actions off.",
    ],
    blockedBy: ["billing account approval", "Stripe products/prices", "secret keys", "webhooks"],
    nextHumanAction: "Approve billing entity and Stripe setup before enabling checkout.",
  },
  {
    id: "supabase",
    label: "Supabase / Data",
    status: "human_gate",
    localReady: [
      "Local JSON-backed API exists for prototype state.",
      "No schema, SQL, migrations, RLS, or production data mutations are applied.",
    ],
    blockedBy: ["schema approval", "RLS policy approval", "service credentials"],
    nextHumanAction: "Approve schema/RLS plan before moving preview state to Supabase.",
  },
  {
    id: "crucible-providers",
    label: "Crucible Providers",
    status: "human_gate",
    localReady: [
      "Mock Crucible state definitions render locally.",
      "Provider-pending states are disabled and explain the blocker.",
    ],
    blockedBy: ["provider account selection", "provider account creation", "provider credentials"],
    nextHumanAction: "Approve provider choice and account ownership before live checks.",
  },
  {
    id: "fcra-counsel",
    label: "FCRA / Background Review",
    status: "human_gate",
    localReady: [
      "Background-check surfaces are placeholder-only.",
      "Copy does not imply clearance, credit, trust, or employment eligibility.",
    ],
    blockedBy: ["legal/compliance review", "final approved copy"],
    nextHumanAction: "Get counsel/compliance approval before any live background-check flow.",
  },
  {
    id: "deploy",
    label: "Deploy / Public Preview",
    status: "human_gate",
    localReady: ["Local typecheck and build pass.", "Preview can run with `npm run dev`."],
    blockedBy: ["deploy approval", "public exposure approval"],
    nextHumanAction: "Approve target host and deploy action when ready.",
  },
  {
    id: "push",
    label: "Git Push / Merge",
    status: "human_gate",
    localReady: ["Local repo is initialized on `ben-sandbox`."],
    blockedBy: ["remote selection", "push approval", "merge approval"],
    nextHumanAction: "Approve remote push or merge only when review is ready.",
  },
];

export function humanGateItems(): ProviderReadinessItem[] {
  return providerReadiness.filter((item) => item.status === "human_gate");
}

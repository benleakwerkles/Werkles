import type { MockTestRoute } from "@/protocol/index";

export type MockTestRouteConfig = {
  action: string;
  owner: string | null;
  label: string;
  would_happen_live: string;
  why_simulated: string;
};

export const MOCK_TEST_ROUTES: Record<MockTestRoute, MockTestRouteConfig> = {
  continue: {
    action: "yea",
    owner: null,
    label: "Continue Current Frontier",
    would_happen_live: "Dink dispatches YEA to cousin lane and writes action + receipt files.",
    why_simulated: "Cousin auto-dispatch not wired — UI proves click → lifecycle → receipt."
  },
  switch_frontier: {
    action: "switch_frontier",
    owner: "Operator",
    label: "Switch Frontier",
    would_happen_live: "Queue override POST updates frontier rank in DECISION_SURFACE.json.",
    why_simulated: "Override persists locally — Dink owns live queue brain refresh."
  },
  needs_research: {
    action: "needs_research",
    owner: "Thufir",
    label: "Needs Research",
    would_happen_live: "Route to Thufir research lane with handoff receipt.",
    why_simulated: "Thufir cousin transport mock until Dink wires live routing."
  },
  kill_test: {
    action: "kill_test",
    owner: "Bean",
    label: "Kill Test",
    would_happen_live: "Route to Bean kill-test lane with verdict receipt.",
    why_simulated: "Bean lane mock — no external kill-test command executed."
  },
  human_reality: {
    action: "human_reality",
    owner: "Ender",
    label: "Human Reality",
    would_happen_live: "Route to Ender human-reality audit with gate classification.",
    why_simulated: "Ender audit mock — operator gate not auto-approved."
  },
  hands_gate: {
    action: "hands_gate",
    owner: "Operator",
    label: "Hands Gate",
    would_happen_live: "Surface human gate detail and pause until Ben approves true gate.",
    why_simulated: "Gate scroll + receipt only — no gate approval auto-submitted."
  },
  send_to_petra: {
    action: "petra_transport",
    owner: "Petra",
    label: "Send to Petra",
    would_happen_live: "Petra transport delivers raw_text to ChatGPT tab on Betsy.",
    why_simulated: "Transport envelope simulated — no browser tab injection in test mode."
  },
  test_spanzee: {
    action: "spanzee_node",
    owner: "Spanzee",
    label: "Test Spanzee",
    would_happen_live: "Spanzee node status poll + cousin lane receipt.",
    why_simulated: "Spanzee fleet slot MOCK — node instrumentation not live yet."
  }
};

export const MOCK_TEST_ROUTE_LIST = Object.entries(MOCK_TEST_ROUTES).map(([id, cfg]) => ({
  id: id as MockTestRoute,
  ...cfg
}));

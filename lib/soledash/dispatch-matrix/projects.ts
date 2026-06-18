import type { DispatchProjectDef } from "./types";

export const DISPATCH_PROJECTS: DispatchProjectDef[] = [
  {
    id: "mobile_sd_field_command",
    project: "Mobile SD Field Command",
    benefit: "Operator can fire relay cards, hands, and receipts from phone away from desk.",
    cost: "Maker UI pass + Dink receipt transport hardening.",
    required_aeyes: ["MAKER", "DINK"],
    branch_status: "GO",
    branch_label: "snapshot/sally-good-werkles-2026-06-12 · mobile pass landed"
  },
  {
    id: "focus_thief_hunter",
    project: "Focus Thief Hunter",
    benefit: "One-tap focus-theft receipts + Dink outbox for popup kill policy.",
    cost: "Dink policy loop — mute/kill rules per repeat offender.",
    required_aeyes: ["DINK"],
    branch_status: "GO",
    branch_label: "focus-theft card live · receipts writing"
  },
  {
    id: "nugget_of_wisdom_crawler",
    project: "Nugget of Wisdom Crawler",
    benefit: "Harvest wisdom nuggets across cousins with honest crawl receipts.",
    cost: "Skybro lane + Bean trust audit + Dink persistence — three-lane coordination.",
    required_aeyes: ["DINK", "SKYBRO", "BEAN"],
    branch_status: "CONDITIONAL GO",
    branch_label: "awaiting Skybro crawl route + Bean audit gate"
  },
  {
    id: "werkles_construction_arena",
    project: "Werkles Construction Arena",
    benefit: "Parallel build arena for Petra-scoped construction experiments.",
    cost: "High cousin surface area — Petra + Skybro + Bean until parked.",
    required_aeyes: ["PETRA", "SKYBRO", "BEAN"],
    branch_status: "PARKED",
    branch_label: "parked — arena not active frontier"
  },
  {
    id: "lightship_starship_naming",
    project: "LightShip / Starship Naming",
    benefit: "Naming clarity across LightTrip / Starship Explode surfaces.",
    cost: "Low — documentation only when unparked.",
    required_aeyes: [],
    branch_status: "PARKED",
    branch_label: "parked — no Aeyes required"
  }
];

export function projectById(id: string): DispatchProjectDef | undefined {
  return DISPATCH_PROJECTS.find((p) => p.id === id);
}

import type { ProfileCardModel } from "./types";

/** Static demo models for Ender Tests 1–3 — not live member data */
export const profileCardShowcase: ProfileCardModel[] = [
  {
    state: "undeclared",
    name: "Jordan Lee",
    location: "Columbus, OH",
    currentTitle: "Project coordinator",
    formationStatus: "Lane undeclared",
    availability: "Not in formation"
  },
  {
    state: "lane-chosen",
    name: "Jordan Lee",
    location: "Columbus, OH",
    currentTitle: "Project coordinator",
    lane: "operator",
    roleLabel: "Operator",
    formationStatus: "Lane chosen · formation open",
    skills: ["Scheduling", "Vendor ops", "P&L review"],
    availability: "Open to formation",
    projectState: "No active Werkle"
  },
  {
    state: "in-formation",
    name: "Jordan Lee",
    location: "Columbus, OH",
    lane: "operator",
    roleLabel: "Operator",
    formationStatus: "In formation · 3 of 5 roles filled",
    skills: ["Scheduling", "Vendor ops", "P&L review"],
    availability: "Formation in progress",
    projectState: "Main Street acquisition brief"
  },
  {
    state: "formed",
    name: "Jordan Lee",
    location: "Columbus, OH",
    lane: "operator",
    roleLabel: "Operator",
    formationStatus: "Werkle formed",
    skills: ["Scheduling", "Vendor ops", "P&L review"],
    availability: "Active Werkle",
    projectState: "Neighborhood service roll-up",
    werkileLabel: "Werkle · Riverside Ops",
    formedOn: "2026-03-12"
  }
];

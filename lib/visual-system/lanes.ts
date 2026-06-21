import type { LaneDefinition, LaneId } from "./types";

/** Six lanes — Ender visual lock v1. Iron Palette accents only; no token value changes. */
export const laneDefinitions: LaneDefinition[] = [
  {
    id: "spark",
    title: "Spark",
    definition: "The strange opening worth testing before anyone calls it real.",
    attributes: ["Half-lit opportunity", "Needs steel around it", "Tests before it scales"],
    accentVar: "--werkles-violet-bright"
  },
  {
    id: "operator",
    title: "Operator",
    definition: "The dynamo that keeps the floor moving when promises meet Tuesday.",
    attributes: ["Schedules and licenses", "Calm brutality of delivery", "P&L literacy"],
    accentVar: "--werkles-teal-bright"
  },
  {
    id: "backer",
    title: "Backer",
    definition: "Fuel without a throne — runway and support without pretending money is the whole machine.",
    attributes: ["Capital discipline", "Red-flag literacy", "Questions before checks"],
    accentVar: "--werkles-copper-light"
  },
  {
    id: "connector",
    title: "Connector",
    definition: "The room needs a pulse — customers, vendors, hires, and introductions that cold-start an engine.",
    attributes: ["Social voltage", "Introduction hygiene", "Room reading"],
    accentVar: "--werkles-forge-orange"
  },
  {
    id: "builder",
    title: "Builder",
    definition: "The hands that make the thing real — craft, crew sense, and field judgment.",
    attributes: ["Customer memory", "Repeatable craft", "Grit that survives contact"],
    accentVar: "--werkles-owl-eye-green"
  },
  {
    id: "worker",
    title: "Worker",
    definition: "Skilled execution on the bench — trade discipline, standards, and reliable output.",
    attributes: ["Shows up on schedule", "Trade standards", "Execution without theater"],
    accentVar: "--werkles-blueprint-tan"
  }
];

export const laneById: Record<LaneId, LaneDefinition> = Object.fromEntries(
  laneDefinitions.map((lane) => [lane.id, lane])
) as Record<LaneId, LaneDefinition>;

export const laneDisplayOrder: LaneId[] = laneDefinitions.map((l) => l.id);

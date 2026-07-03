import type { PearlShelfStore } from "./types";

export function seedPearlShelf(): PearlShelfStore {
  const now = new Date().toISOString();
  return {
    version: 0,
    pearls: [
      {
        pearl_id: "pearl_localhost_alive_v0",
        title: "Localhost alive pearl",
        status: "NEW",
        origin: "Wonka Den",
        source: "hostname proof crawl",
        core_principle: "Ben must never wonder if localhost is alive.",
        linked_draft_task: null,
        created_at: now,
        updated_at: now
      },
      {
        pearl_id: "pearl_fleet_readback_v0",
        title: "Fleet readback pearl",
        status: "REVIEWED",
        origin: "Machine Wall",
        source: "FLEET_STATE.json",
        core_principle: "Fleet truth lives on the wall, not in memory.",
        linked_draft_task: null,
        created_at: now,
        updated_at: now
      },
      {
        pearl_id: "pearl_swatter_receipt_v0",
        title: "Swatter receipt pearl",
        status: "PROMOTED",
        origin: "Permission Swatter",
        source: "approval-swatter-alpha/receipts",
        core_principle: "Silent approvals still leave a receipt.",
        linked_draft_task: {
          task_id: "draft_pearl_swatter_receipt_v0",
          title: "Draft: Swatter receipt pearl",
          summary: "Wire promoted swatter pearl into draft task queue."
        },
        created_at: now,
        updated_at: now
      },
      {
        pearl_id: "pearl_receipt_graph_v0",
        title: "Receipt graph pearl",
        status: "ARCHIVED",
        origin: "Receipt Wall",
        source: "canonical proof chain",
        core_principle: "Every proof links backward to intent.",
        linked_draft_task: null,
        created_at: now,
        updated_at: now
      },
      {
        pearl_id: "pearl_duplicate_draft_v0",
        title: "Duplicate draft guard pearl",
        status: "KILLED",
        origin: "Crawler",
        source: "nugget-of-wisdom crawl",
        core_principle: "Promoted pearls must not spawn duplicate draft tasks.",
        linked_draft_task: null,
        created_at: now,
        updated_at: now
      }
    ]
  };
}

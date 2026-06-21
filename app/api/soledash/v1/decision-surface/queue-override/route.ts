import { NextResponse } from "next/server";

import { loadDecisionSurfacePayload } from "@/lib/soledash/decision-surface/load-contract";
import { applyQueueOverrideAction } from "@/lib/soledash/decision-surface/queue-override-mock";
import type { FrontierOverride, FrontierQueueItem, QueueOverrideAction } from "@/protocol/index";

export const dynamic = "force-dynamic";

type Body = {
  action?: QueueOverrideAction;
  proposal_id?: string;
  queue?: FrontierQueueItem[];
  frontier_override?: FrontierOverride;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const action = body.action;
    const proposal_id = body.proposal_id?.trim();

    if (!action || !proposal_id) {
      return NextResponse.json(
        { ok: false, mock: true, error: "action and proposal_id required." },
        { status: 400 }
      );
    }

    const { payload } = loadDecisionSurfacePayload();
    const queue = body.queue?.length ? body.queue : (payload.frontier_queue ?? []);
    const frontier_override = body.frontier_override ?? payload.frontier_override;

    if (!frontier_override || queue.length === 0) {
      return NextResponse.json(
        { ok: false, mock: true, error: "Queue override not configured in payload." },
        { status: 400 }
      );
    }

    const result = applyQueueOverrideAction(queue, frontier_override, action, proposal_id);

    return NextResponse.json({
      ok: true,
      mock: true,
      message: result.message,
      queue: result.queue,
      frontier_override: result.frontier_override,
      active_proposal_id: result.active_proposal_id
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, mock: true, error: err instanceof Error ? err.message : "Queue override failed." },
      { status: 500 }
    );
  }
}

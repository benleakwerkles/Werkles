import { NextResponse } from "next/server";

import { actOnIntentProposal } from "@/lib/soledash/intent-router/router";
import type { IntentRouteAction } from "@/lib/soledash/intent-router/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Body = {
  proposal_id?: string;
  action?: IntentRouteAction;
  edited_intent?: string;
};

const ACTIONS = new Set<IntentRouteAction>([
  "approve",
  "edit_route",
  "reject",
  "needs_research",
  "kill_test"
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const proposalId = body.proposal_id?.trim() ?? "";
    const action = body.action;

    if (!proposalId) {
      return NextResponse.json({ ok: false, error: "proposal_id required" }, { status: 400 });
    }
    if (!action || !ACTIONS.has(action)) {
      return NextResponse.json({ ok: false, error: "valid action required" }, { status: 400 });
    }

    const result = await actOnIntentProposal({
      proposalId,
      action,
      editedIntent: body.edited_intent
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Intent action failed" },
      { status: 500 }
    );
  }
}

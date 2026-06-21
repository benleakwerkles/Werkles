import { NextResponse } from "next/server";

import { mockDecisionAction } from "@/lib/soledash/decision-surface/mock-actions";

export const dynamic = "force-dynamic";

type ActionBody = {
  proposal_id?: string;
  action?: string;
  action_id?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ActionBody;
    const proposal_id = body.proposal_id?.trim();
    const action = body.action?.trim();
    const action_id = body.action_id?.trim() || null;

    if (!proposal_id || !action) {
      return NextResponse.json(
        { ok: false, mock: true, error: "proposal_id and action required." },
        { status: 400 }
      );
    }

    return NextResponse.json(mockDecisionAction(proposal_id, action, action_id));
  } catch (err) {
    return NextResponse.json(
      { ok: false, mock: true, error: err instanceof Error ? err.message : "Mock action failed." },
      { status: 500 }
    );
  }
}

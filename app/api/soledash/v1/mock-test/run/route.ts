import { NextResponse } from "next/server";

import type { MockTestFailureMode, MockTestRoute } from "@/protocol/index";
import { runMockTest } from "@/lib/soledash/mock-test/run-mock-test";

export const dynamic = "force-dynamic";

type MockTestBody = {
  route?: MockTestRoute;
  proposal_id?: string;
  failure_mode?: MockTestFailureMode;
  action_code?: string | null;
  frontier_title?: string | null;
  action_override?: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MockTestBody;
    const route = body.route;
    const proposal_id = body.proposal_id?.trim();

    if (!route || !proposal_id) {
      return NextResponse.json(
        { ok: false, mock_test: true, error: "route and proposal_id required." },
        { status: 400 }
      );
    }

    const result = runMockTest({
      route,
      proposal_id,
      failure_mode: body.failure_mode ?? "success",
      action_code: body.action_code ?? null,
      frontier_title: body.frontier_title ?? null,
      action_override: body.action_override ?? null
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        mock_test: true,
        error: err instanceof Error ? err.message : "Mock test run failed."
      },
      { status: 500 }
    );
  }
}

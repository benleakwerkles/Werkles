import { NextResponse } from "next/server";

import { applyPearlAction, pearlActionsFor } from "@/lib/pearls/v0/actions";
import { pearlStorePath, persistPearlShelf, readPearlShelf } from "@/lib/pearls/v0/storage";
import type { PearlAction } from "@/lib/pearls/v0/types";

export const dynamic = "force-dynamic";

const ACTIONS = new Set<PearlAction>(["review", "promote", "archive", "kill"]);

export async function GET() {
  try {
    const shelf = readPearlShelf();
    return NextResponse.json({
      ok: true,
      shelf,
      path: pearlStorePath(),
      pearls: shelf.pearls.map((pearl) => ({
        ...pearl,
        actions: pearlActionsFor(pearl.status)
      }))
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Pearl shelf load failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pearl_id?: string; action?: PearlAction };
    const pearlId = body.pearl_id?.trim();
    const action = body.action;

    if (!pearlId) {
      return NextResponse.json({ ok: false, error: "pearl_id required" }, { status: 400 });
    }
    if (!action || !ACTIONS.has(action)) {
      return NextResponse.json(
        { ok: false, error: "action must be review, promote, archive, or kill" },
        { status: 400 }
      );
    }

    const store = readPearlShelf();
    const result = applyPearlAction(store, pearlId, action);
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          duplicate_draft: result.duplicate_draft,
          pearl: result.pearl
        },
        { status: result.duplicate_draft ? 409 : 422 }
      );
    }

    persistPearlShelf(store);
    const pearl = result.pearl!;
    return NextResponse.json({
      ok: true,
      pearl: { ...pearl, actions: pearlActionsFor(pearl.status) },
      path: pearlStorePath()
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Pearl action failed" },
      { status: 500 }
    );
  }
}

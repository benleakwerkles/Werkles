import { NextResponse } from "next/server";

import { dispatchBuild } from "@/lib/soledash/command-surface/dispatch";
import type { CousinId } from "@/lib/soledash/command-surface/types";
import { readNextStepOverride, writeNextStepOverride } from "@/lib/soledash/next-step/storage";

export const dynamic = "force-dynamic";

const DISPATCH_OWNERS = new Set<CousinId>(["MAKER", "DINK", "ENDER", "BEAN", "COMPUTER", "SKYBRO", "PETRA"]);

function cousinForOwner(owner: string): CousinId | null {
  const u = owner.toUpperCase();
  if (u === "BEN") return "MAKER";
  if (DISPATCH_OWNERS.has(u as CousinId)) return u as CousinId;
  return null;
}

export async function GET() {
  const override = readNextStepOverride();
  return NextResponse.json({
    ok: true,
    override,
    path: "foreman/soledash/NEXT_STEP_OVERRIDE.json"
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      owner?: string;
      machine?: string;
      note?: string | null;
      dispatch?: boolean;
    };

    const override = writeNextStepOverride({
      owner: body.owner ?? "DINK",
      machine: body.machine ?? "Betsy",
      note: body.note
    });

    let dispatchResult = null;
    if (body.dispatch) {
      const cousin = cousinForOwner(override.owner);
      if (!cousin) {
        return NextResponse.json(
          { ok: false, error: `Cannot dispatch to owner ${override.owner}` },
          { status: 422 }
        );
      }
      const missionText = [
        `[Next Step route correction]`,
        `Owner: ${override.owner} @ ${override.machine}`,
        override.note ? `Note: ${override.note}` : null
      ]
        .filter(Boolean)
        .join("\n");

      dispatchResult = await dispatchBuild({
        missionText,
        title: `Next Step → ${override.owner} @ ${override.machine}`,
        cousin,
        decisionNote: "Operator corrected next step route from SoleDash"
      });
    }

    return NextResponse.json({
      ok: true,
      override,
      path: "foreman/soledash/NEXT_STEP_OVERRIDE.json",
      dispatch: dispatchResult
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Next step save failed" },
      { status: 400 }
    );
  }
}

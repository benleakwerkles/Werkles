import { NextResponse } from "next/server";

import { dispatchBuild } from "@/lib/soledash/command-surface/dispatch";
import type { CousinId } from "@/lib/soledash/command-surface/types";

export const dynamic = "force-dynamic";

const COUSIN_IDS = new Set<CousinId>([
  "MAKER",
  "DINK",
  "PETRA",
  "ENDER",
  "SKYBRO",
  "BEAN",
  "COMPUTER"
]);

/** Operator bar labels → dispatch cousin ids. Thufir maps to COMPUTER. */
const ALIAS: Record<string, CousinId> = {
  MAKER: "MAKER",
  DINK: "DINK",
  ENDER: "ENDER",
  BEAN: "BEAN",
  SKYBRO: "SKYBRO",
  THUFIR: "COMPUTER",
  COMPUTER: "COMPUTER"
};

type Body = {
  text?: string;
  cousin?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const text = body.text?.trim() ?? "";
    const rawCousin = body.cousin?.trim().toUpperCase() ?? "";

    if (!text) {
      return NextResponse.json({ ok: false, error: "text required." }, { status: 400 });
    }

    const cousin = ALIAS[rawCousin];
    if (!cousin || !COUSIN_IDS.has(cousin)) {
      return NextResponse.json({ ok: false, error: `Unknown cousin: ${rawCousin}` }, { status: 400 });
    }

    const result = await dispatchBuild({
      missionText: text,
      title: text.split("\n")[0]?.slice(0, 80) ?? "Operator packet",
      cousin
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Cousin dispatch failed." },
      { status: 500 }
    );
  }
}

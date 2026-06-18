import { NextResponse } from "next/server";

import {
  loadReceiptGraph,
  lookupReceiptChain,
  lookupReceiptDependencies,
  lookupReceiptGraph
} from "@/lib/soledash/receipt-graph/engine";

export const dynamic = "force-dynamic";

type LookupMode = "graph" | "chain" | "dependencies";

function modeFrom(value: string | null): LookupMode {
  if (value === "graph" || value === "dependencies") return value;
  return "chain";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const receiptId = searchParams.get("receipt_id")?.trim() ?? searchParams.get("id")?.trim() ?? "";
  const mode = modeFrom(searchParams.get("mode"));

  try {
    if (!receiptId) {
      const graph = loadReceiptGraph();
      return NextResponse.json({
        ok: true,
        mode: "index",
        generated_at: graph.generatedAt,
        receipt_count: graph.nodes.length,
        origin_count: graph.originNodes.length,
        edge_count: graph.edges.length,
        message: "Pass receipt_id plus mode=graph, mode=chain, or mode=dependencies."
      });
    }

    if (mode === "graph") {
      return NextResponse.json({ ok: true, mode, result: lookupReceiptGraph(receiptId) });
    }

    if (mode === "dependencies") {
      return NextResponse.json({ ok: true, mode, result: lookupReceiptDependencies(receiptId) });
    }

    return NextResponse.json({ ok: true, mode, result: lookupReceiptChain(receiptId) });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Receipt graph lookup failed" },
      { status: 500 }
    );
  }
}

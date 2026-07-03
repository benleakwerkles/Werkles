import { NextResponse } from "next/server";

import {
  buildSelfKnowledgePanel,
  isSelfKnowledgeQuestionId
} from "@/lib/soledash/self-knowledge/build-answers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const question = new URL(request.url).searchParams.get("question")?.trim() ?? "";
    if (question && !isSelfKnowledgeQuestionId(question)) {
      return NextResponse.json(
        { ok: false, error: `Unknown question: ${question}` },
        { status: 400 }
      );
    }

    const panel = buildSelfKnowledgePanel(
      question && isSelfKnowledgeQuestionId(question) ? question : undefined
    );
    return NextResponse.json({ ok: true, panel });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Self-knowledge load failed" },
      { status: 500 }
    );
  }
}

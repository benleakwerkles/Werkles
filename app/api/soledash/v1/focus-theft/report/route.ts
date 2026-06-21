import { NextResponse } from "next/server";

import { submitFocusTheftPreset, submitFocusTheftReport } from "@/lib/soledash/focus-theft/submit-report";
import type { FocusTheftSeverity } from "@/lib/soledash/focus-theft/types";

export const dynamic = "force-dynamic";

type Body = {
  preset_id?: string;
  source_app?: string;
  notification_text?: string;
  what_ben_was_doing?: string;
  severity?: FocusTheftSeverity;
  repeat_offender?: boolean;
};

const SEVERITIES: FocusTheftSeverity[] = ["low", "medium", "high", "critical"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;

    if (body.preset_id?.trim()) {
      const receipt = submitFocusTheftPreset(body.preset_id.trim(), Boolean(body.repeat_offender));
      return NextResponse.json({ ok: true, receipt });
    }

    const sourceApp = body.source_app?.trim() ?? "";
    const notificationText = body.notification_text?.trim() ?? "";
    if (!sourceApp || !notificationText) {
      return NextResponse.json(
        { ok: false, error: "source_app and notification_text required" },
        { status: 400 }
      );
    }

    const severity = body.severity ?? "medium";
    if (!SEVERITIES.includes(severity)) {
      return NextResponse.json({ ok: false, error: "invalid severity" }, { status: 400 });
    }

    const receipt = submitFocusTheftReport({
      source_app: sourceApp,
      notification_text: notificationText,
      what_ben_was_doing: body.what_ben_was_doing?.trim() ?? "",
      severity,
      repeat_offender: Boolean(body.repeat_offender)
    });

    return NextResponse.json({ ok: true, receipt });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Focus theft report failed" },
      { status: 500 }
    );
  }
}

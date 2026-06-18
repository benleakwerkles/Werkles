import { NextResponse } from "next/server";

import {
  keepAskingPermissionFly,
  loadPermissionFlyPanel,
  preApprovePermissionFly,
  reportPermissionFlyManual,
  reportPermissionFlyPreset,
  sendPermissionFlyToDink
} from "@/lib/soledash/permission-fly/actions";
import type {
  PermissionFlyClassification,
  PermissionFlySeverity
} from "@/lib/soledash/permission-fly/types";

export const dynamic = "force-dynamic";

type Body = {
  action: "report" | "send_to_dink" | "pre_approve" | "keep_asking";
  preset_id?: string;
  fly_id?: string;
  source?: string;
  severity?: PermissionFlySeverity;
  classification?: PermissionFlyClassification;
  detail?: string;
};

const SEVERITIES: PermissionFlySeverity[] = ["low", "medium", "high", "critical"];
const CLASSIFICATIONS: PermissionFlyClassification[] = [
  "unclassified",
  "human_gate",
  "mechanical",
  "pre_approved",
  "keep_asking"
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const flyId = body.fly_id?.trim() || undefined;

    switch (body.action) {
      case "report": {
        if (body.preset_id?.trim()) {
          const result = reportPermissionFlyPreset(body.preset_id.trim());
          return NextResponse.json({ ok: true, ...result, panel: loadPermissionFlyPanel() });
        }
        const source = body.source?.trim() ?? "";
        if (!source) {
          return NextResponse.json({ ok: false, error: "preset_id or source required" }, { status: 400 });
        }
        const severity = body.severity ?? "medium";
        const classification = body.classification ?? "human_gate";
        if (!SEVERITIES.includes(severity)) {
          return NextResponse.json({ ok: false, error: "invalid severity" }, { status: 400 });
        }
        if (!CLASSIFICATIONS.includes(classification)) {
          return NextResponse.json({ ok: false, error: "invalid classification" }, { status: 400 });
        }
        const result = reportPermissionFlyManual({
          source,
          severity,
          classification,
          detail: body.detail
        });
        return NextResponse.json({ ok: true, ...result, panel: loadPermissionFlyPanel() });
      }
      case "send_to_dink": {
        const result = sendPermissionFlyToDink(flyId);
        return NextResponse.json({ ok: true, ...result, panel: loadPermissionFlyPanel() });
      }
      case "pre_approve": {
        const result = preApprovePermissionFly(flyId);
        return NextResponse.json({ ok: true, ...result, panel: loadPermissionFlyPanel() });
      }
      case "keep_asking": {
        const result = keepAskingPermissionFly(flyId);
        return NextResponse.json({ ok: true, ...result, panel: loadPermissionFlyPanel() });
      }
      default:
        return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Permission fly action failed" },
      { status: 500 }
    );
  }
}

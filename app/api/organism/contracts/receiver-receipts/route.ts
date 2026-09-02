import { NextResponse } from "next/server";

import { writeOrganismReceiptRecord, type OrganismWriteResult } from "@/lib/organism/contracts/storage";
import type { OrganismReceipt } from "@/lib/organism/contracts/receipt";

export const dynamic = "force-dynamic";

type ReceiverReceiptBody = {
  receipt?: unknown;
  detected_by?: string;
};

type ContractWritePointer = {
  ok: boolean;
  artifact_path: string;
  event_path: string;
  sha256?: string;
  code?: "SCHEMA_INVALID";
  issues?: Array<{ path: string; message: string }>;
};

function summarizeReceiptWrite(result: OrganismWriteResult<OrganismReceipt>): ContractWritePointer {
  if (result.ok) {
    return {
      ok: true,
      artifact_path: result.path,
      event_path: result.event_path,
      sha256: result.sha256,
    };
  }

  return {
    ok: false,
    artifact_path: result.receipt_path,
    event_path: result.event_path,
    code: result.code,
    issues: result.issues,
  };
}

function detectedBy(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "organism-receiver-receipt-api";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReceiverReceiptBody;
    const receipt = body.receipt ?? body;
    const write = await writeOrganismReceiptRecord(receipt, { detected_by: detectedBy(body.detected_by) });
    const contractWrite = summarizeReceiptWrite(write);

    if (!write.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "SCHEMA_INVALID",
          contract_write: contractWrite,
          issues: write.issues,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      ok: true,
      receipt_id: write.value.receipt_id,
      packet_id: write.value.packet_id,
      receipt_status: write.value.status,
      contract_write: contractWrite,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "RECEIVER_RECEIPT_INTAKE_FAILED" },
      { status: 500 },
    );
  }
}

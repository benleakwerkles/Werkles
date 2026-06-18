import { NextResponse } from "next/server";



import {

  countUniqueApprovedCards,

  defaultDrawerApprover,

  drawerStorePath,

  readDrawerStore,

  writeDrawerDisposition

} from "@/lib/soledash/receipt-drawer/storage";

import type { DrawerAction } from "@/lib/soledash/receipt-drawer/types";



export const dynamic = "force-dynamic";



const ACTIONS = new Set<DrawerAction>(["approve", "reject", "follow_up"]);



export async function GET() {

  const store = readDrawerStore();

  const counter = countUniqueApprovedCards(store);

  return NextResponse.json({

    ok: true,

    approvals: store.approvals,

    counter,

    approver: defaultDrawerApprover(),

    path: drawerStorePath()

  });

}



export async function POST(request: Request) {

  try {

    const body = (await request.json()) as {

      receiptId?: string;

      cardId?: string | null;

      action?: DrawerAction;

      approver?: string | null;

      note?: string | null;

    };



    if (!body.receiptId?.trim()) {

      return NextResponse.json({ ok: false, error: "receiptId required" }, { status: 400 });

    }

    if (!body.action || !ACTIONS.has(body.action)) {

      return NextResponse.json({ ok: false, error: "action must be approve, reject, or follow_up" }, { status: 400 });

    }



    const result = writeDrawerDisposition({

      receiptId: body.receiptId.trim(),

      cardId: body.cardId,

      action: body.action,

      approver: body.approver,

      note: body.note

    });



    return NextResponse.json({

      ok: true,

      receiptId: body.receiptId.trim(),

      cardId: result.record.card_id,

      duplicate: result.duplicate,

      record: result.record,

      counter: result.counter,

      message: result.message,

      path: drawerStorePath()

    });

  } catch (err) {

    return NextResponse.json(

      { ok: false, error: err instanceof Error ? err.message : "Receipt drawer action failed" },

      { status: 400 }

    );

  }

}

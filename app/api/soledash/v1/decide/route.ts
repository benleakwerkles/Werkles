import { NextResponse } from "next/server";



import { loadSoleDashData } from "@/lib/soledash/cockpit-data";

import {

  ACTION_RECEIPTS_PATH,

  buildDispatchReceipt,

  buildFailedReceipt,

  buildSimpleReceipt

} from "@/lib/soledash/command-surface/action-receipts";

import {

  applyDecision,

  appendDecision,

  readCommandState,

  writeCommandState

} from "@/lib/soledash/command-surface/command-state";

import { dispatchBuild } from "@/lib/soledash/command-surface/dispatch";

import {

  DECISION_LOG_PATH,

  ensureProposalInState

} from "@/lib/soledash/command-surface/proposal-engine";

import type { BuildDecision, DecideActionResult } from "@/lib/soledash/command-surface/v1-types";



export const dynamic = "force-dynamic";



type DecideBody = {

  buildId?: string;

  decision?: BuildDecision;

  note?: string;

};



function json(result: DecideActionResult, status = 200) {

  return NextResponse.json(result, { status });

}



export async function POST(request: Request) {

  try {

    const body = (await request.json()) as DecideBody;

    const decision = body.decision;

    const buildId = body.buildId;



    if (!decision || !buildId) {

      return json(

        {

          ok: false,

          action: "blocked",

          error: "buildId and decision required.",

          message: "Missing buildId or decision."

        },

        400

      );

    }



    const data = await loadSoleDashData();

    const proposal = ensureProposalInState(buildId, data);

    if (!proposal) {

      return json(

        {

          ok: false,

          action: "blocked",

          error: "Proposal not found.",

          message: `Unknown proposal: ${buildId}`

        },

        404

      );

    }



    if (decision === "more_info") {

      const entry = appendDecision({

        buildId,

        decision: "more_info",

        note: body.note ?? "Operator opened MORE INFO",

        outboxPath: null

      });

      const receipt = buildSimpleReceipt({

        build: proposal,

        decision: "more_info",

        state: "DONE",

        writtenTo: DECISION_LOG_PATH,

        generated: entry.id,

        nextState: "Details expanded — transport and mission text below."

      });

      return json({

        ok: true,

        action: "more_info_logged",

        message: receipt.nextState,

        receipt,

        decisionLogPath: DECISION_LOG_PATH,

        build: proposal

      });

    }



    if (decision === "yea") {

      const result = await dispatchBuild({

        buildId,

        decisionNote: body.note

      });



      if (!result.ok) {

        const gateBlocked = (result.blocker ?? "").includes("HUMAN GATE") || result.message.includes("HUMAN GATE");

        const receipt = buildFailedReceipt({

          build: result.build ?? proposal,

          decision: "yea",

          blocker: result.blocker,

          message: result.message,

          gateBlocked

        });

        return json(

          {

            ok: false,

            action: "blocked",

            message: result.message,

            blocker: result.blocker,

            receipt,

            build: result.build

          },

          422

        );

      }



      const build = result.build!;

      const degradedManualSend = Boolean(result.degradedSend && build.cousin !== "MAKER" && build.cousin !== "DINK");

      const receipt = buildDispatchReceipt({

        build,

        outboxPath: build.outboxPath!,

        outboxFilename: build.outboxFilename!,

        cousin: build.cousin,

        machine: build.machine,

        degradedManualSend,

        note: body.note ?? null

      });



      return json({

        ok: true,

        action: "dispatched",

        message: result.message,

        receipt,

        build,

        outboxPath: build.outboxPath,

        decisionLogPath: DECISION_LOG_PATH,

        degradedSend: result.degradedSend

      });

    }



    const { state, build } = applyDecision(readCommandState(), buildId, decision, body.note);

    writeCommandState(state);



    if (!build) {

      return json(

        {

          ok: false,

          action: "blocked",

          message: "Build not found in state after decision.",

          error: "Build not found."

        },

        404

      );

    }



    if (decision === "nay") {

      const receipt = buildSimpleReceipt({

        build,

        decision: "nay",

        state: "DONE",

        writtenTo: DECISION_LOG_PATH,

        generated: "Proposal dropped",

        nextState: "Declined — removed from your active decision queue."

      });

      return json({

        ok: true,

        action: "dropped",

        message: receipt.nextState,

        receipt,

        decisionLogPath: DECISION_LOG_PATH,

        build

      });

    }



    if (decision === "defer") {

      const receipt = buildSimpleReceipt({

        build,

        decision: "defer",

        state: "DONE",

        writtenTo: DECISION_LOG_PATH,

        generated: "Deferred",

        nextState: "Snoozed — revisit when you're ready."

      });

      return json({

        ok: true,

        action: "deferred",

        message: receipt.nextState,

        receipt,

        decisionLogPath: DECISION_LOG_PATH,

        build

      });

    }



    const receipt = buildSimpleReceipt({

      build,

      decision,

      state: "DONE",

      writtenTo: ACTION_RECEIPTS_PATH,

      nextState: `Decision ${decision} recorded.`

    });



    return json({

      ok: true,

      action: "more_info_logged",

      message: receipt.nextState,

      receipt,

      decisionLogPath: DECISION_LOG_PATH,

      build

    });

  } catch (err) {

    return json(

      {

        ok: false,

        action: "blocked",

        error: err instanceof Error ? err.message : "Decision failed.",

        message: err instanceof Error ? err.message : "Decision failed."

      },

      500

    );

  }

}


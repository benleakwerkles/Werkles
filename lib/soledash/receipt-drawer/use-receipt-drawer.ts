"use client";



import { useCallback, useEffect, useState } from "react";



import type { ApprovalCounter, DrawerAction, DrawerDispositionRecord } from "./types";

import { DEFAULT_DRAWER_APPROVER } from "./types";



export function useReceiptDrawer(onChanged?: () => void | Promise<void>) {

  const [approvals, setApprovals] = useState<Record<string, DrawerDispositionRecord>>({});

  const [approver, setApprover] = useState(DEFAULT_DRAWER_APPROVER);

  const [counter, setCounter] = useState<ApprovalCounter>({ uniqueApproved: 0 });

  const [loading, setLoading] = useState(true);

  const [busyId, setBusyId] = useState<string | null>(null);

  const [cardNotices, setCardNotices] = useState<Record<string, string>>({});



  const load = useCallback(async () => {

    try {

      const res = await fetch("/api/soledash/v1/receipt-drawer", { cache: "no-store" });

      const data = await res.json();

      if (data.ok && data.approvals) {

        setApprovals(data.approvals as Record<string, DrawerDispositionRecord>);

        setCounter((data.counter as ApprovalCounter) ?? { uniqueApproved: 0 });

        if (typeof data.approver === "string" && data.approver.trim()) {

          setApprover(data.approver.trim());

        }

      }

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    void load();

  }, [load]);



  async function act(

    receiptId: string,

    action: DrawerAction,

    cardId: string

  ): Promise<{ ok: boolean; duplicate: boolean; message: string | null }> {

    setBusyId(receiptId);

    setCardNotices((prev) => {

      const next = { ...prev };

      delete next[receiptId];

      return next;

    });



    try {

      const res = await fetch("/api/soledash/v1/receipt-drawer", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ receiptId, cardId, action, approver })

      });

      const data = await res.json();



      if (!res.ok || !data.ok) {

        const error = data.error ?? "Action failed";

        setCardNotices((prev) => ({ ...prev, [receiptId]: error }));

        return { ok: false, duplicate: false, message: error };

      }



      if (data.record) {

        const record = data.record as DrawerDispositionRecord;

        setApprovals((prev) => ({

          ...prev,

          [`${record.card_id}:${record.acted_by}`]: record

        }));

      }



      if (data.counter) {

        setCounter(data.counter as ApprovalCounter);

      }



      const message = typeof data.message === "string" ? data.message : null;

      if (data.duplicate && message) {

        setCardNotices((prev) => ({ ...prev, [receiptId]: message }));

      }



      await onChanged?.();

      return { ok: true, duplicate: Boolean(data.duplicate), message };

    } catch (err) {

      const error = err instanceof Error ? err.message : "Network error";

      setCardNotices((prev) => ({ ...prev, [receiptId]: error }));

      return { ok: false, duplicate: false, message: error };

    } finally {

      setBusyId(null);

    }

  }



  return { approvals, approver, counter, loading, busyId, cardNotices, reload: load, act };

}

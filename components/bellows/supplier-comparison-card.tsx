"use client";

import { useEffect, useMemo, useState } from "react";

type CostRow = { name: string; upfront: string; delivery: string; setup: string; monthly: string; downtime: string };
const blank = (): CostRow => ({ name: "", upfront: "", delivery: "", setup: "", monthly: "", downtime: "" });
const money = (value: string) => Math.max(0, Number.parseFloat(value.replace(/[^0-9.]/g, "")) || 0);
const STORAGE_KEY = "werkles:bellows:supplier-comparison:v1";
const MAX_REQUIREMENT = 500;
const MAX_NAME = 160;
const MAX_NUMBER = 40;

function savedRows(value: unknown): CostRow[] | null {
  if (!Array.isArray(value) || value.length !== 3) return null;
  const fields: Array<keyof CostRow> = ["name", "upfront", "delivery", "setup", "monthly", "downtime"];
  if (!value.every((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return false;
    const record = row as Record<string, unknown>;
    if (Object.keys(record).length !== fields.length || !fields.every((field) => field in record)) return false;
    return fields.every((field) => typeof record[field] === "string" && (record[field] as string).length <= (field === "name" ? MAX_NAME : MAX_NUMBER));
  })) return null;
  return value.map((row) => Object.fromEntries(fields.map((field) => [field, (row as Record<string, string>)[field]])) as CostRow);
}

function savedComparison(value: unknown): { requirement: string; rows: CostRow[] } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== 2 || !("requirement" in record) || !("rows" in record)) return null;
  if (typeof record.requirement !== "string" || record.requirement.length > MAX_REQUIREMENT) return null;
  const rows = savedRows(record.rows);
  return rows ? { requirement: record.requirement, rows } : null;
}

export function SupplierComparisonCard() {
  const [requirement, setRequirement] = useState("");
  const [rows, setRows] = useState<CostRow[]>([blank(), blank(), blank()]);
  const [status, setStatus] = useState("Nothing is saved or sent from this card.");
  const totals = useMemo(
    () => rows.map((row) => money(row.upfront) + money(row.delivery) + money(row.setup) + money(row.monthly) * 12 + money(row.downtime)),
    [rows]
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = savedComparison(JSON.parse(raw));
      if (!parsed) {
        setStatus("The saved device comparison was invalid and was not restored. Nothing was sent.");
        return;
      }
      setRequirement(parsed.requirement);
      setRows(parsed.rows);
      setStatus("Saved comparison restored from this device.");
    } catch {
      setStatus("The saved device draft could not be read. Nothing was sent.");
    }
  }, []);

  function update(index: number, field: keyof CostRow, value: string) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
    setStatus("Working in this tab. Nothing is saved or sent.");
  }

  async function copyBrief() {
    const body = [
      `REQUIREMENT\n${requirement || "Not written"}`,
      ...rows.map((row, index) => [
        `OPTION ${index + 1}: ${row.name || "Unnamed"}`,
        `First-year entered cost: $${totals[index].toFixed(2)}`,
        `Upfront ${row.upfront || "0"}; delivery ${row.delivery || "0"}; setup ${row.setup || "0"}; monthly ${row.monthly || "0"}; downtime ${row.downtime || "0"}`,
        "Still check: exact scope, exclusions, condition, warranty, service response, cancellation, seller identity, source, and checked date."
      ].join("\n"))
    ].join("\n\n");
    try {
      await navigator.clipboard.writeText(body);
      setStatus("Comparison brief copied. Review every number and missing check before using it.");
    } catch {
      setStatus("Clipboard access failed. Your entries remain in this tab only.");
    }
  }

  function saveDraft() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ requirement, rows }));
      setStatus("Saved on this device. It is not account-saved or shared.");
    } catch {
      setStatus("This browser could not save the draft. Nothing was sent.");
    }
  }

  function clearDraft() {
    window.localStorage.removeItem(STORAGE_KEY);
    setRequirement("");
    setRows([blank(), blank(), blank()]);
    setStatus("Device draft cleared. Nothing was sent.");
  }

  return (
    <section className="supplier-comparison" aria-labelledby="supplierComparisonTitle">
      <header><p className="eyebrow">Working card</p><h2 id="supplierComparisonTitle">Compare three options on the same footing.</h2><p>Enter only numbers you can trace. A zero means not entered—not free.</p></header>
      <label className="supplier-comparison__requirement">One requirement every option must meet
        <textarea value={requirement} onChange={(event) => setRequirement(event.target.value)} placeholder="Job, capacity, location, must-haves, and date needed" maxLength={MAX_REQUIREMENT} />
      </label>
      <div className="supplier-comparison__grid">
        {rows.map((row, index) => (
          <fieldset key={index}>
            <legend>Option {index + 1}</legend>
            <label>Name or source<input maxLength={MAX_NAME} value={row.name} onChange={(event) => update(index, "name", event.target.value)} /></label>
            <label>Purchase / lease upfront<input inputMode="decimal" maxLength={MAX_NUMBER} value={row.upfront} onChange={(event) => update(index, "upfront", event.target.value)} /></label>
            <label>Delivery<input inputMode="decimal" maxLength={MAX_NUMBER} value={row.delivery} onChange={(event) => update(index, "delivery", event.target.value)} /></label>
            <label>Setup / installation<input inputMode="decimal" maxLength={MAX_NUMBER} value={row.setup} onChange={(event) => update(index, "setup", event.target.value)} /></label>
            <label>Monthly recurring<input inputMode="decimal" maxLength={MAX_NUMBER} value={row.monthly} onChange={(event) => update(index, "monthly", event.target.value)} /></label>
            <label>Estimated downtime cost<input inputMode="decimal" maxLength={MAX_NUMBER} value={row.downtime} onChange={(event) => update(index, "downtime", event.target.value)} /></label>
            <output>First-year entered cost <strong>${totals[index].toFixed(2)}</strong></output>
          </fieldset>
        ))}
      </div>
      <div className="supplier-comparison__actions">
        <button className="button button-dark" type="button" onClick={saveDraft}>Save on This Device</button>
        <button className="button button-outline" type="button" onClick={copyBrief}>Copy Comparison Brief</button>
        <button className="button button-ghost" type="button" onClick={clearDraft}>Clear Device Draft</button>
        <p role="status">{status}</p>
      </div>
    </section>
  );
}

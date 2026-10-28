"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { INTAKE, intakeLine, sumIntake, validIntake, type IntakeKind, type IntakeRow, type IntakeTotals } from "@/lib/intake/intake";

// Today's water and caffeine, as totals of what was logged, with a way to add more.
export default function IntakeBar() {
  // null = not read (yet or failed): never shown as zero.
  const [totals, setTotals] = useState<IntakeTotals | null>(null);
  const [readFailed, setReadFailed] = useState(false);
  const [kind, setKind] = useState<IntakeKind>("water");
  const [amount, setAmount] = useState(String(INTAKE.water.preset));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  // Only the newest totals request may commit: an older read can never overwrite a newer result.
  const newest = useRef(0);
  const read = useCallback(async () => {
    const request = ++newest.current;
    const db = createClient();
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const { data, error: readError } = await db.from("intake_logs").select("kind,amount,logged_at")
      .gte("logged_at", start.toISOString()).lt("logged_at", end.toISOString());
    return { request, totals: readError ? null : sumIntake((data ?? []) as IntakeRow[]) };
  }, []);
  const commit = useCallback((result: { request: number; totals: IntakeTotals | null }): boolean => {
    if (result.request !== newest.current) return result.totals !== null;   // a newer read owns the display
    if (!result.totals) { setReadFailed(true); return false; }
    setTotals(result.totals);
    setReadFailed(false);
    return true;
  }, []);
  const refresh = useCallback(async () => commit(await read()), [read, commit]);
  useEffect(() => {
    let live = true;
    void read().then((result) => { if (live) commit(result); });
    return () => { live = false; newest.current += 1; };
  }, [read, commit]);
  const add = async () => {
    const value = Number(amount);
    if (!validIntake(kind, value)) { setError(`Enter a whole number from 1 to ${INTAKE[kind].max} ${INTAKE[kind].unit}.`); return; }
    setBusy(true); setError(""); setSaved(false);
    try {
      const db = createClient();
      const { data: { user } } = await db.auth.getUser();
      if (!user) throw new Error("Sign in required.");
      const { error: writeError } = await db.from("intake_logs").insert({ user_id: user.id, kind, amount: value });
      if (writeError) throw new Error("It could not be saved.");
      setSaved(true);                       // from here on the entry exists; only the total may be out of date
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "It could not be saved."); }
    finally { setBusy(false); }
  };
  return <section aria-label="Water and caffeine" className="flex flex-col gap-2 px-screen-x pb-card-gap text-detail">
    {totals && !readFailed
      ? <p className="tabular-nums text-muted" role="status">{intakeLine(totals, { includeZero: true })}</p>
      : <p className="text-muted" role="status">{readFailed ? (saved ? "Saved. Today's totals could not be refreshed." : "Today's totals could not be read.") : "Loading today's totals…"}
          {readFailed ? <> <button type="button" onClick={() => { void refresh(); }} className="min-h-tap text-text">Refresh</button></> : null}</p>}
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="intake-kind">Log</label>
      <select id="intake-kind" value={kind} disabled={busy} onChange={(event) => { const next = event.target.value as IntakeKind; setKind(next); setAmount(String(INTAKE[next].preset)); }} className="min-h-tap rounded-field bg-field px-tooltip-x">
        <option value="water">Water</option>
        <option value="caffeine">Caffeine</option>
      </select>
      <label className="sr-only" htmlFor="intake-amount">Amount in {INTAKE[kind].unit}</label>
      <input id="intake-amount" inputMode="numeric" value={amount} disabled={busy} onChange={(event) => setAmount(event.target.value)} className="min-h-tap w-20 rounded-field bg-field px-tooltip-x tabular-nums" />
      <span className="text-muted">{INTAKE[kind].unit}</span>
      <button type="button" disabled={busy} onClick={() => { void add(); }} className="min-h-tap text-text disabled:opacity-50">{busy ? "Adding…" : "Add"}</button>
    </div>
    {error ? <p role="alert" className="text-meta text-muted">{error}</p> : null}
  </section>;
}

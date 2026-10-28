"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { INTAKE, intakeLine, sumIntake, validIntake, emptyIntake, type IntakeKind, type IntakeRow } from "@/lib/intake/intake";

// Today's water and caffeine, as totals of what was logged, with a way to add more.
export default function IntakeBar() {
  const [totals, setTotals] = useState(emptyIntake);
  const [kind, setKind] = useState<IntakeKind>("water");
  const [amount, setAmount] = useState(String(INTAKE.water.preset));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Today's totals, or null when they could not be read.
  const fetchTotals = useCallback(async () => {
    const db = createClient();
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const { data, error: readError } = await db.from("intake_logs").select("kind,amount,logged_at")
      .gte("logged_at", start.toISOString()).lt("logged_at", end.toISOString());
    return readError ? null : sumIntake((data ?? []) as IntakeRow[]);
  }, []);
  useEffect(() => {
    let live = true;
    void fetchTotals().then((fresh) => { if (live && fresh) setTotals(fresh); });
    return () => { live = false; };
  }, [fetchTotals]);
  const add = async () => {
    const value = Number(amount);
    if (!validIntake(kind, value)) { setError(`Enter a whole number from 1 to ${INTAKE[kind].max} ${INTAKE[kind].unit}.`); return; }
    setBusy(true); setError("");
    try {
      const db = createClient();
      const { data: { user } } = await db.auth.getUser();
      if (!user) throw new Error("Sign in required.");
      const { error: writeError } = await db.from("intake_logs").insert({ user_id: user.id, kind, amount: value });
      if (writeError) throw new Error("It could not be saved.");
      const fresh = await fetchTotals();
      if (fresh) setTotals(fresh);
    } catch (e) { setError(e instanceof Error ? e.message : "It could not be saved."); }
    finally { setBusy(false); }
  };
  return <section aria-label="Water and caffeine" className="flex flex-col gap-2 px-screen-x pb-card-gap text-detail">
    <p className="tabular-nums text-muted" role="status">{intakeLine(totals, { includeZero: true })}</p>
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

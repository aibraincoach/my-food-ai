"use client";

import { Sheet } from "@/components/ui/Sheet";
import { Icon } from "@/components/ui/Icon";
import { monthName, postedLabel } from "@/components/MonthGrid";

export default function GoToMonthSheet({ open, months, counts, loading, error, onClose, onMonth }: { open: boolean; months: string[]; counts: Record<string, number> | null; loading: boolean; error: string; onClose: () => void; onMonth: (month: string) => void }) {
  return <Sheet open={open} onClose={onClose} label="Go to">
    <header className="flex min-h-tap items-center justify-between"><h2 className="text-sheet-head">Go to</h2><button type="button" aria-label="Close month list" className="flex size-tap items-center justify-center" onClick={onClose}><Icon name="close" /></button></header>
    {loading ? <p role="status" className="text-meta text-muted">Loading posted months…</p> : null}
    {error ? <p role="alert" className="text-meta text-muted">{error}</p> : null}
    <div>{months.map(month => <button type="button" key={month} onClick={() => onMonth(month)} className="flex h-field-h w-full items-center justify-between text-body"><span>{monthName(month, true)}</span><span className="text-meta text-muted tabular-nums">{counts ? postedLabel(counts[month] ?? 0) : "…"}</span></button>)}</div>
  </Sheet>;
}

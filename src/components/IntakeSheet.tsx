"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { tokens } from "@/lib/theme/tokens";
import { createPost } from "@/lib/posts/create";
import { customCoffeeCaffeine } from "@/lib/intake/intake";
import type { DrinkRow } from "@/lib/intake/hydration";

const water = [{ ml: 150, label: "small glass" }, { ml: 250, label: "glass" }, { ml: 330, label: "bottle" }, { ml: 500, label: "large bottle" }, { ml: 750, label: "sports bottle" }, { ml: 1000, label: "jug" }];
const coffee = [{ ml: 30, label: "espresso · 63 mg" }, { ml: 240, label: "cup · 95 mg" }, { ml: 350, label: "large · 150 mg" }];
type Tab = "Water" | "Coffee" | "Other";

// Mounted once alongside capture. The fan and this sheet meet only through open-entry.
export default function IntakeSheet({ initialKind, embedded = false, onClose }: { initialKind?: "water" | "caffeine"; embedded?: boolean; onClose?: () => void } = {}) {
  const [open, setOpen] = useState(embedded);
  const [tab, setTab] = useState<Tab>(initialKind === "caffeine" ? "Coffee" : "Water");
  const [selected, setSelected] = useState<number | null>(initialKind === "caffeine" ? 240 : 330);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [rows, setRows] = useState<DrinkRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [readError, setReadError] = useState(false);
  const chooseTab = (next: Tab) => { setTab(next); setSelected(next === "Water" ? 330 : next === "Coffee" ? 240 : null); setCustom(""); setName(""); setError(""); };
  useEffect(() => {
    const receive = (event: Event) => {
      const entry = (event as CustomEvent<{ entry?: string }>).detail?.entry;
      if (entry === "drink" || entry === "coffee") { chooseTab(entry === "drink" ? "Water" : "Coffee"); setOpen(true); }
    };
    window.addEventListener("open-entry", receive);
    return () => window.removeEventListener("open-entry", receive);
  }, []);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    void fetch(`/api/intake/post?tz=${encodeURIComponent(zone)}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("read");
      const data = await response.json();
      setRows(data.rows); setReadError(false);
    }).catch(() => { if (!controller.signal.aborted) { setRows([]); setReadError(true); } });
    return () => controller.abort();
  }, [open]);
  const ml = selected ?? Number(custom);
  const valid = Number.isInteger(ml) && ml >= 1 && ml <= 5000 && (tab !== "Coffee" || selected !== null || customCoffeeCaffeine(ml) !== null) && (tab !== "Other" || name.trim().length > 0);
  const label = tab === "Water" ? "Water" : tab === "Coffee" ? `Coffee${selected === 30 ? ", espresso" : selected === 240 ? ", cup" : selected === 350 ? ", large" : ""}` : name.trim();
  const close = () => { if (!busy) { setOpen(false); onClose?.(); window.dispatchEvent(new Event("entry-closed")); } };
  const post = async () => {
    if (!valid || busy) return;
    setBusy(true); setError("");
    try {
      let id: string;
      if (tab === "Other") id = (await createPost(`${name.trim()} ${ml} ml`, [])).postId;
      else {
        const response = await fetch("/api/intake/post", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: tab === "Water" ? "water" : "caffeine", ml, custom: selected === null }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "The drink could not be saved.");
        id = data.post_id;
      }
      window.dispatchEvent(new CustomEvent("post-created", { detail: { id } }));
      setOpen(false); onClose?.(); window.dispatchEvent(new Event("entry-closed"));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The drink could not be saved."); }
    finally { setBusy(false); }
  };
  const sectionGap = tokens.spacing['item-row'];
  const content = <>
    <div className="flex flex-col" style={{ marginTop: -tokens.radii.chip, marginBottom: -tokens.spacing['sheet-bottom'] }}>
      <div className="flex h-tap items-center justify-between"><h2 className="text-sheet-head">Drink</h2>
        <button type="button" aria-label="Close drink" disabled={busy} className="flex min-h-tap min-w-tap items-center justify-end" onClick={close}><Icon name="close" size={tokens.spacing['item-row']} /></button>
      </div>
      <div role="tablist" aria-label="Drink kind" className="mt-2 flex rounded-field bg-field" style={{ padding: tokens.border.hairline + tokens.icon.strongStroke }}>
        {(["Water", "Coffee", "Other"] as const).map(value => <button type="button" role="tab" aria-selected={tab === value} key={value} disabled={busy}
          className={`flex-1 text-comment ${tab === value ? "bg-surface font-semibold text-text" : "font-medium text-muted"}`}
          style={{ height: tokens.spacing['table-row'] + tokens.spacing.grid * 2, borderRadius: tokens.radii.field - (tokens.border.hairline + tokens.icon.strongStroke), boxShadow: tab === value ? tokens.colors['shadow-segment'] : undefined }}
          onClick={() => chooseTab(value)}>{value}</button>)}
      </div>
      <p className="text-meta text-muted" style={{ marginTop: sectionGap, marginBottom: tokens.spacing['tooltip-y'] }}>How much?</p>
      {tab === "Other" ? <Field label="What was it?" maxLength={160} value={name} disabled={busy} onChange={event => setName(event.target.value)} /> :
        <div className="grid grid-cols-3 gap-2">{(tab === "Water" ? water : coffee).map(option => <button key={option.ml} type="button" aria-pressed={selected === option.ml} disabled={busy}
          className={`flex flex-col items-center justify-center rounded-field border text-body ${selected === option.ml ? "border-text bg-text text-surface" : "border-line bg-white text-text"}`}
          style={{ height: tokens.capture.thumbSize }} onClick={() => { setSelected(option.ml); setCustom(""); }}>
          <span className="font-semibold">{option.ml === 1000 ? "1 l" : `${option.ml} ml`}</span><span className="text-label opacity-70">{option.label}</span>
        </button>)}</div>}
      <Field placeholder="Other amount" aria-label="Other amount" suffix="ml" inputMode="numeric" value={custom} disabled={busy} className="mt-2" onChange={event => { setSelected(null); setCustom(event.target.value); }} />
      {tab === "Coffee" && selected === null && ml > 0 && Number.isFinite(ml) ? <p className="mt-1 text-label text-muted">{Math.round(ml * 95 / 240)} mg caffeine</p> : null}
      {tab === "Coffee" && selected === null && custom && !valid ? <p role="status" className="mt-1 text-label text-muted">Enter a whole amount from 2 to 2527 ml.</p> : null}
      <p className="text-meta text-muted" style={{ marginTop: sectionGap, marginBottom: tokens.spacing.grid }}>Drank today</p>
      {readError ? <p role="status" className="text-meta text-muted">Drinks could not be read.</p> : rows.map((row, index) => <div key={`${row.logged_at}-${index}`} className="flex items-center gap-2 border-b border-hairline" style={{ minHeight: tokens.capture.controlsGap }}>
        <time className="shrink-0 text-meta text-muted tabular-nums" style={{ width: tokens.capture.thumbSize + tokens.spacing.grid }} dateTime={row.logged_at}>{new Date(row.logged_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</time>
        <span className="min-w-0 flex-1 text-comment">{row.label ?? (row.kind === "water" ? "Water" : "Caffeine")}</span>
        <span className="text-detail text-muted tabular-nums">{row.ml != null ? `${row.ml} ml` : `${row.amount} ${row.kind === "water" ? "ml" : "mg"}`}{row.kind === "caffeine" && row.ml != null ? ` · ${row.amount} mg caffeine` : ""}</span>
      </div>)}
      {error ? <p role="alert" className="mt-2 text-detail text-muted">{error}</p> : null}
      <Button disabled={!valid || busy} onClick={() => { void post(); }} style={{ marginTop: tokens.spacing['screen-x'], marginBottom: tokens.spacing['table-row'] + tokens.spacing.grid }}>{busy ? "Posting…" : `Post · ${label} ${valid ? ml : ""} ml`}</Button>
    </div>
  </>;
  return embedded ? content : <Sheet open={open} onClose={close} label="Drink">{content}</Sheet>;
}

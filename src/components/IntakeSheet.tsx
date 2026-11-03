"use client";

import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {uploadManager,type UploadState} from "@/lib/posts/upload-manager";
import { DRINK_TILES, TILE_SIZES } from "@/lib/intake/intake";
import type { DrinkRow } from "@/lib/intake/hydration";

type Posted = { id: string; label: string; expires: number };
const number = (value: number) => value.toLocaleString("en-US");

// Mounted once alongside capture. The fan and this sheet meet through open-entry.
export default function IntakeSheet({ embedded = false, onClose }: { initialKind?: "water" | "caffeine"; embedded?: boolean; onClose?: () => void } = {}) {
  const [open, setOpen] = useState(embedded);
  const [caption, setCaption] = useState("");
  const [rows, setRows] = useState<DrinkRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [readError, setReadError] = useState(false);
  const [posted, setPosted] = useState<Posted[]>([]);
  const [undoing, setUndoing] = useState<string | null>(null);
  const captionPending = useRef(false);
  const [tileCounts, setTileCounts] = useState<number[]>(DRINK_TILES.map(() => 0));
  const [usualMl, setUsualMl] = useState<number[]>(DRINK_TILES.map(tile => tile.ml));
  const [sizeTile, setSizeTile] = useState<number | null>(null);
  const hold = useRef<{timer: ReturnType<typeof setTimeout>; x: number; y: number} | null>(null);
  const held = useRef(false);
  const cancelHold = () => { if (hold.current) clearTimeout(hold.current.timer); hold.current = null; };
  useEffect(() => () => { if (hold.current) clearTimeout(hold.current.timer); }, []);
  useEffect(() => {
    const receive = (event: Event) => {
      const entry = (event as CustomEvent<{ entry?: string }>).detail?.entry;
      if (entry === "drink" || entry === "coffee") { setError(""); setCaption(""); setSizeTile(null); setOpen(true); }
      else if (entry) setOpen(false);
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
    void fetch("/api/intake/tile-counts", {signal: controller.signal}).then(async response => {
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data.counts) && data.counts.length === DRINK_TILES.length && data.counts.every((count: unknown) => typeof count === "number" && Number.isFinite(count) && count >= 0)) setTileCounts(data.counts);
      if (Array.isArray(data.usualMl) && data.usualMl.length === DRINK_TILES.length && data.usualMl.every((ml: unknown, index: number) => TILE_SIZES[index].some(size => size.ml === ml))) setUsualMl(data.usualMl);
    }).catch(() => {});
    return () => controller.abort();
  }, [open]);
  useEffect(() => {
    if (!posted.length) return;
    const timeout = window.setTimeout(() => setPosted(previous => previous.filter(row => row.expires > Date.now())), Math.max(0, Math.min(...posted.map(row => row.expires)) - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [posted]);
  const close = () => { cancelHold(); setSizeTile(null); setOpen(false); onClose?.(); window.dispatchEvent(new Event("entry-closed")); };
  // Each tap is a separate request, including two taps before the first settles.
  const postTile = async (tile: number, ml = usualMl[tile]) => {
    setError("");
    try {
      const choice=DRINK_TILES[tile],size=TILE_SIZES[tile].find(size=>size.ml===ml);
      await uploadManager.postDrink({tile,ml,eaten_at:new Date().toISOString(),time_zone:Intl.DateTimeFormat().resolvedOptions().timeZone},choice.name+', '+(size?.word??choice.size)+' · '+ml+' ml');
      close();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The drink could not be saved."); }
  };
  useEffect(()=>{
    const finished=(event:Event)=>{const drink=(event as CustomEvent<UploadState>).detail;if(drink?.drinkTile&&drink.postId)setPosted(previous=>[...previous,{id:drink.postId!,label:drink.caption,expires:Date.now()+4000}]);};
    window.addEventListener('upload-finished',finished);return()=>window.removeEventListener('upload-finished',finished);
  },[]);
  const postCaption = async () => {
    if (!caption.trim() || captionPending.current) return;
    captionPending.current = true; setBusy(true); setError("");
    try {
      await uploadManager.postCaption(caption.trim(),new Date().toISOString());
      setCaption(""); close();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The drink could not be saved."); }
    finally { captionPending.current = false; setBusy(false); }
  };
  const undo = async (id: string) => {
    if (undoing) return;
    setUndoing(id); setError("");
    try {
      const response = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("The drink could not be removed.");
      window.dispatchEvent(new CustomEvent("post-deleted", { detail: { id } }));
      setPosted(previous => previous.filter(row => row.id !== id));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The drink could not be removed."); }
    finally { setUndoing(null); }
  };
  const ml = rows.reduce((total, row) => total + (row.ml ?? (row.kind === "water" ? row.amount : 0)), 0);
  const caffeine = rows.reduce((total, row) => total + (row.kind === "caffeine" ? row.amount : 0), 0);
  const tileOrder = DRINK_TILES.map((_, index) => index).sort((a, b) => tileCounts[b] - tileCounts[a] || a - b);
  const content = <div className="flex flex-col gap-[14px] pb-2">
    <div className="flex items-center justify-between gap-2"><h2 className="text-sheet-head">Drink</h2>
      <span className="text-[13px] text-muted tabular-nums">{readError ? "Drinks could not be read." : `Today: ${number(ml)} ml · ${number(caffeine)} mg caffeine`}</span>
    </div>
    <div className="grid grid-cols-3 gap-2">{tileOrder.map(index => {
      const tile = DRINK_TILES[index];
      const size = TILE_SIZES[index].find(size => size.ml === usualMl[index])!;
      const caffeineMg = size.caffeineMg ?? Math.round(tile.caffeineMg * size.ml / tile.ml);
      return <button key={index} type="button" disabled={busy} onClick={() => { if (held.current) { held.current = false; return; } void postTile(index); }}
        onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0) return;
          cancelHold(); held.current = false;
          const x = event.clientX, y = event.clientY;
          hold.current = {x, y, timer: setTimeout(() => { held.current = true; setSizeTile(index); hold.current = null; }, 500)};
        }}
        onPointerMove={event => { if (hold.current && Math.hypot(event.clientX - hold.current.x, event.clientY - hold.current.y) > 8) cancelHold(); }}
        onPointerUp={cancelHold} onPointerLeave={cancelHold} onPointerCancel={cancelHold} onContextMenu={event => event.preventDefault()}
        onKeyDown={event => { if (event.key === "Enter" || event.key === " ") held.current = false; if (event.key === "ArrowDown") { event.preventDefault(); setSizeTile(index); } }}
        aria-label={`Post ${tile.name}, ${size.word}`} aria-expanded={sizeTile === index} aria-controls={sizeTile === index ? "drink-tile-sizes" : undefined}
        className="flex h-[92px] touch-manipulation flex-col justify-between rounded-[14px] border border-line bg-white px-3 py-[10px] text-left active:bg-field disabled:opacity-50">
        <span className="flex flex-col"><span className="text-[14px] font-semibold">{tile.name}</span><span className="text-[12px] text-muted">{size.word}</span></span>
        <span className="flex justify-between gap-1 text-[12px] tabular-nums"><span>{size.ml} ml</span>{caffeineMg > 0 && <span className="text-muted">{caffeineMg} mg</span>}</span>
      </button>;
    })}</div>
    {sizeTile !== null && <div id="drink-tile-sizes" role="group" aria-label={`${DRINK_TILES[sizeTile].name} sizes`} className="flex flex-wrap gap-2">
      {TILE_SIZES[sizeTile].map(size => <button key={size.ml} type="button" disabled={busy} className="min-h-tap rounded-field border border-line px-3 py-2 text-detail active:bg-field" onClick={() => { held.current = false; void postTile(sizeTile, size.ml); }}>
        {size.word} · {size.ml} ml
      </button>)}
    </div>}
    <p className="-mt-1 text-[12px] text-muted">Tap to post. Hold to change the size.</p>
    <form onSubmit={event => { event.preventDefault(); void postCaption(); }} className="flex flex-col gap-2">
      <div className="flex items-center gap-2"><Field className="min-w-0 flex-1" aria-label="Drink description" placeholder="Type a drink, e.g. oat latte, large" maxLength={1000} value={caption} disabled={busy} onChange={event => setCaption(event.target.value)} />
        <button type="button" aria-label="Photograph a drink" disabled={busy} className="flex size-12 shrink-0 items-center justify-center rounded-field bg-text text-surface" onClick={() => { close(); window.dispatchEvent(new CustomEvent("open-entry", { detail: { entry: "camera" } })); }}><Icon name="camera" size={22} /></button>
      </div>
      {caption.trim() && <Button type="submit" disabled={busy}>{busy ? "Posting…" : "Post drink"}</Button>}
    </form>
    {error && <p role="alert" className="text-detail text-muted">{error}</p>}
  </div>;
  return <>{embedded ? content : <Sheet hideClose open={open} onClose={close} label="Drink">{content}</Sheet>}
    {posted.length > 0 && <div className="fixed inset-x-inset bottom-[100px] z-[80] mx-auto flex max-w-phone flex-col gap-2">{posted.map(row => <div key={row.id} role="status" className="flex items-center justify-between gap-4 rounded-field bg-text px-4 py-3 text-detail text-surface shadow-lg">
      <span>Posted {row.label}</span><button type="button" disabled={undoing !== null} className="min-h-tap shrink-0 font-semibold" onClick={() => { void undo(row.id); }}>{undoing === row.id ? "Removing…" : "Undo"}</button>
    </div>)}</div>}
    {!open && error && <p role="alert" className="fixed inset-x-inset bottom-[100px] z-[80] rounded-field bg-text p-4 text-surface">{error}</p>}
  </>;
}

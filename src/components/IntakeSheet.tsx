"use client";

import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { createPost } from "@/lib/posts/create";
import { DRINK_TILES } from "@/lib/intake/intake";
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
  useEffect(() => {
    const receive = (event: Event) => {
      const entry = (event as CustomEvent<{ entry?: string }>).detail?.entry;
      if (entry === "drink" || entry === "coffee") { setError(""); setCaption(""); setOpen(true); }
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
    return () => controller.abort();
  }, [open]);
  useEffect(() => {
    if (!posted.length) return;
    const timeout = window.setTimeout(() => setPosted(previous => previous.filter(row => row.expires > Date.now())), Math.max(0, Math.min(...posted.map(row => row.expires)) - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [posted]);
  const close = () => { setOpen(false); onClose?.(); window.dispatchEvent(new Event("entry-closed")); };
  // Each tap is a separate request, including two taps before the first settles.
  const postTile = async (tile: number) => {
    setError("");
    try {
      const response = await fetch(`/api/intake/post?tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tile }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The drink could not be saved.");
      const choice = DRINK_TILES[tile];
      setPosted(previous => [...previous, { id: data.post_id, label: `${choice.name}, ${choice.size}`, expires: Date.now() + 4000 }]);
      window.dispatchEvent(new CustomEvent("post-created", { detail: { id: data.post_id } }));
      close();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The drink could not be saved."); }
  };
  const postCaption = async () => {
    if (!caption.trim() || captionPending.current) return;
    captionPending.current = true; setBusy(true); setError("");
    try {
      const { postId } = await createPost(caption.trim(), []);
      window.dispatchEvent(new CustomEvent("post-created", { detail: { id: postId } }));
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
  const content = <div className="flex flex-col gap-[14px] pb-2">
    <div className="flex items-center justify-between gap-2"><h2 className="text-sheet-head">Drink</h2>
      <span className="text-[13px] text-muted tabular-nums">{readError ? "Drinks could not be read." : `Today: ${number(ml)} ml${caffeine > 0 ? ` · ${number(caffeine)} mg caffeine` : ""}`}</span>
    </div>
    <div className="grid grid-cols-3 gap-2">{DRINK_TILES.map((tile, index) => <button key={index} type="button" disabled={busy} onClick={() => { void postTile(index); }}
      aria-label={`Post ${tile.name}, ${tile.size}`} className="flex h-[92px] flex-col justify-between rounded-[14px] border border-line bg-white px-3 py-[10px] text-left active:bg-field disabled:opacity-50">
      <span className="flex flex-col"><span className="text-[14px] font-semibold">{tile.name}</span><span className="text-[12px] text-muted">{tile.size}</span></span>
      <span className="flex justify-between gap-1 text-[12px] tabular-nums"><span>{tile.ml} ml</span>{tile.caffeineMg > 0 && <span className="text-muted">{tile.caffeineMg} mg</span>}</span>
    </button>)}</div>
    <p className="-mt-1 text-[12px] text-muted">Tap to post.</p>
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

"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { DetailItem, DetailPhoto, ItemBox } from "@/lib/posts/items";
import { sumNutrition, formatGrams, toNumber } from "@/lib/nutrition/totals";
import { tokens } from "@/lib/theme/tokens";
import { useDrinkCard } from "@/components/useDrinkCard";
import { ResultsCard } from "@/components/ResultsCard";
import ItemRows, { outlineColor } from "@/components/ItemRows";
import ItemEditSheet from "@/components/ItemEditSheet";

const subscribeClock = () => () => {};
export function DetailDate({ value, weekday = false }: { value: string; weekday?: boolean }) {
  const local = useSyncExternalStore(subscribeClock, () => true, () => false);
  const date = new Date(value);
  const options = { hour: "numeric", minute: "2-digit", ...(local ? {} : { timeZone: "UTC" }) } as const;
  return <>{weekday ? `${date.toLocaleDateString(undefined, { weekday: "long", ...(local ? {} : { timeZone: "UTC" }) })} · ` : ""}{date.toLocaleTimeString(undefined, options)}</>;
}

function Mask({ url, photo, color, frame, fallback }: {
  url: string | null; photo: DetailPhoto; color: string; frame: CSSProperties; fallback: CSSProperties;
}) {
  const [loaded, setLoaded] = useState<{ url: string; valid: boolean } | null>(null);
  useEffect(() => {
    if (!url) return;
    let live = true;
    const image = new Image();
    image.onload = () => { if (live) setLoaded({ url, valid: image.naturalWidth === photo.width && image.naturalHeight === photo.height }); };
    image.onerror = () => { if (live) setLoaded({ url, valid: false }); };
    image.src = url;
    return () => { live = false; image.onload = null; image.onerror = null; };
  }, [url, photo.width, photo.height]);
  return url && loaded?.url === url && loaded.valid
    ? <div className="pointer-events-none absolute" style={{ ...frame, background: color, maskImage: `url("${url}")`, WebkitMaskImage: `url("${url}")`, maskSize: "100% 100%", WebkitMaskSize: "100% 100%", maskRepeat: "no-repeat" }} />
    : <div className="pointer-events-none absolute rounded-field" style={{ ...fallback, border: `${tokens.detail.outlineWidth}px solid ${color}` }} />;
}

export default function OutlineOverlay({ initialized, postId, caption, eatenAt, status, photo, items }: {
  initialized: boolean; postId: string; caption: string; eatenAt: string; status: string; photo: DetailPhoto | null; items: DetailItem[];
}) {
  const router = useRouter();
  const drink = useDrinkCard(postId, status, eatenAt);
  const localTime = useSyncExternalStore(subscribeClock, () => true, () => false);
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(tokens.spacing.phone);
  const [outlines, setOutlines] = useState(true);
  const [selection, setSelection] = useState<{ item: DetailItem | null; box?: ItemBox; key: number } | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawBox, setDrawBox] = useState<ItemBox | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [waiting, setWaiting] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => { if (entry.contentRect.width) setWidth(entry.contentRect.width); });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const supabase = createClient();
    let live = true;
    let checking = false;
    const refresh = async () => {
      if (checking) return;
      checking = true;
      try {
        const { data, error } = await supabase.from("posts").select("status").eq("id", postId).maybeSingle();
        if (!live || error) return;
        if (!data) { router.replace("/"); return; }
        router.refresh();
        if (data.status === "ready" || data.status === "failed") setWaiting(false);
      } catch { /* A later subscription or polling tick retries a transient read. */ } finally { checking = false; }
    };
    const channel = supabase.channel(`detail-${postId}`).on("postgres_changes", {
      event: "UPDATE", schema: "public", table: "posts", filter: `id=eq.${postId}`,
    }, () => { void refresh(); }).subscribe();
    const timer = waiting || ["queued", "processing"].includes(status) ? setInterval(() => { void refresh(); }, 2000) : null;
    return () => { live = false; if (timer) clearInterval(timer); void supabase.removeChannel(channel); };
  }, [postId, status, waiting, router]);

  const scale = photo ? Math.min(width / photo.width, width / photo.height) : 1;
  const offsetX = photo ? (width - photo.width * scale) / 2 : 0;
  const offsetY = photo ? (width - photo.height * scale) / 2 : 0;
  const frame = photo ? { left: offsetX, top: offsetY, width: photo.width * scale, height: photo.height * scale } : {};
  const boxStyle = (box: ItemBox): CSSProperties => ({ left: offsetX + box.left * scale, top: offsetY + box.top * scale,
    width: (box.right - box.left) * scale, height: (box.bottom - box.top) * scale });
  const point = (event: { clientX: number; clientY: number }) => {
    if (!photo || !ref.current) return null;
    const rect = ref.current.getBoundingClientRect();
    const ratio = Math.min(rect.width / photo.width, rect.height / photo.height);
    const x = (event.clientX - rect.left - (rect.width - photo.width * ratio) / 2) / ratio;
    const y = (event.clientY - rect.top - (rect.height - photo.height * ratio) / 2) / ratio;
    return { x: Math.max(0, Math.min(photo.width, x)), y: Math.max(0, Math.min(photo.height, y)) };
  };
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!drawing) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = point(event);
    setDrawBox(null);
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const p = point(event); const a = start.current;
    if (!drawing || !p || !a) return;
    setDrawBox({ left: Math.min(a.x, p.x), top: Math.min(a.y, p.y), right: Math.max(a.x, p.x), bottom: Math.max(a.y, p.y) });
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const a = start.current; const p = point(event); start.current = null;
    if (!drawing || !a || !p) return;
    const box = { left: Math.min(a.x, p.x), top: Math.min(a.y, p.y), right: Math.max(a.x, p.x), bottom: Math.max(a.y, p.y) };
    setDrawing(false); setDrawBox(null);
    setSelection((current) => current ? { ...current, box: box.right - box.left > 1 && box.bottom - box.top > 1 ? box : current.box } : null);
  };
  const add = () => { setDrawing(false); setSelection({ item: null, key: Date.now() }); };
  const totals = sumNutrition(items);
  const showNutrition = initialized && (items.length > 0 || status === "ready");
  return <>
    <div ref={ref} className="relative aspect-square w-full overflow-hidden bg-card" style={{ touchAction: drawing ? "none" : "auto" }}
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
      onPointerCancel={() => { start.current = null; setDrawBox(null); }}
      onClick={(event) => {
        if (!initialized || drawing || !outlines || selection) return;
        const p = point(event); if (!p) return;
        const hit = items.filter((item) => item.box && p.x >= item.box.left && p.x <= item.box.right && p.y >= item.box.top && p.y <= item.box.bottom)
          .sort((a, b) => (a.box!.right - a.box!.left) * (a.box!.bottom - a.box!.top) - (b.box!.right - b.box!.left) * (b.box!.bottom - b.box!.top))[0];
        if (hit) setSelection({ item: hit, key: Date.now() });
      }}>
      {photo ? <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={caption || "Meal photo"} draggable={false} className="h-full w-full object-contain" />
        {outlines && items.map((item, index) => item.box ? <div key={item.id}>
          <Mask url={item.maskUrl} photo={photo} color={outlineColor(index)} frame={frame} fallback={boxStyle(item.box)} />
          <button type="button" disabled={!initialized} aria-label={`Edit ${item.name}`} className="absolute max-w-full rounded-chip py-grid text-label font-semibold text-white"
            style={{ left: offsetX + item.box.left * scale, top: offsetY + item.box.top * scale, paddingLeft: tokens.detail.chipX, paddingRight: tokens.detail.chipX, background: outlineColor(index) }}
            onClick={(event) => { event.stopPropagation(); setSelection({ item, key: Date.now() }); }}>
            {item.name}{item.portion_grams == null ? "" : ` · ${formatGrams(item.portion_grams)}`}
          </button>
        </div> : null)}
        {drawBox ? <div className="pointer-events-none absolute rounded-field border-2 border-text" style={boxStyle(drawBox)} /> : null}
        <button type="button" role="switch" aria-checked={outlines} aria-label="Outlines" className="absolute bottom-sheet-top right-sheet-top flex min-h-tap items-center gap-2 rounded-field bg-overlay px-tooltip-y text-meta text-white"
          onClick={(event) => { event.stopPropagation(); setOutlines((value) => !value); }}>
          Outlines <span className="relative rounded-circle" style={{ width: tokens.detail.switchWidth, height: tokens.detail.switchHeight, background: outlines ? tokens.colors.accent : tokens.colors.muted }}>
            <span className="absolute rounded-circle bg-white" style={{ width: tokens.detail.switchKnob, height: tokens.detail.switchKnob, top: tokens.detail.switchInset, left: outlines ? tokens.detail.switchWidth - tokens.detail.switchKnob - tokens.detail.switchInset : tokens.detail.switchInset }} />
          </span>
        </button>
      </> : showNutrition ? <ResultsCard drink={drink} size={width} time={new Date(eatenAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", ...(localTime ? {} : { timeZone: "UTC" }) })}
        calories={totals.calories} protein={totals.protein_g} carbs={totals.carbs_g} fat={totals.fat_g}
        items={items.map((item) => ({ name: item.name, grams: item.portion_grams == null ? null : toNumber(item.portion_grams) }))} /> : <div role="status" className="flex h-full items-center justify-center px-screen-x text-body text-muted">{status === "failed" ? "This meal could not be analysed." : status === "needs_input" ? "Clarification needed" : "Processing, traffic low"}</div>}
    </div>
    <div className="flex items-start justify-between gap-2 px-screen-x pt-grid">
      <p className="min-w-0 whitespace-pre-wrap break-words text-body">{caption}</p>
      {photo ? <p className="shrink-0 text-meta text-muted">{drawing ? "Drag to draw a box" : "Tap an outline to edit"}</p> : null}
    </div>
    {drawing ? <div className="flex justify-between px-screen-x text-comment"><button className="min-h-tap" onClick={() => { setDrawing(false); setDrawBox(null); setSelection((current) => current ? { ...current, box: undefined } : null); }}>Continue without a box</button><button className="min-h-tap text-muted" onClick={() => { setDrawing(false); setDrawBox(null); }}>Cancel</button></div> : null}
    <ItemRows disabled={!initialized} items={items} onSelect={(item) => setSelection({ item, key: Date.now() })} onAdd={add} />
    {waiting || ["queued", "processing"].includes(status) ? <p role="status" className="px-screen-x text-meta text-muted">Updating nutrition…</p> : null}
    {status === "failed" ? <p role="status" className="px-screen-x text-meta text-muted">Nutrition could not be updated.</p> : null}
    {selection ? <ItemEditSheet key={selection.key} postId={postId} item={selection.item} box={selection.box} open={!drawing}
      color={outlineColor(selection.item ? Math.max(0, items.findIndex((item) => item.id === selection.item!.id)) : items.length)}
      onClose={() => setSelection(null)} onAdd={add}
      onDraw={photo ? () => { setOutlines(true); setDrawing(true); } : undefined}
      onSaved={() => { setSelection(null); setWaiting(true); router.refresh(); void fetch("/api/jobs/tick").catch(() => {}); }} /> : null}
  </>;
}

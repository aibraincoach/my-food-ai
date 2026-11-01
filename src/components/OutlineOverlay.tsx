"use client";
import { unavailableFoods, sumMicronutrients } from "@/lib/nutrition/totals";

import {LocalTime,useLocalTime} from "@/components/LocalTime";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { DetailItem, DetailPhoto, ItemBox } from "@/lib/posts/items";
import { sumNutrition, formatGrams, toNumber } from "@/lib/nutrition/totals";
import { tokens } from "@/lib/theme/tokens";
import { useDrinkCard } from "@/components/useDrinkCard";
import { ResultsCard } from "@/components/ResultsCard";
import ItemRows, { outlineColor } from "@/components/ItemRows";
import ItemEditSheet from "@/components/ItemEditSheet";
import NutritionSummary from "@/components/NutritionSummary";
import NutritionTable from "@/components/NutritionTable";
import PostActions from "@/components/PostActions";
import PostCaption from "@/components/PostCaption";
import {usePostHandle} from "@/components/PostHandle";
import type {ReactNode} from "react";

export function DetailDate({ value, weekday = false }: { value: string; weekday?: boolean }) {
  return <LocalTime value={value} weekday={weekday} />;
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

export default function OutlineOverlay({ initialized, readOnly = false, postId, caption, eatenAt, status, photo, items, modelCommentId=null, fingerprint=null, saved=false, handle:providedHandle, children }: {
  initialized: boolean; readOnly?: boolean; postId: string; caption: string; eatenAt: string; status: string; photo: DetailPhoto | null; items: DetailItem[]; modelCommentId?:string|null; fingerprint?:string|null; saved?:boolean; handle?:string; children?:ReactNode;
}) {
  const router = useRouter();
  const handle=usePostHandle(providedHandle);
  const [expandedPhoto,setExpandedPhoto]=useState(false);
  const [expandedNutrition,setExpandedNutrition]=useState(false);
  const drink = useDrinkCard(postId, status, eatenAt);
  const localTime = useLocalTime(eatenAt);
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

  const height=photo?(expandedPhoto?width:230):width;
  const scale = photo ? Math.max(width / photo.width, height / photo.height) : 1;
  const offsetX = photo ? (width - photo.width * scale) / 2 : 0;
  const offsetY = photo ? (height - photo.height * scale) / 2 : 0;
  const frame = photo ? { left: offsetX, top: offsetY, width: photo.width * scale, height: photo.height * scale } : {};
  const boxStyle = (box: ItemBox): CSSProperties => ({ left: offsetX + box.left * scale, top: offsetY + box.top * scale,
    width: (box.right - box.left) * scale, height: (box.bottom - box.top) * scale });
  const point = (event: { clientX: number; clientY: number }) => {
    if (!photo || !ref.current) return null;
    const rect = ref.current.getBoundingClientRect();
    const ratio = Math.max(rect.width / photo.width, rect.height / photo.height);
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
    <div ref={ref} className="relative w-full overflow-hidden bg-card" style={{ height, touchAction: drawing ? "none" : "auto" }}
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
      onPointerCancel={() => { start.current = null; setDrawBox(null); }}
      onClick={(event) => {
        if (drawing || selection) return;
        if(readOnly || !initialized || !outlines){setExpandedPhoto(value=>!value);return;}
        const p = point(event); if (!p) return;
        const hit = items.filter((item) => item.box && p.x >= item.box.left && p.x <= item.box.right && p.y >= item.box.top && p.y <= item.box.bottom)
          .sort((a, b) => (a.box!.right - a.box!.left) * (a.box!.bottom - a.box!.top) - (b.box!.right - b.box!.left) * (b.box!.bottom - b.box!.top))[0];
        if (hit) setSelection({ item: hit, key: Date.now() });
        else setExpandedPhoto(value=>!value);
      }}>
      {photo ? <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={caption || "Meal photo"} draggable={false} className="h-full w-full object-cover" />
        {outlines && items.map((item, index) => item.box ? <div key={item.id}>
          <Mask url={item.maskUrl} photo={photo} color={outlineColor(index)} frame={frame} fallback={boxStyle(item.box)} />
          <button type="button" disabled={!initialized || readOnly} aria-label={`Edit ${item.name}`} className="absolute max-w-full rounded-chip py-grid text-label font-semibold text-white"
            style={{ left: offsetX + item.box.left * scale, top: offsetY + item.box.top * scale, paddingLeft: tokens.detail.chipX, paddingRight: tokens.detail.chipX, background: outlineColor(index) }}
            onClick={(event) => { event.stopPropagation(); setSelection({ item, key: Date.now() }); }}>
            {item.name}{item.portion_grams == null ? "" : ` · ${formatGrams(item.portion_grams)}`}
          </button>
        </div> : null)}
        {drawBox ? <div className="pointer-events-none absolute rounded-field border-2 border-text" style={boxStyle(drawBox)} /> : null}
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-field bg-overlay px-[10px] py-[5px] text-meta text-white">Outlines · tap one to edit</span>
      </> : showNutrition ? <ResultsCard unavailable={unavailableFoods(totals)} drink={drink} size={width} time={localTime}
        calories={totals.calories} protein={totals.protein_g} carbs={totals.carbs_g} fat={totals.fat_g}
        items={items.map((item) => ({ name: item.name, grams: item.portion_grams == null ? null : toNumber(item.portion_grams) }))} /> : <div role="status" className="flex h-full items-center justify-center px-screen-x text-body text-muted">{status === "failed" ? "This meal could not be analysed." : status === "needs_input" ? "Clarification needed" : "Processing, traffic low"}</div>}
    </div>
    <PostActions detail postId={postId} modelCommentId={modelCommentId} fingerprint={fingerprint} drink={readOnly} saved={saved}/>
    <div className="px-inset"><PostCaption handle={handle} caption={caption}/></div>
    {showNutrition&&<>
      <NutritionSummary items={items}/>
      <button type="button" onClick={()=>setExpandedNutrition(value=>!value)} aria-expanded={expandedNutrition} aria-controls={`all-nutrients-${postId}`} className="flex min-h-tap w-full items-center justify-between gap-2 px-inset pt-[10px] text-detail">
        <span className="text-muted">Consumed · all nutrients</span><span className="flex items-center gap-1 font-medium">{expandedNutrition?'Show less':`Show all ${7+sumMicronutrients(items).length}`} <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className={expandedNutrition?'rotate-180':''} aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></span>
      </button>
      {children}
      {expandedNutrition&&<div id={`all-nutrients-${postId}`}>
        {drawing&&<div className="flex justify-between px-inset text-comment"><button className="min-h-tap" onClick={()=>{setDrawing(false);setDrawBox(null);setSelection(current=>current?{...current,box:undefined}:null);}}>Continue without a box</button><button className="min-h-tap text-muted" onClick={()=>{setDrawing(false);setDrawBox(null);}}>Cancel</button></div>}
        <ItemRows disabled={!initialized||readOnly} items={items} onSelect={item=>setSelection({item,key:Date.now()})} onAdd={add}/>
        <NutritionTable items={items}/>
      </div>}
    </>}
    {waiting || ["queued", "processing"].includes(status) ? <p role="status" className="px-screen-x text-meta text-muted">Updating nutrition…</p> : null}
    {status === "failed" ? <p role="status" className="px-screen-x text-meta text-muted">Nutrition could not be updated.</p> : null}
    {selection ? <ItemEditSheet key={selection.key} postId={postId} item={selection.item} box={selection.box} open={!drawing}
      color={outlineColor(selection.item ? Math.max(0, items.findIndex((item) => item.id === selection.item!.id)) : items.length)}
      onClose={() => setSelection(null)} onAdd={add}
      onDraw={photo ? () => { setOutlines(true); setDrawing(true); } : undefined}
      onSaved={() => { setSelection(null); setWaiting(true); router.refresh(); void fetch("/api/jobs/tick").catch(() => {}); }} /> : null}
  </>;
}

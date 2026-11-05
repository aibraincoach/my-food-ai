/* eslint-disable @next/next/no-img-element -- Private signed photos bypass public image optimization. */
"use client";
import {imageIdentity} from '@/lib/media/retained-image';
import {feedPhotoSrcSet} from '@/lib/posts/feed-photo-url';
import {desktopPhotoVars,photoBoxStyle} from '@/lib/media/photo-box';
import {alcoholGrams,isAlcoholic} from '@/lib/intake/alcohol';
import { nutritionTableRows } from "@/lib/nutrition/table";

import {LocalTime,useLocalTime} from "@/components/LocalTime";
import { Fragment, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { DetailItem, DetailPhoto, ItemBox } from "@/lib/posts/items";
import { formatGrams } from "@/lib/nutrition/totals";
import { tokens } from "@/lib/theme/tokens";
import { useDrinkCard } from "@/components/useDrinkCard";
import { cardDataFromRow, type CardData } from "@/lib/pipeline/card-data";
import type { DrinkCardData } from "@/lib/intake/hydration";
import { ARROW_GUTTER, ResultsCard } from "@/components/ResultsCard";
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

const ORIGINAL_CACHE_TTL_MS = 3_300_000;
function readOriginalCache(key: string): string | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { url?: string; expiresAt?: number };
    if (!parsed.url || typeof parsed.expiresAt !== "number" || parsed.expiresAt <= Date.now()) {
      try { sessionStorage.removeItem(key); } catch { /* treat as missing */ }
      return null;
    }
    return parsed.url;
  } catch {
    try { sessionStorage.removeItem(key); } catch { /* treat as missing */ }
    return null;
  }
}
function writeOriginalCache(key: string, url: string, signedExpiresAt?: number) {
  const expiresAt = typeof signedExpiresAt === "number" ? signedExpiresAt - 300_000 : Date.now() + ORIGINAL_CACHE_TTL_MS;
  sessionStorage.setItem(key, JSON.stringify({ url, expiresAt }));
}

function DetailImage({ photo, alt, sharp = false }: { photo: DetailPhoto; alt: string; sharp?: boolean }) {
  const cacheKey = photo.id ? `mfa-original-${photo.id}` : null;
  const preview = photo.previewUrl ?? photo.url;
  const [originalUrl, setOriginalUrl] = useState<string | null>(() => (sharp && cacheKey && typeof sessionStorage !== "undefined" ? readOriginalCache(cacheKey) : null));
  const [reloadOriginal, setReloadOriginal] = useState(0);
  const src = sharp && originalUrl ? originalUrl : preview;
  const [failedSharp, setFailedSharp] = useState<string | null>(null);
  useEffect(() => {
    if (!sharp || !photo.previewUrl) return;
    const cached = cacheKey ? readOriginalCache(cacheKey) : null;
    if (cached) { setOriginalUrl(cached); return; }
    let live = true;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (!live) return;
      setOriginalUrl(photo.url);
      if (cacheKey) writeOriginalCache(cacheKey, photo.url, photo.expiresAt);
    };
    image.src = photo.url;
    return () => { live = false; };
  }, [sharp, photo.url, photo.previewUrl, cacheKey, reloadOriginal]);
  return <img src={src} srcSet={failedSharp !== imageIdentity(src) && src === preview ? feedPhotoSrcSet(src) : undefined} onError={() => {
    if (sharp && originalUrl && cacheKey) {
      try { sessionStorage.removeItem(cacheKey); } catch { /* ignore */ }
      setOriginalUrl(null);
      setReloadOriginal(n => n + 1);
      return;
    }
    if (cacheKey) { try { sessionStorage.removeItem(cacheKey); } catch { /* ignore */ } }
    setOriginalUrl(null);
    setFailedSharp(imageIdentity(src));
  }} crossOrigin="anonymous" alt={alt} draggable={false} className="h-full w-full object-contain" />;
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

export default function OutlineOverlay({ desktopModal=false, desktopHeader, desktopThread, slides=[], initialized, readOnly = false, postId, caption, eatenAt, status, photo, items, modelCommentId=null, fingerprint=null, saved=false, handle:providedHandle, cardData, initialDrink, children }: {
  desktopModal?:boolean; desktopHeader?:ReactNode; desktopThread?:ReactNode; slides?:import('@/lib/posts/items').DetailSlide[];
  cardData?: CardData; initialDrink?: DrinkCardData|null;
  initialized: boolean; readOnly?: boolean; postId: string; caption: string; eatenAt: string; status: string; photo: DetailPhoto | null; items: DetailItem[]; modelCommentId?:string|null; fingerprint?:string|null; saved?:boolean; handle?:string; children?:ReactNode;
}) {
  const router = useRouter();
  const handle=usePostHandle(providedHandle);
  const [slide,setSlide]=useState(0);
  const visibleSlides=desktopModal?slides:slides.filter(entry=>entry.kind==='photo');
  const selectedIndex=Math.min(slide,Math.max(0,visibleSlides.length-1));
  const selectedSlide=visibleSlides[selectedIndex];
  const activePhoto:DetailPhoto|null=selectedIndex>0&&selectedSlide?.kind==='photo'
    ? {id:selectedSlide.id,url:selectedSlide.url,previewUrl:selectedSlide.previewUrl,width:selectedSlide.width??1,height:selectedSlide.height??1,not_eaten:selectedSlide.not_eaten}:photo;
  useEffect(()=>{if(!desktopModal)return;const key=(event:KeyboardEvent)=>{if(event.defaultPrevented||((event.target as HTMLElement)?.closest('input,textarea,select,[contenteditable="true"]')||((event.target as HTMLElement)?.closest('[role="dialog"]')&&!((event.target as HTMLElement).closest('[role="dialog"]')?.classList.contains('desktop-post-dialog')))))return;const step=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;if(step){event.preventDefault();setSlide(value=>Math.max(0,Math.min(Math.max(0,slides.length-1),value+step)));}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[desktopModal,slides.length]);
  const [expandedNutrition,setExpandedNutrition]=useState(false);
  const drink = useDrinkCard(postId, status, eatenAt, initialDrink);
  const wholePhoto = Boolean(activePhoto) && !desktopModal && (!drink || drink.source === 'item');
  const localTime = useLocalTime(eatenAt);
  const ref = useRef<HTMLDivElement>(null);
  const [frameHeight,setFrameHeight]=useState(photo?Math.round(tokens.spacing.phone*photo.height/photo.width):640);
  const [width, setWidth] = useState<number>(tokens.spacing.phone);
  const [outlines, setOutlines] = useState(true);
  const [selection, setSelection] = useState<{ item: DetailItem | null; box?: ItemBox; key: number } | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawBox, setDrawBox] = useState<ItemBox | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [waiting, setWaiting] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => { if (entry.contentRect.width) setWidth(entry.contentRect.width); if((desktopModal||wholePhoto)&&entry.contentRect.height)setFrameHeight(entry.contentRect.height); });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [desktopModal,wholePhoto]);
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
    const poll = waiting || ["queued", "processing"].includes(status);
    let delay = 2000;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const tick = () => {
      if (!live) return;
      if (document.visibilityState === "visible") void refresh();
      delay = Math.min(30000, delay * 2);
      timer = setTimeout(tick, delay);
    };
    if (poll) timer = setTimeout(tick, delay);
    return () => { live = false; if (timer) clearTimeout(timer); void supabase.removeChannel(channel); };
  }, [postId, status, waiting, router]);

  const height=desktopModal||wholePhoto?frameHeight:width;
  const scale = photo ? Math.min(width / photo.width, height / photo.height) : 1;
  const offsetX = photo ? (width - photo.width * scale) / 2 : 0;
  const offsetY = photo ? (height - photo.height * scale) / 2 : 0;
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
  const displayCard = drink ? { ...cardDataFromRow({ items, eatenAt, drink }), footer: cardData?.footer }
    : cardData ?? cardDataFromRow({ items, eatenAt });
  const showNutrition = initialized && (items.length > 0 || status === "ready");
  const Container=desktopModal?"div":Fragment;
  return <Container {...(desktopModal?{className:"desktop-post-content",style:desktopPhotoVars(activePhoto)}:{})}>
    <div ref={ref} className="relative w-full overflow-hidden bg-card" style={{ ...(wholePhoto&&activePhoto?photoBoxStyle(activePhoto):{height}), touchAction: drawing ? "none" : "auto" }}
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
      onPointerCancel={() => { start.current = null; setDrawBox(null); }}
      onClick={(event) => {
        if(selectedIndex>0)return;
        if (drawing || selection) return;
        if(readOnly || !initialized || !outlines)return;
        const p = point(event); if (!p) return;
        const hit = items.filter((item) => item.box && p.x >= item.box.left && p.x <= item.box.right && p.y >= item.box.top && p.y <= item.box.bottom)
          .sort((a, b) => (a.box!.right - a.box!.left) * (a.box!.bottom - a.box!.top) - (b.box!.right - b.box!.left) * (b.box!.bottom - b.box!.top))[0];
        if (hit) setSelection({ item: hit, key: Date.now() });
      }}>
      {selectedIndex>0 ? selectedSlide?.kind==='photo'&&activePhoto?<DetailImage key={selectedSlide.id??selectedSlide.url} photo={activePhoto} alt={selectedSlide.not_eaten?'Leftovers':`Meal photo ${selectedIndex+1}`}/>:<ResultsCard data={displayCard} size={width} time={localTime}/> : photo && (!drink || drink.source === 'item') ? <>
        <DetailImage photo={photo} alt={caption || "Meal photo"} sharp={outlines || drawing} />
        {outlines && items.map((item, index) => item.box ? <div key={item.id}>
          <Mask url={outlines ? item.maskUrl : null} photo={photo} color={outlineColor(index)} frame={frame} fallback={boxStyle(item.box)} />
          <button type="button" disabled={!initialized || readOnly} aria-label={`Edit ${item.name}`} className="absolute max-w-full rounded-chip py-grid text-label font-semibold text-white"
            style={{ left: offsetX + item.box.left * scale, top: offsetY + item.box.top * scale, paddingLeft: tokens.detail.chipX, paddingRight: tokens.detail.chipX, background: outlineColor(index) }}
            onClick={(event) => { event.stopPropagation(); setSelection({ item, key: Date.now() }); }}>
            {item.name}{isAlcoholic(item) ? (alcoholGrams(item.micronutrients)>0 ? ` · ${Math.round(alcoholGrams(item.micronutrients))} g alcohol` : " · alcohol unavailable") : item.portion_grams == null ? "" : ` · ${formatGrams(item.portion_grams)}`}
          </button>
        </div> : null)}
        {drawBox ? <div className="pointer-events-none absolute rounded-field border-2 border-text" style={boxStyle(drawBox)} /> : null}
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-field bg-overlay px-[10px] py-[5px] text-meta text-white">Outlines · tap one to edit</span>
      </> : showNutrition ? <ResultsCard data={displayCard} size={width} time={localTime} gutter={visibleSlides.length>1?ARROW_GUTTER:0} /> : <div role="status" className="flex h-full items-center justify-center px-screen-x text-body text-muted">{status === "failed" ? "This meal could not be analysed." : status === "needs_input" ? "A question about this meal" : "Processing, traffic low"}</div>}
      {visibleSlides.length>1&&<><button type="button" aria-label="Previous slide" disabled={selectedIndex===0} onClick={event=>{event.stopPropagation();setSlide(Math.max(0,selectedIndex-1));}} className="absolute left-3 top-1/2 size-9 rounded-circle bg-white/90 text-[24px] text-text disabled:invisible">‹</button><button type="button" aria-label="Next slide" disabled={selectedIndex>=visibleSlides.length-1} onClick={event=>{event.stopPropagation();setSlide(Math.min(Math.max(0,visibleSlides.length-1),selectedIndex+1));}} className="absolute right-3 top-1/2 size-9 rounded-circle bg-white/90 text-[24px] text-text disabled:invisible">›</button><span className="absolute right-3 top-3 rounded-pill bg-overlay px-2 py-1 text-meta text-white">{selectedIndex+1}/{Math.max(1,visibleSlides.length)}</span></>}
    </div>
    <Container {...(desktopModal?{className:"desktop-post-record"}:{})}>
    {desktopModal&&desktopHeader}
    <Container {...(desktopModal?{className:"desktop-post-scroll"}:{})}>
    <Container {...(desktopModal?{className:"desktop-post-actions"}:{})}><PostActions detail status={status} postId={postId} modelCommentId={modelCommentId} fingerprint={fingerprint} drink={readOnly} saved={saved}/></Container>
    <div className="px-inset"><PostCaption postId={postId} handle={handle} caption={caption}/></div>
    {showNutrition&&<>
      <NutritionSummary items={items}/>
      {desktopModal&&<ItemRows disabled={!initialized||readOnly} items={items} onSelect={item=>setSelection({item,key:Date.now()})} onAdd={add}/>}
      <button type="button" onClick={()=>setExpandedNutrition(value=>!value)} aria-expanded={expandedNutrition} aria-controls={`all-nutrients-${postId}`} className="flex min-h-tap w-full items-center justify-between gap-2 px-inset pt-[10px] text-detail">
        <span className="text-muted">Consumed · all nutrients</span><span className="flex items-center gap-1 font-medium">{expandedNutrition?'Show less':`Show all ${nutritionTableRows(items).length}`} <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className={expandedNutrition?'rotate-180':''} aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></span>
      </button>
      {children}
      {expandedNutrition&&<div id={`all-nutrients-${postId}`}>
        {drawing&&<div className="flex justify-between px-inset text-comment"><button className="min-h-tap" onClick={()=>{setDrawing(false);setDrawBox(null);setSelection(current=>current?{...current,box:undefined}:null);}}>Continue without a box</button><button className="min-h-tap text-muted" onClick={()=>{setDrawing(false);setDrawBox(null);}}>Cancel</button></div>}
        {!desktopModal&&<ItemRows disabled={!initialized||readOnly} items={items} onSelect={item=>setSelection({item,key:Date.now()})} onAdd={add}/>}
        <NutritionTable items={items}/>
      </div>}
    </>}
    {waiting || ["queued", "processing"].includes(status) ? <p role="status" className="px-screen-x text-meta text-muted">Updating nutrition…</p> : null}
    {status === "failed" ? <p role="status" className="px-screen-x text-meta text-muted">Nutrition could not be updated.</p> : null}
    </Container>
    {desktopModal&&desktopThread}
    </Container>
    {selection ? <ItemEditSheet key={selection.key} postId={postId} item={selection.item} box={selection.box} open={!drawing}
      color={outlineColor(selection.item ? Math.max(0, items.findIndex((item) => item.id === selection.item!.id)) : items.length)}
      onClose={() => setSelection(null)} onAdd={add}
      onDraw={photo ? () => { setOutlines(true); setDrawing(true); } : undefined}
      onSaved={() => { setSelection(null); setWaiting(true); router.refresh(); void fetch("/api/jobs/tick").catch(() => {}); }} /> : null}
  </Container>;
}

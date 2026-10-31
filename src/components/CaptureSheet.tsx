"use client";
import { PackPhotoUpload } from "@/lib/media/pack-photo-upload";

import { decodeBarcode, decodeBarcodeFile, loadBarcodeDecoder } from "@/components/BarcodeScanner";
import { barcodeAmounts, amountInBasis, packageAmount, type BarcodeProduct } from "@/lib/fdc/barcode-product";
import { formatNutrition } from "@/lib/nutrition/totals";
import FirstRunHint from "@/components/FirstRunHint";
import FoodSearchPanel from "@/components/FoodSearchPanel";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { TopBar } from "@/components/ui/TopBar";
import { requestLocation } from "@/lib/location/capture";
import { openCamera, grabFrame, CameraFlipError, type Camera } from "@/lib/media/camera";
import { createPost, PostUploadDraft } from "@/lib/posts/create";
import { fromLocalInput, toLocalInput } from "@/lib/posts/eaten-at";
import { tokens } from "@/lib/theme/tokens";

type Shot = { file: File; previewUrl: string };
const MAX_SHOTS = 8;

const FLIP_ERROR = "Could not switch cameras. Try again.";

export type CaptureMode = "photo" | "text" | "barcode";
export default function CaptureSheet({ onClose, initialMode = "photo" }: { onClose: () => void; initialMode?: CaptureMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<CaptureMode>(initialMode);
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [barcodeState, setBarcodeState] = useState<"idle" | "looking" | "missing" | "found" | "error">("idle");
  const [packPhoto, setPackPhoto] = useState<Shot | null>(null);
  const packPhotoRef = useRef<Shot | null>(null);
  const [portion, setPortion] = useState(100);
  const lookupRef = useRef(0);
  const scanBusy = useRef(false);
  const rejectedCode = useRef<{ code: string; lastSeen: number } | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const shotsRef = useRef<Shot[]>([]);
  const ordinaryUploadRef = useRef<PostUploadDraft | null>(null);
  const selectedPhotoRef = useRef(false);
  const pendingFilesRef = useRef<File[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveCameraRef = useRef<Camera | null>(null);
  const mountedRef = useRef(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const postingRef = useRef(false);
  const [shots, setShots] = useState<Shot[]>([]);
  const [caption, setCaption] = useState("");
  // null means Now; otherwise the datetime-local value (the reader's local wall-clock time) the meal was eaten.
  const [when, setWhen] = useState<string | null>(null);
  const [searchingFoods, setSearchingFoods] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findBarcode = useCallback(async (code: string, file: File) => {
    const mine = ++lookupRef.current;
    if (packPhotoRef.current) URL.revokeObjectURL(packPhotoRef.current.previewUrl);
    const shot = { file, previewUrl: URL.createObjectURL(file) };
    packPhotoRef.current = shot; setPackPhoto(shot);
    setBarcodeState("looking"); setProduct(null); setError(null);
    try {
      const response = await fetch(`/api/fdc/barcode?code=${encodeURIComponent(code)}`);
      const result = await response.json();
      if (!mountedRef.current || mine !== lookupRef.current) return;
      if (response.status === 404) { setBarcodeState("missing"); return; }
      if (!response.ok || !result.product) throw new Error("Barcode lookup is temporarily unavailable.");
      const next = result.product as BarcodeProduct;
      const serving = next.servingSize && next.servingSizeUnit ? amountInBasis(next.servingSize, next.servingSizeUnit, next.basisUnit) : null;
      setPortion(serving ?? 100); setProduct(next); setBarcodeState("found");
    } catch {
      if (mountedRef.current && mine === lookupRef.current) { setBarcodeState("error"); setError("Barcode lookup is temporarily unavailable. Try again."); }
    }
  }, [setError]);

  const dismissBarcode = () => {
    if (postingRef.current) return;
    lookupRef.current += 1;
    setProduct(null); setBarcodeState("idle"); setPackPhoto(null); setError(null);
    if (packPhotoRef.current) URL.revokeObjectURL(packPhotoRef.current.previewUrl);
    packPhotoRef.current = null;
    if (!shotsRef.current.length && !pendingFilesRef.current.length) selectedPhotoRef.current = false;
  };

  const cameraEnabled = mode !== "text";
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    if (!cameraEnabled) return () => { cancelled = true; mountedRef.current = false; };
    void loadBarcodeDecoder();
    void openCamera("environment").then((camera) => {
      if (cancelled) { camera.close(); return; }
      liveCameraRef.current = camera;
      setCameraUnavailable(false); setStream(camera.stream);
    }).catch(() => { if (!cancelled) setCameraUnavailable(true); });
    return () => {
      cancelled = true;
      mountedRef.current = false;
      liveCameraRef.current?.close();
      liveCameraRef.current = null;
    };
  }, [cameraEnabled]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    let cancelled = false;
    video.srcObject = stream;
    void video.play().catch(() => {
      if (cancelled) return;
      liveCameraRef.current?.close();
      liveCameraRef.current = null;
      setStream(null); setCameraUnavailable(true);
    });
    return () => { cancelled = true; video.srcObject = null; };
  }, [stream]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (initialMode === "text") document.getElementById("capture-caption")?.focus();
    else closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !postingRef.current) onClose();
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([type="file"]):not([disabled]), a[href]'
      );
      const first = controls?.[0];
      const last = controls?.[controls.length - 1];
      if (!first || !last) {
        event.preventDefault();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [onClose, initialMode]);

  useEffect(() => () => {
    lookupRef.current += 1;
    if (packPhotoRef.current) URL.revokeObjectURL(packPhotoRef.current.previewUrl);
    for (const shot of shotsRef.current) URL.revokeObjectURL(shot.previewUrl);
  }, []);

  useEffect(() => {
    if (mode !== "barcode" || !stream) return;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      if (cancelled || scanBusy.current || !videoRef.current || postingRef.current) return;
      scanBusy.current = true;
      try {
        const code = await decodeBarcode(videoRef.current);
        if (cancelled) return;
        if (!code) return;
        const previous = rejectedCode.current;
        const now = Date.now();
        const suppressed = previous?.code === code && now - previous.lastSeen < 2000;
        rejectedCode.current = { code, lastSeen: now };
        if (barcodeState !== "idle" || suppressed) return;
        const blob = await grabFrame(videoRef.current);
        if (!cancelled) void findBarcode(code, new File([blob], "pack.jpg", { type: "image/jpeg" }));
      } catch { /* An unreadable frame is retried on the next interval. */ }
      finally { scanBusy.current = false; }
    }, 300);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [mode, barcodeState, stream, findBarcode]);

  const addFiles = async (files: FileList | File[] | null) => {
    if (!files || postingRef.current) return;
    if (Array.from(files).length) selectedPhotoRef.current = true;
    pendingFilesRef.current.push(...Array.from(files).slice(0, Math.max(0, MAX_SHOTS - shotsRef.current.length - pendingFilesRef.current.length)));
    setPendingCount(pendingFilesRef.current.length);
    if (scanBusy.current) return;
    scanBusy.current = true; setCameraBusy(true);
    try {
      while (pendingFilesRef.current.length && shotsRef.current.length < MAX_SHOTS) {
        // Keep the in-flight file in the queue so another selection cannot exceed capacity.
        const file = pendingFilesRef.current[0];
        // A single bounded decode precedes all uploads, including library photos in text mode.
        let deadline: ReturnType<typeof setTimeout> | undefined;
        let code: string | null;
        try {
          code = await Promise.race([decodeBarcodeFile(file), new Promise<null>((resolve) => { deadline = setTimeout(() => resolve(null), 900); })]).finally(() => clearTimeout(deadline));
        } catch {
          if (mountedRef.current) setError("Could not read that photo. Your selected photos were kept; try again.");
          return;
        }
        if (!mountedRef.current) return;
        if (code) {
          pendingFilesRef.current.shift(); setPendingCount(pendingFilesRef.current.length);
          await findBarcode(code, file);
          return;
        }
        shotsRef.current = [...shotsRef.current, { file, previewUrl: URL.createObjectURL(file) }];
        pendingFilesRef.current.shift(); setPendingCount(pendingFilesRef.current.length);
        setShots(shotsRef.current);
      }
    } catch { if (mountedRef.current) setError("Could not read that photo. Choose another photo."); }
    finally { scanBusy.current = false; if (mountedRef.current) setCameraBusy(false); }
  };

  const takePhoto = async () => {
    if (postingRef.current || cameraBusy || shotsRef.current.length >= MAX_SHOTS) return;
    if (!stream || !videoRef.current) { cameraRef.current?.click(); return; }
    setCameraBusy(true);
    try {
      const blob = await grabFrame(videoRef.current);
      if (mountedRef.current) await addFiles([new File([blob], "meal.jpg", { type: "image/jpeg" })]);
    } catch {
      if (mountedRef.current) setError("Could not capture a photo. Try again or choose one from the gallery.");
    } finally { if (mountedRef.current) setCameraBusy(false); }
  };

  const flipCamera = async () => {
    if (cameraBusy || postingRef.current || !liveCameraRef.current) return;
    setCameraBusy(true);
    // Only this message is cleared on a new attempt; capture and posting errors stay.
    setError((current) => (current === FLIP_ERROR ? null : current));
    try {
      const next = await liveCameraRef.current.flip();
      if (mountedRef.current) setStream(next);
    } catch (e) {
      if (e instanceof CameraFlipError) {
        // A reopened previous camera replaces the stream the preview was showing.
        if (mountedRef.current) { if (e.stream) setStream(e.stream); setError(FLIP_ERROR); }
      } else {
        liveCameraRef.current?.close();
        liveCameraRef.current = null;
        if (mountedRef.current) setStream(null);
      }
    } finally { if (mountedRef.current) setCameraBusy(false); }
  };

  const removeShot = (index: number) => {
    if (postingRef.current) return;
    const shot = shotsRef.current[index];
    if (!shot) return;
    URL.revokeObjectURL(shot.previewUrl);
    shotsRef.current = shotsRef.current.filter((_, i) => i !== index);
    setShots(shotsRef.current);
    if (!shotsRef.current.length && !pendingFilesRef.current.length) selectedPhotoRef.current = false;
  };

  const post = async () => {
    if (postingRef.current || cameraBusy || pendingFilesRef.current.length > 0 || (!caption.trim() && shotsRef.current.length === 0)) return;
    postingRef.current = true;
    setPosting(true);
    setError(null);
    try {
      const location = await requestLocation();
      const eatenAt = when === null ? null : fromLocalInput(when);
      if (when !== null && !eatenAt) throw new Error("Choose a time that is not in the future.");
      ordinaryUploadRef.current ??= new PostUploadDraft();
      const { postId } = await createPost(caption, shotsRef.current.map((shot) => shot.file), location, eatenAt, ordinaryUploadRef.current, selectedPhotoRef.current ? "photo" : "text");
      // Uploads are complete. Home can fetch the complete card even if its
      // Realtime INSERT event arrived before the files or was never delivered.
      window.dispatchEvent(new CustomEvent("post-created", { detail: { id: postId } }));
      onClose();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Posting failed.");
    } finally {
      postingRef.current = false;
      setPosting(false);
    }
  };

  const packUploadRef = useRef<PackPhotoUpload | null>(null);
  const postBarcode = async () => {
    if (postingRef.current || !product || !packPhotoRef.current) return;
    postingRef.current = true; setPosting(true); setError(null);
    try {
      packUploadRef.current ??= new PackPhotoUpload();
      const photo = await packUploadRef.current.prepare(packPhotoRef.current.file);
      const response = await fetch("/api/posts/food", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gtin: product.gtin, amount: portion, unit: product.basisUnit,
        ...(when === null ? {} : { eaten_at: fromLocalInput(when) }), photo }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "The meal could not be saved.");
      window.dispatchEvent(new CustomEvent("post-created", { detail: { id: result.post_id } }));
      if (pendingFilesRef.current.length || shotsRef.current.length) {
        // A multi-selection is retained until the user explicitly continues it.
        postingRef.current = false; dismissBarcode(); setStream(null); setMode("text");
        window.setTimeout(() => document.getElementById("capture-caption")?.focus(), 0);
      } else onClose();
      router.refresh();
    } catch (error) { if (mountedRef.current) setError(error instanceof Error ? error.message : "The meal could not be saved."); }
    finally { postingRef.current = false; if (mountedRef.current) setPosting(false); }
  };

  const latest = shots[shots.length - 1];
  const full = shots.length >= MAX_SHOTS;
  const switchMode = (next: CaptureMode) => { if (!postingRef.current && next !== mode) { dismissBarcode(); if ((mode === "text") !== (next === "text")) setStream(null); setMode(next); } };
  const continueSelected = async () => {
    if (postingRef.current) return;
    if (mode === "barcode") switchMode("text");
    // A live frame may be finishing as the control is pressed. Keep the file selection intact.
    while (scanBusy.current && mountedRef.current) await new Promise((resolve) => window.setTimeout(resolve, 50));
    if (mountedRef.current) await addFiles([]);
  };
  const pack = product ? packageAmount(product) : null;
  const amountLabel = (amount: number) => product?.basisUnit === "ml" && amount >= 1000 && amount % 1000 === 0 ? `${amount / 1000} l` : `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(amount)} ${product?.basisUnit ?? "g"}`;
  const value = (key: "calories" | "protein_g" | "carbs_g" | "fat_g", amount: number) => {
    const nutrient = product?.per100g[key];
    return nutrient === null || nutrient === undefined ? "–" : formatNutrition(nutrient * amount / 100);
  };
  const macros = (amount: number) => `${value("calories", amount)} kcal · ${value("protein_g", amount)} g protein · ${value("carbs_g", amount)} g carbs · ${value("fat_g", amount)} g fat`;


  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="capture-title" className="fixed inset-0 z-50 overflow-y-auto bg-camera text-surface">
      <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col">
        <TopBar
          title={<span id="capture-title">New post</span>}
          left={<button ref={closeRef} type="button" onClick={onClose} disabled={posting} aria-label="Close capture" className="flex size-tap items-center justify-start disabled:opacity-50"><Icon name="close" /></button>}
          right={<span className="w-tap" aria-hidden="true" />}
        />
        {mode !== "text" && <><div className="relative flex shrink-0 items-center justify-center overflow-hidden bg-camera text-camera-muted" style={{ height: tokens.capture.previewHeight, marginTop: tokens.capture.previewTop }}>
          {stream ? <video ref={videoRef} muted playsInline autoPlay aria-label="Live camera viewfinder" className="h-full w-full object-cover" /> : latest ? (
            // Local blob previews require no remote image transformation.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={latest.previewUrl} alt="Latest meal photo" className="h-full w-full object-cover" />
          ) : <Icon name="camera" />}
          {mode === "barcode" && <>
            <div className="pointer-events-none absolute" style={{ width: tokens.spacing['macro-gap'] * 10, height: tokens.spacing['macro-gap'] * 5, top: tokens.capture.previewHeight / 2 - tokens.spacing['macro-gap'] * 2.5 }}>
              {(["tl", "tr", "bl", "br"] as const).map((corner) => <span key={corner} className="absolute border-surface" style={{ width: tokens.spacing['macro-gap'], height: tokens.spacing['macro-gap'],
                ...(corner.includes("t") ? { top: 0, borderTopWidth: tokens.icon.strongStroke + tokens.border.hairline / 2 } : { bottom: 0, borderBottomWidth: tokens.icon.strongStroke + tokens.border.hairline / 2 }),
                ...(corner.includes("l") ? { left: 0, borderLeftWidth: tokens.icon.strongStroke + tokens.border.hairline / 2 } : { right: 0, borderRightWidth: tokens.icon.strongStroke + tokens.border.hairline / 2 }), borderRadius: corner === "tl" ? `${tokens.radii.chip}px 0 0 0` : corner === "tr" ? `0 ${tokens.radii.chip}px 0 0` : corner === "bl" ? `0 0 0 ${tokens.radii.chip}px` : `0 0 ${tokens.radii.chip}px 0` }} />)}
              <span className="absolute top-1/2 bg-accent" style={{ height: tokens.icon.strongStroke, left: tokens.spacing['field-x'], right: tokens.spacing['field-x'], boxShadow: `0 0 ${tokens.spacing['sheet-top']}px ${tokens.colors.accent}` }} />
            </div>
            <p className="absolute bottom-icon-small rounded-tile bg-overlay-dark px-tooltip-caret py-tooltip-offset text-detail text-surface">Hold the barcode inside the frame</p>
          </>}
        </div>
        <div className="flex justify-center pt-field-x">
          <div className="flex rounded-pill bg-camera-field" style={{ padding: tokens.border.hairline * 3 }}>
            {(["photo", "barcode"] as const).map((tab) => <button key={tab} type="button" disabled={posting} aria-pressed={mode === tab} onClick={() => switchMode(tab)} className={`text-comment ${mode === tab ? "bg-surface font-semibold text-text" : "text-camera-muted"}`} style={{ height: tokens.spacing['table-row'] + tokens.spacing.grid, paddingInline: tokens.spacing['screen-x'] - tokens.icon.strongStroke, borderRadius: tokens.radii.pill - tokens.border.hairline * 3 }}>{tab === "photo" ? "Photo" : "Barcode"}</button>)}
          </div>
        </div></>}
        <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" disabled={posting || full} onChange={(event) => { void addFiles(event.target.files); event.target.value = ""; }} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" disabled={posting || full} onChange={(event) => { void addFiles(event.target.files); event.target.value = ""; }} />
        {mode === "photo" && barcodeState === "idle" && <div className="flex shrink-0 items-center justify-center" style={{ height: tokens.capture.controlsHeight, gap: tokens.capture.controlsGap }}>
          <button type="button" aria-label="Choose from library" disabled={posting || full} onClick={() => galleryRef.current?.click()} className="flex size-tap items-center justify-center rounded-circle bg-camera-button disabled:opacity-50"><Icon name="camera" size={tokens.capture.galleryIcon} /></button>
          <button type="button" aria-label="Take a photo" disabled={posting || full || cameraBusy} onClick={takePhoto} className="flex items-center justify-center rounded-circle border-surface disabled:opacity-50" style={{ width: tokens.capture.shutterSize, height: tokens.capture.shutterSize, borderWidth: tokens.capture.shutterBorder }}>
            <span className="block rounded-circle bg-surface" style={{ width: tokens.capture.shutterDisc, height: tokens.capture.shutterDisc }} />
          </button>
          {stream ? <button type="button" aria-label="Flip camera" disabled={posting || cameraBusy} onClick={flipCamera} className="flex size-tap items-center justify-center rounded-circle bg-camera-button disabled:opacity-50"><Icon name="flip" size={tokens.capture.galleryIcon} /></button> : <span className="size-tap" aria-hidden="true" />}
        </div>}
        {(mode === "text" || mode === "photo") && barcodeState === "idle" && <div className="flex shrink-0 overflow-x-auto px-screen-x" style={{ gap: tokens.capture.thumbGap }} aria-label="Meal photos">
          {shots.map((shot, i) => (
            <button key={shot.previewUrl} type="button" aria-label={`Remove photo ${i + 1}`} disabled={posting} onClick={() => removeShot(i)} className="relative shrink-0 overflow-hidden rounded-thumb disabled:opacity-50" style={{ width: tokens.capture.thumbSize, height: tokens.capture.thumbSize }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shot.previewUrl} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <span className="absolute right-0 top-0 rounded-bl-chip bg-overlay p-grid"><Icon name="close" size={tokens.spacing['icon-small']} /></span>
            </button>
          ))}
          {!full && <button type="button" aria-label="Add another photo" disabled={posting} onClick={() => galleryRef.current?.click()} className="flex shrink-0 items-center justify-center rounded-thumb border border-dashed border-camera-muted text-camera-muted disabled:opacity-50" style={{ width: tokens.capture.thumbSize, height: tokens.capture.thumbSize }}><Icon name="plus" size={tokens.capture.addIcon} /></button>}
        </div>}
        <div className="min-h-card-gap flex-1" />
        {(mode === "barcode" || barcodeState !== "idle") ? <section aria-label="Scanned product" className="relative rounded-t-sheet bg-text px-screen-x text-surface" style={{ paddingTop: tokens.spacing['screen-x'] - tokens.icon.strongStroke, paddingBottom: `calc(${tokens.brand.barHeight - tokens.radii.chip}px + env(safe-area-inset-bottom))` }}>
          {barcodeState !== "idle" && <button type="button" aria-label="Dismiss scanned product" disabled={posting} onClick={dismissBarcode} className="absolute right-screen-x top-sheet-top flex size-tap items-center justify-center"><Icon name="close" size={tokens.capture.galleryIcon} /></button>}
          {barcodeState === "idle" ? <><p className="text-body">{cameraUnavailable ? "Camera unavailable" : "Looking for a barcode…"}</p><p className="text-detail text-faint">{cameraUnavailable ? "Choose a photo containing a barcode." : "Hold the code steady in the frame"}</p></> : barcodeState === "looking" ? <p className="text-body" role="status">Looking it up…</p> : barcodeState === "missing" ? <><p className="text-body">Not in the database</p><button type="button" onClick={() => { dismissBarcode(); switchMode("text"); setCaption(""); window.setTimeout(() => document.getElementById("capture-caption")?.focus(), 0); }} className="min-h-tap text-detail underline">Type it instead</button></> : null}
          {cameraUnavailable && mode === "barcode" && <div className="mt-sheet-top"><p role="status" className="text-detail text-faint">The camera could not be opened. Choose a photo from the library.</p><button type="button" disabled={posting || cameraBusy} onClick={() => galleryRef.current?.click()} className="min-h-tap text-detail underline">Choose from library</button></div>}
          {barcodeState === "idle" && pendingCount > 0 && <button type="button" disabled={posting || cameraBusy} onClick={() => { void continueSelected(); }} className="min-h-tap text-detail underline">Continue with {pendingCount} selected {pendingCount === 1 ? "photo" : "photos"}</button>}
          {product && <>
            <div className="flex gap-sheet-top pr-tap">
              <div className="min-w-0 flex-1"><p className="text-meta text-faint">Found</p><p className="text-month">{product.name}</p><p className="text-detail text-faint">Per 100 {product.basisUnit} · {macros(100)}</p></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {packPhoto && <img src={packPhoto.previewUrl} alt="Scanned pack" className="shrink-0 rounded-thumb object-cover" style={{ width: tokens.capture.thumbSize, height: tokens.capture.thumbSize }} />}
            </div>
            <p className="text-meta text-faint" style={{ marginTop: tokens.spacing['screen-x'] - tokens.icon.strongStroke }}>How much?</p>
            <div className="mt-tooltip-y flex flex-wrap gap-2">{barcodeAmounts(product).map((amount) => <button key={amount} type="button" disabled={posting} aria-pressed={portion === amount} onClick={() => setPortion(amount)} style={{ height: tokens.brand.barHeight }} className={`rounded-field border px-tooltip-caret text-comment font-medium ${portion === amount ? "border-surface bg-surface text-text" : "border-ring-on-ink text-surface"}`}>{pack === amount ? `Pack · ${amountLabel(amount)}` : amountLabel(amount)}</button>)}</div>
            <p className="text-body" style={{ marginTop: tokens.spacing['screen-x'] - tokens.icon.strongStroke }}>Consumed: {value("calories", portion)} kcal <span className="text-detail font-normal text-faint">· {macros(portion).split(" · ").slice(1).join(" · ")}</span></p>
            <Button variant="camera" className="mt-field-x" disabled={posting} onClick={() => { void postBarcode(); }}>{posting ? "Posting…" : `Post · ${product.name.charAt(0).toUpperCase() + product.name.slice(1).toLowerCase().slice(0, 23)} ${amountLabel(portion)}`}</Button>
          </>}
          {pendingCount + shots.length > 0 && <p className="mt-sheet-top text-detail text-faint">{pendingCount + shots.length} other selected {pendingCount + shots.length === 1 ? "photo is" : "photos are"} waiting. Post this product or dismiss it to continue.</p>}
          {error && <p role="alert" className="mt-sheet-top text-detail">{error}</p>}
        </section> : <div className="flex flex-col px-screen-x pb-card-safe" style={{ gap: tokens.capture.bottomGap }}>
          {pendingCount > 0 && <button type="button" disabled={posting || cameraBusy} onClick={() => { void continueSelected(); }} className="min-h-tap text-detail underline">Continue with {pendingCount} selected {pendingCount === 1 ? "photo" : "photos"}</button>}
          <FirstRunHint hint="capture" />
          <div className="flex items-center justify-between px-grid text-detail">
            <label htmlFor="capture-when" className="text-camera-muted">When</label>
            <span className="flex items-center gap-2">
              {when === null
                ? <button id="capture-when" type="button" disabled={posting} onClick={() => setWhen(toLocalInput(new Date()))} className="min-h-tap text-surface disabled:opacity-50">Now ›</button>
                : <><input id="capture-when" type="datetime-local" value={when} max={toLocalInput(new Date())} disabled={posting} onChange={(event) => setWhen(event.target.value)} className="min-h-tap rounded-field bg-camera-button px-tooltip-x text-surface" /><button type="button" disabled={posting} onClick={() => setWhen(null)} className="min-h-tap text-camera-muted disabled:opacity-50">Now</button></>}
            </span>
          </div>
          {searchingFoods ? <FoodSearchPanel eatenAt={when === null ? null : fromLocalInput(when)} disabled={posting}
            onLogged={(postId) => { window.dispatchEvent(new CustomEvent("post-created", { detail: { id: postId } })); onClose(); router.refresh(); }}
            onDescribe={(text) => { if (text && !caption.trim()) setCaption(text); setSearchingFoods(false); setError(null); }} onError={setError} /> : <>
          <Field variant="camera" id="capture-caption" aria-label="Caption" value={caption} onChange={(event) => setCaption(event.target.value)} disabled={posting} placeholder="What did you eat?" />
          <button type="button" disabled={posting} onClick={() => { setSearchingFoods(true); setError(null); }} className="min-h-tap self-start px-grid text-detail text-surface disabled:opacity-50">Search foods</button>
          <p className="px-grid text-meta text-camera-muted">Location is saved with the post and helps recognise meals you eat in the same place. Only you see it.</p>
          {pendingCount > 0 && <button type="button" disabled={posting || cameraBusy} onClick={() => { void continueSelected(); }} className="min-h-tap text-detail text-surface underline">Retry selected photos</button>}
          <Button variant="camera" onClick={post} disabled={posting || cameraBusy || pendingCount > 0 || (!caption.trim() && shots.length === 0)}>{posting ? "Posting…" : "Post"}</Button>
          </>}
          {error && <p role="alert" className="text-detail text-surface">{error}</p>}
        </div>}
      </div>
    </div>
  );
}

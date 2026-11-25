/* eslint-disable @next/next/no-img-element -- Private owner images bypass paid optimization. */
"use client";
import {DisplayError} from '@/i18n/display-error';
import {useFailureMessages} from '@/i18n/failure-messages';
import {CaptureFailureError,captureFailureText,failureFromResponse} from '@/lib/posts/capture-failure';
import {useTranslations,useLocale} from 'next-intl';
import {record} from '@/lib/diagnostics/recorder';
import {cameraFailure} from '@/lib/diagnostics/schema';
import OpenFoodFactsAttribution from './OpenFoodFactsAttribution';
import {useDesktop} from "@/lib/ui/use-desktop";
import {useCameraMode} from "@/lib/media/camera-mode";
import {lockBodyScroll} from '@/lib/ui/scroll-lock';
import {formatGtin} from "@/lib/fdc/gtin";
import CorrectProductSheet from "@/components/CorrectProductSheet";
import type { LabelReading } from "@/lib/meta/label";
import type { ResolvedProduct } from "@/lib/fdc/barcode-product";
import LightComposer from "@/components/LightComposer";
import { iosNeedsSaveHint, SavePhotoPrompt, shareOrDownloadPhoto } from "@/components/SavePhoto";
import type {CapturedLocation} from "@/lib/location/capture";
import { PackPhotoUpload } from "@/lib/media/pack-photo-upload";

import {barcodePhotoOutcome,barcodeDecoderOutcome} from "@/lib/media/barcode-photo";
import { decodeBarcode, decodeBarcodeFile, loadBarcodeDecoder } from "@/components/BarcodeScanner";
import { barcodeAmounts, amountInBasis, packageAmount, type BarcodeProduct } from "@/lib/fdc/barcode-product";
import { formatNutrition } from "@/lib/nutrition/totals";
import FirstRunHint from "@/components/FirstRunHint";
import ModeStrip, { BarcodeGlyph, useModeSwipe } from "@/components/ModeStrip";
import FoodSearchPanel from "@/components/FoodSearchPanel";
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { TopBar } from "@/components/ui/TopBar";
import { requestLocation } from "@/lib/location/capture";
import { openCamera, grabFrame, cameraVideoConstraints, CameraFlipError, type Camera } from "@/lib/media/camera";
import {uploadManager} from "@/lib/posts/upload-manager";
import {useUploads} from "@/components/useUploads";
import { fromLocalInput, toLocalInput } from "@/lib/posts/eaten-at";
import { tokens } from "@/lib/theme/tokens";
import VoiceButton,{useVoiceActivity} from "@/components/VoiceButton";

type Shot = { file: File; previewUrl: string };
const MAX_SHOTS = 8;

// #999: shown on a phone in Photo mode when the camera did not open; AGY rules on the words.


export type CaptureMode = "photo" | "text" | "barcode";
type BarcodePick = { remaining: number; found: boolean; files: File[]; decoderAttempted?: boolean; failure?: "error" | "decoderSlow" };
type BarcodeState = "idle" | "looking" | "missing" | "found" | "error" | "unread" | "decoderLoading" | "decoderSlow";
export default function CaptureSheet({ onClose, initialMode = "photo", forPost, attachNotEaten = false, initialFiles }: { onClose: () => void; initialMode?: CaptureMode; forPost?: string; attachNotEaten?: boolean; initialFiles?: File[] }) {
 const tn=useTranslations('nutrition');
 const tf=useFailureMessages();
 const t=useTranslations('capture');
 const locale=useLocale();
 const FLIP_ERROR=t('error_7c013ff3b128');
 const CAMERA_NOT_OPENED=t('error_593aa10c02f8');
  const router = useRouter();
  const desktop=useDesktop();
  const phoneCamera=useCameraMode()==='phone'&&!desktop;
  const [cameraAttempt,setCameraAttempt]=useState(0);
  const reopened=useRef(false);
  const recovering=useRef(false);
  const [cameraRecoveryFailed,setCameraRecoveryFailed]=useState(false);
  const retryCamera=()=>{recovering.current=cameraRecoveryFailed;reopened.current=false;setCameraAttempt(value=>value+1);};
  const [devices,setDevices]=useState<MediaDeviceInfo[]>([]);
  const [deviceId,setDeviceId]=useState('');
  const [dragging,setDragging]=useState(false);
  const [resumed]=useState(()=>forPost?null:uploadManager.newest());
  const operationRef=useRef<string|null>(resumed?.operationId??null);
  const [operationId,setOperationId]=useState(resumed?.operationId??null);
  const uploads=useUploads();
  const upload=uploads.find(value=>value.operationId===operationId);
  const [composer,setComposer]=useState(initialMode==='text'||Boolean(resumed));
  const [photoIndex,setPhotoIndex]=useState(0);
  const [cameraPreview,setCameraPreview]=useState<HTMLCanvasElement|null>(null);
  const [notEaten,setNotEaten]=useState<number[]>(resumed?.options.not_eaten_positions??[]);
  const [attachmentIsLeftovers,setAttachmentIsLeftovers]=useState(attachNotEaten);
  const [location,setLocation]=useState<CapturedLocation|null>(resumed?.location??null);
  const [locationEnabled,setLocationEnabled]=useState(Boolean(resumed?.location));
  const [saveAsMeal,setSaveAsMeal]=useState(resumed?.options.save_as_meal??false);
  const [modesHintVisible, setModesHintVisible] = useState(false);
  const [mode, setMode] = useState<CaptureMode>(initialMode);
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [barcodeState, setBarcodeStateValue] = useState<BarcodeState>("idle");
  const barcodeStateRef = useRef<BarcodeState>("idle");
  const setBarcodeState = useCallback((next: BarcodeState) => {
    barcodeStateRef.current = next;
    setBarcodeStateValue(next);
  }, []);
  const [scannedCode,setScannedCode]=useState("");
  const [labelForCode,setLabelForCode]=useState<string|null>(null);
  const [labelState,setLabelState]=useState<"idle"|"reading"|"read"|"missing"|"noServing"|"failed">("idle");
  const [labelReading,setLabelReading]=useState<{reading_id:string;reading:LabelReading}|null>(null);
  const [labelName,setLabelName]=useState("");
  const [labelServings,setLabelServings]=useState(1);
  const [otherServings,setOtherServings]=useState(false);
  const [correcting,setCorrecting]=useState(false);
  const labelUploadRef=useRef<PackPhotoUpload|null>(null);
  const labelPhotoRef=useRef<{path:string;width:number;height:number}|null>(null);
  const [packPhoto, setPackPhoto] = useState<Shot | null>(null);
  const packPhotoRef = useRef<Shot | null>(null);
  const packOperationRef=useRef<string|null>(null);
  const [portion, setPortion] = useState(100);
  const lookupRef = useRef(0);
  const scanBusy = useRef(false);
  const decoderFailedRef = useRef<"error"|"decoderSlow"|null>(null);
  const rejectedCode = useRef<{ code: string; lastSeen: number } | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [initialShots]=useState<Shot[]>(()=>resumed?.files.map(file=>({file,previewUrl:URL.createObjectURL(file)}))??[]);
  const shotsRef = useRef<Shot[]>(initialShots);
  const selectedPhotoRef = useRef(Boolean(resumed?.files.length));
  const pendingFilesRef = useRef<Array<{ file: File; barcode: boolean; pick: BarcodePick }>>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveCameraRef = useRef<Camera | null>(null);
  const mountedRef = useRef(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [takingPhoto,setTakingPhoto]=useState(false);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const postingRef = useRef(false);
  const [shots, setShots] = useState<Shot[]>(initialShots);
  const [caption, setCaption] = useState(resumed?.caption??"");
  // null means Now; otherwise the datetime-local value (the reader's local wall-clock time) the meal was eaten.
  const [when, setWhen] = useState<string | null>(resumed?.eatenAt?toLocalInput(new Date(resumed.eatenAt)):null);
  const [searchingFoods, setSearchingFoods] = useState(false);
  const [posting, setPosting] = useState(false);
  const voice=useVoiceActivity();
  const [savePhotoUrl, setSavePhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(()=>{if(operationRef.current)uploadManager.update(operationRef.current,{caption,eatenAt:when===null?null:fromLocalInput(when),location:locationEnabled?location:null,options:{not_eaten_positions:notEaten,save_as_meal:saveAsMeal}});},[caption,when,location,locationEnabled,notEaten,saveAsMeal]);
  const closeDraft=useCallback(()=>{
    if(postingRef.current)return;
    if(forPost){onClose();return;}
    if(shotsRef.current.length||caption.trim()){
      const fields={caption,eatenAt:when===null?null:fromLocalInput(when),location:locationEnabled?location:null,options:{not_eaten_positions:notEaten,save_as_meal:saveAsMeal}};
      operationRef.current=uploadManager.stage(shotsRef.current.map(shot=>shot.file),fields,operationRef.current??undefined);setOperationId(operationRef.current);
    }
    onClose();
  },[caption,when,notEaten,location,locationEnabled,saveAsMeal,onClose,forPost]);
  const closeDraftRef=useRef(closeDraft);
  useEffect(()=>{closeDraftRef.current=closeDraft;},[closeDraft]);
  const enableLocation=(enabled:boolean)=>{if(!enabled){setLocationEnabled(false);return;}void requestLocation().then(fix=>{setLocation(fix);setLocationEnabled(Boolean(fix));});};
  useEffect(()=>{let live=true;if(!resumed&&!forPost)void requestLocation().then(fix=>{if(live){setLocation(fix);setLocationEnabled(Boolean(fix));}});return()=>{live=false;};},[forPost,resumed]);
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null);
  useEffect(() => {
    const visual = window.visualViewport;
    if (!visual) return;
    const update = () => setViewport({ height: visual.height, top: visual.offsetTop });
    update();
    visual.addEventListener("resize", update);
    visual.addEventListener("scroll", update);
    return () => {
      visual.removeEventListener("resize", update);
      visual.removeEventListener("scroll", update);
    };
  }, []);

  const findBarcode = useCallback(async (code: string, file: File) => {
    const mine = ++lookupRef.current;
    setScannedCode(code);
    if (packPhotoRef.current) URL.revokeObjectURL(packPhotoRef.current.previewUrl);
    const shot = { file, previewUrl: URL.createObjectURL(file) };
    packPhotoRef.current = shot; setPackPhoto(shot);
    setBarcodeState("looking"); setProduct(null); setError(null);
    try {
      const response = await fetch(`/api/fdc/barcode?code=${encodeURIComponent(code)}`);
      const result = await response.json();
      if (!mountedRef.current || mine !== lookupRef.current) return;
      if (response.status === 404) { setBarcodeState("missing"); return; }
      if (!response.ok || !result.product) throw new DisplayError(tf('route_fc3f44ef874c'));
      const next = result.product as BarcodeProduct;
      const serving = next.servingSize && next.servingSizeUnit ? amountInBasis(next.servingSize, next.servingSizeUnit, next.basisUnit) : null;
      setPortion(serving ?? 100); setProduct(next); setBarcodeState("found");
    } catch {
      if (mountedRef.current && mine === lookupRef.current) { setBarcodeState("error"); setError(t('error_1c31b95a0238')); }
    }
  }, [setError, setBarcodeState, t, tf]);

  const dismissBarcode = () => {
    if (postingRef.current) return;
    lookupRef.current += 1;
    if (["unread", "decoderLoading", "decoderSlow", "error"].includes(barcodeStateRef.current)) setComposer(false);
    if(packOperationRef.current){void uploadManager.remove(packOperationRef.current);packOperationRef.current=null;}
    setProduct(null); setBarcodeState("idle"); setPackPhoto(null); setError(null); setLabelState("idle");setLabelReading(null);setLabelForCode(null);
    if (packPhotoRef.current) URL.revokeObjectURL(packPhotoRef.current.previewUrl);
    packPhotoRef.current = null;
    if (!shotsRef.current.length && !pendingFilesRef.current.length) selectedPhotoRef.current = false;
  };

  const backToBarcodeCamera = () => {
    const retry = decoderFailedRef.current && ["error", "decoderSlow", "decoderLoading"].includes(barcodeStateRef.current);
    dismissBarcode();
    if (!retry) return;
    const generation = lookupRef.current;
    // Back is the person's explicit retry. Keep live-frame polling latched
    // until this one bounded load succeeds, or show its failure again.
    // Retain the known failure while this explicit attempt is pending.
    setBarcodeState("decoderLoading");
    void barcodeDecoderOutcome(() => loadBarcodeDecoder({retry:true})).then(result => {
      if (!mountedRef.current || postingRef.current || generation !== lookupRef.current) return;
      if (result.state === "loaded") {
        decoderFailedRef.current = null;
        setBarcodeState("idle"); setError(null);
      } else {
        decoderFailedRef.current = result.state;
        setBarcodeState(result.state);
        setError(result.state === "error" ? t('decoderLoadFailed') : null);
      }
    });
  };

  useEffect(()=>()=>{void record('sheet','capture-close');},[]);

  const cameraEnabled = mode !== "text" && (!composer || takingPhoto) && !(phoneCamera && mode === "photo");
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    if (!cameraEnabled) return () => { cancelled = true; mountedRef.current = false; };
    void record('camera','opening');
    const acquire=desktop&&deviceId?navigator.mediaDevices.getUserMedia({video:cameraVideoConstraints('user',deviceId),audio:false}).then(stream=>({stream,close(){stream.getTracks().forEach(track=>track.stop());},async flip(){return stream;}})):openCamera(desktop?'user':'environment');
    void acquire.then((camera) => {
      if (cancelled) { camera.close(); return; }
      liveCameraRef.current = camera;
      void record('camera','ready');
      setCameraUnavailable(false); setCameraRecoveryFailed(false); recovering.current=false; setStream(camera.stream);
      if(desktop)void navigator.mediaDevices.enumerateDevices().then(all=>{if(!cancelled)setDevices(all.filter(device=>device.kind==='videoinput'));}).catch(()=>{});
    }).catch((cause:unknown) => { if (!cancelled) {setCameraRecoveryFailed(recovering.current&&(cause as {name?:string}|null)?.name!=="NotAllowedError");setCameraUnavailable(true);void record('camera',cameraFailure(cause));} });
    return () => {
      cancelled = true;
      mountedRef.current = false;
      liveCameraRef.current?.close();
      void record('camera','closed');
      liveCameraRef.current = null;
    };
  }, [cameraEnabled,desktop,deviceId,cameraAttempt]);

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
  }, [stream,composer]);

  // #999: iOS can stop the camera, or pause its picture, while the app is in the background, another app takes the
  // camera, or the app is reopened. Each of those events is answered once: an ended camera is opened again, and a paused
  // picture is played again. At most one reopen per return to the app (rule 5: no retry loop); after that, and on any
  // failure, the camera-unavailable message shows with its Allow camera button.
  useEffect(() => {
    if (!stream) return;
    const reopen = () => {
      liveCameraRef.current?.close(); liveCameraRef.current = null; setStream(null);
      if (reopened.current) { setCameraRecoveryFailed(true); setCameraUnavailable(true); return; }
      recovering.current = true; reopened.current = true; setCameraAttempt(value => value + 1);
    };
    const tracks = stream.getVideoTracks();
    const back = () => {
      if (document.visibilityState === "hidden") { reopened.current = false; return; }
      if (tracks.some(track => track.readyState !== "live")) { reopen(); return; }
      const video = videoRef.current;
      if (video?.paused) void video.play().catch(() => { liveCameraRef.current?.close(); liveCameraRef.current = null; setStream(null); setCameraRecoveryFailed(true); setCameraUnavailable(true); });
    };
    for (const track of tracks) track.addEventListener("ended", reopen);
    document.addEventListener("visibilitychange", back);
    window.addEventListener("pageshow", back);
    return () => { for (const track of tracks) track.removeEventListener("ended", reopen); document.removeEventListener("visibilitychange", back); window.removeEventListener("pageshow", back); };
  }, [stream]);

  useEffect(() => {
    void record('sheet','capture-open');
    const previousFocus = document.activeElement;
    const releaseScroll=lockBodyScroll();
    if (initialMode === "text") document.getElementById("capture-caption")?.focus();
    else closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if(event.defaultPrevented)return;
      if (event.key === "Escape" && !postingRef.current) closeDraftRef.current();
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([type="file"]):not([disabled]), a[href], select:not([disabled]), textarea:not([disabled])'
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
      releaseScroll();
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [onClose, initialMode]);

  useEffect(() => () => {
    lookupRef.current += 1;
    if(packOperationRef.current){void uploadManager.remove(packOperationRef.current);packOperationRef.current=null;}
    if (packPhotoRef.current) URL.revokeObjectURL(packPhotoRef.current.previewUrl);
    for (const shot of shotsRef.current) URL.revokeObjectURL(shot.previewUrl);
  }, []);

  const showDecoderLoadFailure = useEffectEvent(() => {
    if (!postingRef.current) { setBarcodeState("error"); setError(t('decoderLoadFailed')); }
  });
  useEffect(() => {
    if (mode !== "barcode") return;
    let cancelled = false;
    decoderFailedRef.current = null;
    // This effect runs only on entry to Barcode, not on wording/state changes.
    void loadBarcodeDecoder({retry:true}).catch(() => {
      decoderFailedRef.current = "error";
      if (!cancelled) showDecoderLoadFailure();
    });
    return () => { cancelled = true; };
  }, [mode]);

  useEffect(() => {
    if (mode !== "barcode" || !stream) return;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      if (cancelled || !mountedRef.current || !videoRef.current || postingRef.current) return;
      if (decoderFailedRef.current) {
        // A cancelled observer may have latched a failure; never show idle
        // "Looking" while this active scanner cannot work.
        if (barcodeStateRef.current === "idle") {
          setBarcodeState(decoderFailedRef.current);
          setError(decoderFailedRef.current === "error" ? t('decoderLoadFailed') : null);
        }
        return;
      }
      // Healthy decoding continues behind result cards so lastSeen follows
      // the barcode in view. Only decoder-problem states pause that work.
      if (scanBusy.current || ["decoderLoading", "decoderSlow"].includes(barcodeStateRef.current)) return;
      scanBusy.current = true;
      try {
        // The live loop never opts into a retry. It shares any pending load,
        // bounds its wait, and latches every rejected/timed-out outcome itself.
        const loaded = await barcodeDecoderOutcome(loadBarcodeDecoder);
        if (loaded.state !== "loaded") {
          decoderFailedRef.current = loaded.state;
          if (!cancelled && mountedRef.current && !postingRef.current &&
              ["idle", "decoderLoading", "decoderSlow"].includes(barcodeStateRef.current)) {
            setBarcodeState(loaded.state);
            setError(loaded.state === "error" ? t('decoderLoadFailed') : null);
          }
          return;
        }
        if (cancelled || !mountedRef.current || postingRef.current || ["decoderLoading", "decoderSlow"].includes(barcodeStateRef.current)) return;
        const code = await decodeBarcode(videoRef.current);
        if (cancelled) return;
        if (!code) return;
        const previous = rejectedCode.current;
        const now = Date.now();
        const suppressed = previous?.code === code && now - previous.lastSeen < 2000;
        rejectedCode.current = { code, lastSeen: now };
        if (barcodeStateRef.current !== "idle" || suppressed) return;
        const blob = await grabFrame(videoRef.current);
        if (!cancelled) void findBarcode(code, new File([blob], "pack.jpg", { type: "image/jpeg" }));
      } catch { /* An unreadable frame is retried on the next interval. */ }
      finally { scanBusy.current = false; }
    }, 300);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [mode, stream, findBarcode, setBarcodeState, t]);

  const readLabelFile = async(file:File)=>{
    setLabelState("reading");setError(null);
    if(packPhotoRef.current)URL.revokeObjectURL(packPhotoRef.current.previewUrl);
    const shot={file,previewUrl:URL.createObjectURL(file)};packPhotoRef.current=shot;setPackPhoto(shot);
    try{
      labelUploadRef.current??=new PackPhotoUpload();
      const photo=await labelUploadRef.current.prepare(file);labelPhotoRef.current=photo;
      const response=await fetch("/api/label/read",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({photo_path:photo.path})});
      const result=await response.json();if(!response.ok)throw new CaptureFailureError(failureFromResponse(result));
      if(!mountedRef.current)return;
      if(!result.reading.is_label||!result.reading.per_serving){setLabelState("missing");return;}
      setLabelReading(result);setLabelName("");setLabelServings(1);setLabelState("read");
      window.setTimeout(()=>document.getElementById("label-name")?.focus(),0);
    }catch(e){if(mountedRef.current){setLabelState("failed");setError(e instanceof CaptureFailureError ? captureFailureText(e.failure,tf)! : e instanceof DisplayError ? e.message:t('error_7f3988fea3b6'));}}
  };
  const typePackInstead=()=>{
    const kept=packPhotoRef.current;
    if(kept){shotsRef.current=[...shotsRef.current,kept];setShots(shotsRef.current);packPhotoRef.current=null;}
    dismissBarcode();setMode("text");setCaption("");setStream(null);setComposer(true);
    window.setTimeout(()=>document.getElementById("capture-caption")?.focus(),0);
  };
  const postLabel=async()=>{
    if(postingRef.current||!labelReading||!labelPhotoRef.current)return;
    postingRef.current=true;setPosting(true);setError(null);
    try{
      const eatenAt=when===null?new Date().toISOString():fromLocalInput(when);
      if(!eatenAt||!packPhotoRef.current)throw new DisplayError(t('error_be2e37f28789'));
      await uploadManager.postFood({label_reading_id:labelReading.reading_id,servings:labelServings,name:labelName,photo:{...labelPhotoRef.current},...(labelForCode?{gtin:labelForCode}:{}),eaten_at:eatenAt},labelName.trim()||t('packagedFood'),[packPhotoRef.current.file]);
      onClose();
    }catch(e){setError(e instanceof CaptureFailureError ? captureFailureText(e.failure,tf)! : e instanceof DisplayError ? e.message:tf('error_0795a0b4a0a6'));}finally{postingRef.current=false;setPosting(false);}
  };
  const attachFile=async(file:File)=>{
    if(!forPost)return false;
    postingRef.current=true;setPosting(true);setError(null);
    try{
      // The file is kept on this device; upload and attachment continue in the background.
      await uploadManager.postAttachment(file,{postId:forPost,notEaten:attachmentIsLeftovers});
      onClose();router.refresh();return true;
    }catch(e){if(mountedRef.current)setError(e instanceof CaptureFailureError ? captureFailureText(e.failure,tf)! : e instanceof DisplayError ? e.message:t('error_7292b850e4fa'));return false;}
    finally{postingRef.current=false;if(mountedRef.current)setPosting(false);}
  };
  const addFiles = async (files: FileList | File[] | null) => {
    if (!files || postingRef.current) return;
    if (Array.from(files).length) { selectedPhotoRef.current = true; window.dispatchEvent(new Event("capture-shot")); }
    const chosen = Array.from(files).slice(0, Math.max(0, (forPost?1:MAX_SHOTS) - shotsRef.current.length - pendingFilesRef.current.length));
    const pick: BarcodePick = {remaining: chosen.length, found: false, files: chosen};
    pendingFilesRef.current.push(...chosen.map(file => ({file, barcode: mode === "barcode", pick})));
    setPendingCount(pendingFilesRef.current.length);
    if (scanBusy.current) return;
    scanBusy.current = true; setCameraBusy(true);
    try {
      while (pendingFilesRef.current.length && shotsRef.current.length < MAX_SHOTS) {
        // Keep the in-flight file in the queue so another selection cannot exceed capacity.
        const {file, barcode, pick} = pendingFilesRef.current[0];
        if(forPost){
          const attached=await attachFile(file);
          if(attached){pendingFilesRef.current.shift();setPendingCount(pendingFilesRef.current.length);}
          return;
        }
        if(labelForCode){
          pendingFilesRef.current.shift();setPendingCount(pendingFilesRef.current.length);
          await readLabelFile(file);return;
        }
        // Photo keeps the selected file; only the Barcode screen runs its decoder.
        shotsRef.current = [...shotsRef.current, { file, previewUrl: URL.createObjectURL(file) }];
        pendingFilesRef.current.shift(); setPendingCount(pendingFilesRef.current.length);
        operationRef.current=uploadManager.stage(shotsRef.current.map(shot=>shot.file),{caption,eatenAt:when===null?null:fromLocalInput(when),location:locationEnabled?location:null,options:{not_eaten_positions:notEaten,save_as_meal:saveAsMeal}},operationRef.current??undefined);setOperationId(operationRef.current);
        setShots(shotsRef.current);setPhotoIndex(shotsRef.current.length-1);setComposer(true);
        if (!barcode) continue;
        const shot = shotsRef.current[shotsRef.current.length - 1];
        const generation = lookupRef.current;
        decoderFailedRef.current = null; // A new library choice is an explicit retry.
        setBarcodeState("decoderLoading"); setError(null);
        // Give React and the browser a paint before the decoder's CPU work.
        void new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
          .then(() => {
            if (!mountedRef.current || postingRef.current || generation !== lookupRef.current || !shotsRef.current.includes(shot)) return null;
            return barcodePhotoOutcome(() => {
              // A multi-file selection is one person action: only its first
              // active file can retry; all others share pending/success/failure.
              const retry = !pick.decoderAttempted;
              pick.decoderAttempted = true;
              return loadBarcodeDecoder(retry ? {retry:true} : undefined);
            }, () => decodeBarcodeFile(file));
          })
          .then((result) => {
            if (!result || !mountedRef.current || postingRef.current || generation !== lookupRef.current || !shotsRef.current.includes(shot)) return;
            if (result.state !== "found") {
              if (result.state === "error" || result.state === "decoderSlow") pick.failure = result.state;
              // Every failed or timed-out load stays latched until a person retries.
              if (result.state === "error" || result.state === "decoderSlow") decoderFailedRef.current = result.state;
              return;
            }
            const index = shotsRef.current.indexOf(shot);
            if(shotsRef.current.length===1&&operationRef.current){packOperationRef.current=operationRef.current;operationRef.current=null;setOperationId(null);}
            removeShot(index);
            if (!shotsRef.current.length) setComposer(false);
            pick.found = true;
            void findBarcode(result.code, file);
          })
          .finally(() => {
            pick.remaining -= 1;
            if (pick.remaining === 0 && !pick.found && mountedRef.current && !postingRef.current && generation === lookupRef.current && shotsRef.current.some(shot => pick.files.includes(shot.file))) {
              setBarcodeState(pick.failure ?? "unread");
              if (pick.failure === "error") setError(t('decoderLoadFailed'));
            }
          });

      }
    } catch { if (mountedRef.current) setError(t('error_d6f2dc6dad86')); }
    finally { scanBusy.current = false; if (mountedRef.current) setCameraBusy(false); }
  };

  const takePhoto = async () => {
    if (postingRef.current || cameraBusy || shotsRef.current.length >= MAX_SHOTS) return;
    if ((phoneCamera && mode === "photo") || !stream || !videoRef.current) { cameraRef.current?.click(); return; }
    setCameraBusy(true);setTakingPhoto(true);
    try {
      selectedPhotoRef.current = true;
      const blob = await grabFrame(videoRef.current,!forPost&&mode==='photo'?frame=>{
        if(mountedRef.current){setCameraPreview(frame);setComposer(true);}
      }:undefined,true);
      if (mountedRef.current) await addFiles([new File([blob], "meal.jpg", { type: blob.type || "image/jpeg" })]);
    } catch {
      if (mountedRef.current) {setError(t('error_7cca119e551e'));if(!forPost&&mode==='photo')setComposer(shotsRef.current.length>0);}
    } finally { if (mountedRef.current) {setCameraPreview(null);setCameraBusy(false);setTakingPhoto(false);} }
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
    if(operationRef.current){if(!shotsRef.current.length){void uploadManager.remove(operationRef.current);operationRef.current=null;setOperationId(null);}else operationRef.current=uploadManager.stage(shotsRef.current.map(shot=>shot.file),{caption,eatenAt:when===null?null:fromLocalInput(when),location:locationEnabled?location:null,options:{not_eaten_positions:notEaten.filter(value=>value!==index).map(value=>value>index?value-1:value).filter(value=>value>0),save_as_meal:saveAsMeal}},operationRef.current);}
    setNotEaten(values=>values.filter(value=>value!==index).map(value=>value>index?value-1:value).filter(value=>value>0));setPhotoIndex(value=>Math.max(0,Math.min(value,shotsRef.current.length-1)));
    if (!shotsRef.current.length && !pendingFilesRef.current.length) selectedPhotoRef.current = false;
  };

  const savePhoto = async () => {
    const shot = shotsRef.current[photoIndex];
    if (!shot) return;
    if (iosNeedsSaveHint()) {
      setSavePhotoUrl(shot.previewUrl);
      return;
    }
    await shareOrDownloadPhoto(shot.file, shot.previewUrl);
  };

  const post = async () => {
    if (voice.activeRef.current || postingRef.current || cameraBusy || pendingFilesRef.current.length > 0 || (!caption.trim() && shotsRef.current.length === 0)) return;
    postingRef.current = true;
    setPosting(true);
    setError(null);
    try {
      const chosenLocation = locationEnabled ? location : null;
      const eatenAt = when === null ? null : fromLocalInput(when);
      if (when !== null && !eatenAt) throw new DisplayError(t('error_5ebb68b90d9c'));
      const id=uploadManager.stage(shotsRef.current.map(shot=>shot.file),{caption,location:chosenLocation,eatenAt,options:{not_eaten_positions:notEaten,save_as_meal:saveAsMeal}},operationRef.current??undefined);
      operationRef.current=id;setOperationId(id);if(!await uploadManager.post(id))throw new DisplayError(t('error_6bb4c3f944a9'));onClose();router.refresh();
    } catch (e) {
      setError(e instanceof CaptureFailureError ? captureFailureText(e.failure,tf)! : e instanceof DisplayError ? e.message : t('error_a7684107da5e'));
    } finally {
      postingRef.current = false;
      setPosting(false);
    }
  };

  const postBarcode = async () => {
    if (postingRef.current || !product || !packPhotoRef.current) return;
    postingRef.current = true; setPosting(true); setError(null);
    try {
      const eatenAt=when===null?new Date().toISOString():fromLocalInput(when);
      if(!eatenAt)throw new DisplayError(tf('route_6572182f4064'));
      await uploadManager.postFood({gtin:product.gtin,amount:portion,unit:product.basisUnit,eaten_at:eatenAt},product.name,[packPhotoRef.current.file],packOperationRef.current??undefined);
      packOperationRef.current=null;
      if (pendingFilesRef.current.length || shotsRef.current.length) {
        // A multi-selection is retained until the user explicitly continues it.
        postingRef.current = false; dismissBarcode(); setStream(null); setMode("text");setComposer(true);
        window.setTimeout(() => document.getElementById("capture-caption")?.focus(), 0);
      } else onClose();

    } catch (error) { if (mountedRef.current) setError(error instanceof CaptureFailureError ? captureFailureText(error.failure,tf)! : error instanceof DisplayError ? error.message : tf('error_0795a0b4a0a6')); }
    finally { postingRef.current = false; if (mountedRef.current) setPosting(false); }
  };

  const labelNumber=(key:"kcal"|"protein_g"|"carbs_g"|"fat_g"|"fibre_g"|"sugar_g"|"sodium_mg",amount=labelServings)=>{const n=labelReading?.reading.per_serving?.[key];return n==null?"—":new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(n*amount);};
  const labelMacros=(amount=labelServings)=>t('macroSummary',{calories:labelNumber("kcal",amount),protein:labelNumber("protein_g",amount),carbs:labelNumber("carbs_g",amount),fat:labelNumber("fat_g",amount)});
  useEffect(()=>{
    if(initialFiles?.length)void addFiles(initialFiles);
  },[initialFiles]); // eslint-disable-line react-hooks/exhaustive-deps
  const handleCaptureFiles=useEffectEvent((event:Event)=>{const incoming=(event as CustomEvent<{files:File[]}>).detail?.files;if(incoming?.length)void addFiles(incoming);});
  const handleCaptureKey=useEffectEvent((event:KeyboardEvent)=>{if(!desktop||composer||mode!=='photo'||barcodeState!=='idle'||labelState!=='idle'||event.code!=='Space'||(event.target as HTMLElement)?.closest('input,textarea,select,button,a[href],summary,[contenteditable="true"]'))return;event.preventDefault();void takePhoto();});
  useEffect(()=>{
    const files=(event:Event)=>handleCaptureFiles(event);
    const key=(event:KeyboardEvent)=>handleCaptureKey(event);
    window.addEventListener('capture-files',files);window.addEventListener('keydown',key);
    return()=>{window.removeEventListener('capture-files',files);window.removeEventListener('keydown',key);};
  },[]);
  const latest = shots[shots.length - 1];
  const hasCaptureActions=Boolean(error)||labelState==="read"||Boolean(product)||(!searchingFoods&&barcodeState==="idle"&&mode!=="barcode"&&labelState==="idle");
  const full = shots.length >= MAX_SHOTS;
  const switchMode = (next: CaptureMode) => { if (!postingRef.current && next !== mode) { dismissBarcode(); if ((mode === "text") !== (next === "text")) setStream(null); setMode(next);setComposer(next==="text"); } };
  const modeSwipe = useModeSwipe(mode, switchMode, Boolean(forPost) || Boolean(labelForCode) || barcodeState !== "idle" || posting);
  const continueSelected = async () => {
    if (postingRef.current) return;
    if (mode === "barcode") switchMode("text");
    // A live frame may be finishing as the control is pressed. Keep the file selection intact.
    while (scanBusy.current && mountedRef.current) await new Promise((resolve) => window.setTimeout(resolve, 50));
    if (mountedRef.current) await addFiles([]);
  };
  const pack = product ? packageAmount(product) : null;
  const amountLabel = (amount: number) => product?.basisUnit === "ml" && amount >= 1000 && amount % 1000 === 0 ? `${amount / 1000} l` : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(amount)} ${product?.basisUnit ?? "g"}`;
  const value = (key: "calories" | "protein_g" | "carbs_g" | "fat_g", amount: number) => {
    const nutrient = product?.per100g[key];
    return nutrient === null || nutrient === undefined ? "–" : formatNutrition(nutrient * amount / 100,tn,locale);
  };
  const macros = (amount: number) => t('macroSummary',{calories:value("calories",amount),protein:value("protein_g",amount),carbs:value("carbs_g",amount),fat:value("fat_g",amount)});


  if(!forPost&&composer&&mode!=="barcode"&&barcodeState==="idle"&&labelState==="idle")return <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="capture-title" className="desktop-capture fixed inset-x-0 top-0 z-50 h-dvh overflow-hidden bg-surface" style={viewport?{height:viewport.height,top:viewport.top}:undefined}>
    <div className="desktop-capture-inner mx-auto h-full max-w-phone desktop:max-w-[760px]"><LightComposer cameraPreview={cameraPreview} upload={upload} shots={shots} caption={caption} setCaption={setCaption} index={photoIndex} setIndex={setPhotoIndex} notEaten={notEaten} setNotEaten={setNotEaten} when={when} setWhen={setWhen} locationEnabled={locationEnabled} setLocationEnabled={enableLocation} saveAsMeal={saveAsMeal} setSaveAsMeal={setSaveAsMeal} busy={posting||cameraBusy} error={error} pending={pendingCount} onBack={closeDraft} onPhoto={()=>{setSearchingFoods(false);setComposer(false);setMode("photo");setStream(null);}} onSearch={()=>setSearchingFoods(value=>!value)} onPost={()=>{void post();}} onRemove={removeShot} onSavePhoto={phoneCamera?undefined:()=>{void savePhoto();}}
      searchPanel={searchingFoods?<div className="px-inset"><FoodSearchPanel eatenAt={when===null?null:fromLocalInput(when)} disabled={posting} onQueued={()=>{if(operationRef.current)void uploadManager.remove(operationRef.current);onClose();}} onDescribe={text=>{if(text&&!caption.trim())setCaption(text);setSearchingFoods(false);setError(null);}} onError={setError}/></div>:null}>
      <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={event=>{void addFiles(event.target.files);event.target.value='';}}/>
    </LightComposer><SavePhotoPrompt open={savePhotoUrl!==null} previewUrl={savePhotoUrl??""} onClose={()=>setSavePhotoUrl(null)}/></div>
  </div>;

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="capture-title" className="desktop-capture fixed inset-x-0 top-0 z-50 h-dvh overflow-hidden bg-camera text-surface" style={viewport ? { height: viewport.height, top: viewport.top } : undefined}>
      <div data-round6-capture={!forPost||undefined} className="desktop-capture-inner desktop-camera-inner mx-auto flex h-full w-full max-w-phone flex-col desktop:max-w-[760px] desktop:bg-surface desktop:text-text">
        <div className="desktop-capture-heading shrink-0">
        <TopBar className={desktop&&!forPost?"desktop-capture-header":undefined}
          title={<span id="capture-title">{forPost?(attachmentIsLeftovers?t('leftovers'):t('add_photo')):t('new_post')}</span>}
          left={<button ref={closeRef} type="button" onClick={closeDraft} disabled={posting} aria-label={t('back_to_feed')} className={`flex size-tap items-center justify-center disabled:opacity-50 ${desktop?"text-text":mode==="barcode"||barcodeState!=="idle"||labelState!=="idle"?"text-surface":"rounded-circle bg-field text-text"}`}><Icon name={desktop||mode==="barcode"||barcodeState!=="idle"||labelState!=="idle"?"close":"back"} size={22} /></button>}
          right={<span className="w-tap" aria-hidden="true" />}
        />
        </div>
        {desktop&&!forPost&&<div className={`desktop-drop-side ${dragging?'bg-field':''}`} onDragEnter={()=>setDragging(true)} onDragLeave={()=>setDragging(false)} onDrop={()=>setDragging(false)}><div className="flex flex-1 flex-col items-center justify-center gap-[14px] rounded-card border border-dashed border-ring"><Icon name="photo-add" size={28}/><p className="text-[14px] font-semibold">{t('or_drop_photos_here')}</p><p className="text-[13px] text-muted">{t('paste_one_with_v')}</p><button className="h-[42px] rounded-field border border-text px-[18px] text-[14px] font-semibold" onClick={()=>galleryRef.current?.click()}>{t('choose_files')}</button></div><p className="pt-4 text-[12px] leading-5 text-muted">{t('several_photos_become_slides_in_one_post')}</p></div>}
        <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain ${forPost?"desktop:!flex-auto":""}`} aria-label={t('capture_content')}>
        <div className="capture-hint px-screen-x"><FirstRunHint hint="capture" /></div>
        {forPost&&<div className="flex items-center justify-between gap-3 px-screen-x py-3"><span className="text-detail">{t('leftovers')}</span><button type="button" role="switch" aria-label={t('leftovers')} aria-checked={attachmentIsLeftovers} disabled={posting} onClick={()=>setAttachmentIsLeftovers(value=>!value)} className="min-h-11 rounded-pill bg-camera-field px-4 text-detail">{attachmentIsLeftovers?t('on'):t('off')}</button></div>}
        {mode !== "text" && <><div {...(!desktop?modeSwipe:{})} className={`desktop-viewfinder relative flex touch-pan-y items-center justify-center overflow-hidden bg-camera text-camera-muted ${labelState==="read"?"min-h-[180px] shrink":"shrink-0"} desktop:mx-6 desktop:!mt-0 ${labelState==="read"?"":forPost?"desktop:!h-[min(400px,calc(100dvh-300px))] desktop:shrink desktop:min-h-0":"desktop:h-auto desktop:min-h-[240px] desktop:flex-1 desktop:shrink"} desktop:rounded-card`} style={{ height: labelState==="read"?300:tokens.capture.previewHeight, marginTop: tokens.capture.previewTop }}>
          {labelState!=="idle"&&packPhoto ? <img src={packPhoto.previewUrl} alt={t('photographed_nutrition_label')} className="h-full w-full object-contain"/> : stream && !(phoneCamera && mode === "photo") ? <video ref={videoRef} muted playsInline autoPlay aria-label={t('live_camera_viewfinder')} className="h-full w-full object-cover" /> : latest ? (
            // Local blob previews require no remote image transformation.
            <img src={latest.previewUrl} alt={t('latest_meal_photo')} className="h-full w-full object-cover" />
          ) : cameraUnavailable||desktop&&forPost ? null : <Icon name="camera" />}
          {phoneCamera&&mode==="photo"&&!latest&&<p className="absolute inset-x-6 bottom-6 text-center text-[14px] text-surface">{t('the_shutter_opens_the_phone_apos_s')}</p>}
          {(cameraUnavailable||desktop&&forPost&&!stream&&!latest)&&<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
            {/* #999: a phone whose camera did not open says so in Photo mode too, instead of a black picture. */}
            {!desktop&&cameraUnavailable&&mode==="photo"&&<p role="status" className="text-[14px]">{CAMERA_NOT_OPENED}</p>}
            {desktop&&forPost&&!stream&&!latest&&<><p className="text-[14px] font-semibold">{t('drop_a_photo_here')}</p><p className="text-[13px] text-white/70">{t('or_paste_one_with_v')}</p><button type="button" disabled={posting} onClick={()=>galleryRef.current?.click()} className="h-[42px] rounded-field bg-white px-[18px] text-[14px] font-semibold text-text disabled:opacity-50">{t('choose_a_file')}</button></>}
            {cameraUnavailable&&<button type="button" onClick={retryCamera} className="rounded-field border border-white/40 px-5 py-3 text-[14px] text-white">{cameraRecoveryFailed?t('try_again'):t('allow_camera')}</button>}
          </div>}
          {desktop&&devices.length>0&&<select aria-label={t('camera')} value={deviceId||stream?.getVideoTracks()[0]?.getSettings().deviceId||''} onChange={event=>setDeviceId(event.target.value)} className="absolute left-[14px] top-[14px] h-[29px] max-w-[80%] rounded-field bg-overlay px-[10px] text-meta text-surface">{devices.map((device,index)=><option key={device.deviceId} value={device.deviceId}>{device.label||t('camera_v0', {v0: index+1})}</option>)}</select>}
          {labelState==="read"&&<div aria-hidden="true" className="pointer-events-none absolute rounded-thumb border-2 border-accent" style={{left:`${(labelReading?.reading.box?.x??0)*100}%`,top:`${(labelReading?.reading.box?.y??0)*100}%`,width:`${(labelReading?.reading.box?.w??1)*100}%`,height:`${(labelReading?.reading.box?.h??1)*100}%`,boxShadow:`0 0 12px ${tokens.colors["accent-glow"]}`}}/>}
          {mode === "barcode" && <>
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[160px] w-[240px] -translate-x-1/2 -translate-y-1/2">
              <p className="absolute bottom-full left-1/2 mb-6 w-max max-w-[320px] -translate-x-1/2 rounded-pill bg-overlay px-[14px] py-[6px] text-center text-[15px] text-surface">{t('point_at_the_barcode_it_reads_on')}</p>
              {(["tl", "tr", "bl", "br"] as const).map(corner => <span key={corner} className="absolute size-6 border-white" style={{
                ...(corner.includes("t") ? { top: 0, borderTopWidth: 2 } : { bottom: 0, borderBottomWidth: 2 }),
                ...(corner.includes("l") ? { left: 0, borderLeftWidth: 2 } : { right: 0, borderRightWidth: 2 }),
              }} />)}
              {barcodeState !== "missing" && barcodeState !== "unread" && <span className="barcode-scan-line absolute inset-x-0 top-0 h-[2px] bg-accent" />}
            </div>
            {barcodeState === "missing" && <p className="absolute bottom-icon-small rounded-tile bg-overlay-dark px-tooltip-caret py-tooltip-offset text-detail text-surface">{t('code_read')}{formatGtin(scannedCode)}</p>}
            <style jsx>{CAPTURESHEET_ANIMATION_CSS_0}</style>
          </>}
        </div>
        {!forPost&&<div className="relative shrink-0 pt-field-x desktop:hidden">
          {mode === "photo" && !labelForCode && barcodeState === "idle" && <div className="absolute inset-x-0 bottom-full flex justify-center"><FirstRunHint hint="modes" onTryBarcode={() => switchMode("barcode")} onVisibilityChange={setModesHintVisible} /></div>}
          <ModeStrip highlightBarcode={modesHintVisible} mode={mode} onChange={switchMode} disabled={Boolean(forPost) || Boolean(labelForCode) || barcodeState !== "idle" || posting || voice.active} />
        </div>}</>}
        {desktop&&!forPost&&<div className="desktop-mode-strip"><ModeStrip mode={mode} onChange={switchMode} disabled={posting||barcodeState!=='idle'||labelState!=='idle'}/></div>}
        <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" disabled={posting || full} onChange={(event) => { void addFiles(event.target.files); event.target.value = ""; }} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" disabled={posting || full} onChange={(event) => { void addFiles(event.target.files); event.target.value = ""; }} />
        {(mode === "photo" || mode === "barcode") && barcodeState === "idle" && labelState === "idle" && <div className="desktop-shutter-row relative flex shrink-0 items-center justify-center" style={{ height: tokens.capture.controlsHeight, gap: tokens.capture.controlsGap }}>
          <button type="button" aria-label={t('choose_from_library')} disabled={posting || full || voice.active} onClick={() => galleryRef.current?.click()} className={`${forPost?"":"desktop:hidden"} flex size-tap items-center justify-center rounded-circle bg-camera-button disabled:opacity-50`}><Icon name="camera" size={tokens.capture.galleryIcon} /></button>
          <button type="button" aria-label={t('take_a_photo')} disabled={posting || full || cameraBusy || voice.active} onClick={takePhoto} className="desktop-shutter flex items-center justify-center rounded-circle border-surface disabled:opacity-50" style={{ width: tokens.capture.shutterSize, height: tokens.capture.shutterSize, borderWidth: tokens.capture.shutterBorder }}>
            {mode === "barcode" ? <BarcodeGlyph className="size-7 text-white opacity-50" /> : <span className="block rounded-circle bg-surface" style={{ width: tokens.capture.shutterDisc, height: tokens.capture.shutterDisc }} />}
          </button>
          {stream && !(phoneCamera && mode === "photo") ? <button type="button" aria-label={t('flip_camera')} disabled={posting || cameraBusy} onClick={flipCamera} className="desktop:hidden flex size-tap items-center justify-center rounded-circle bg-camera-button disabled:opacity-50"><Icon name="flip" size={tokens.capture.galleryIcon} /></button> : <span className="size-tap" aria-hidden="true" />}
          {desktop&&!composer&&labelState==='idle'&&<p className="absolute left-[calc(50%+48px)] flex items-center gap-2 whitespace-nowrap text-meta text-muted"><kbd className="flex h-[22px] items-center rounded-chip border border-line bg-white px-2 font-sans text-[11px] font-semibold text-text">{t('space')}</kbd>{t('takes_the_photo')}</p>}
        </div>}
        {!forPost&&(mode === "text" || mode === "photo") && barcodeState === "idle" && labelState === "idle" && <div className="desktop:hidden flex shrink-0 overflow-x-auto px-screen-x" style={{ gap: tokens.capture.thumbGap }} aria-label={t('meal_photos')}>
          {shots.map((shot, i) => (
            <button key={shot.previewUrl} type="button" aria-label={t('remove_photo_v0', {v0: i + 1})} disabled={posting} onClick={() => removeShot(i)} className="relative shrink-0 overflow-hidden rounded-thumb disabled:opacity-50" style={{ width: tokens.capture.thumbSize, height: tokens.capture.thumbSize }}>
              
              <img src={shot.previewUrl} alt={t('photo_v0', {v0: i + 1})} className="h-full w-full object-cover" />
              <span className="absolute right-0 top-0 rounded-bl-chip bg-overlay p-grid"><Icon name="close" size={tokens.spacing['icon-small']} /></span>
            </button>
          ))}
          {!full && <button type="button" aria-label={t('add_another_photo')} disabled={posting} onClick={() => galleryRef.current?.click()} className="flex shrink-0 items-center justify-center rounded-thumb border border-dashed border-camera-muted text-camera-muted disabled:opacity-50" style={{ width: tokens.capture.thumbSize, height: tokens.capture.thumbSize }}><Icon name="plus" size={tokens.capture.addIcon} /></button>}
        </div>}
        <div className="min-h-card-gap flex-1 desktop:hidden" />
        {forPost?<div className="px-screen-x pb-card-safe text-detail">
          {posting&&<p role="status">{t('adding_photo')}</p>}{error&&<p role="alert">{error}</p>}
          {!posting&&pendingCount>0&&<button type="button" disabled={cameraBusy} onClick={()=>{void addFiles([]);}} className="min-h-tap underline">{t('retry_adding_photo')}</button>}
        </div>:<>{labelState!=="idle" ? <section aria-label={t('nutrition_label')} className="shrink-0 rounded-t-sheet bg-text px-screen-x py-5 text-surface">
          {labelState==="reading"?<p role="status" className="text-body">{t('reading_the_label')}</p>:labelState==="missing"||labelState==="noServing"||labelState==="failed"?<><p className="text-body">{labelState==="failed"?t('the_label_could_not_be_read_try'):labelState==="noServing"?t('the_serving_weight_or_volume_could_not'):t('no_nutrition_label_found')}</p><button type="button" onClick={()=>{setLabelState("idle");}} className="min-h-tap text-detail underline">{t('take_the_photo_again')}</button><button type="button" onClick={typePackInstead} className="ml-4 min-h-tap text-detail underline">{t('type_it_instead')}</button></>:labelReading&&<>
          <div className="flex gap-3"><div className="min-w-0 flex-1"><p className="text-meta text-faint">{t('label_read_per_serving')}{labelReading.reading.serving?` ${labelReading.reading.serving.amount} ${labelReading.reading.serving.unit}`:""}</p><Field id="label-name" variant="camera" autoFocus placeholder={t('name_this_food')} value={labelName} maxLength={80} onChange={e=>setLabelName(e.target.value)} disabled={posting}/><p className="mt-1.5 text-detail text-faint">{labelMacros(1)} · {labelNumber("fibre_g",1)} {t('g_fibre')}{labelNumber("sugar_g",1)} {t('g_sugar')}{labelNumber("sodium_mg",1)} {t('mg_sodium')}</p></div>{packPhoto&&<img src={packPhoto.previewUrl} alt={t('nutrition_label')} className="size-14 rounded-thumb object-cover"/>}</div>
          <p className="mt-[18px] text-meta text-faint">{t('how_much')}</p><div className="mt-2.5 flex flex-wrap gap-2">{[1,2,0.5].map(n=><button key={n} type="button" disabled={posting} onClick={()=>{setLabelServings(n);setOtherServings(false);}} aria-pressed={!otherServings&&labelServings===n} className={`h-10 rounded-field border px-3 text-comment font-medium ${!otherServings&&labelServings===n?"border-surface bg-surface text-text":"border-ring-on-ink"}`}>{n===0.5?t('serving'):t('servingAmount',{count:n})}</button>)}<button type="button" onClick={()=>setOtherServings(true)} className="h-10 rounded-field border border-ring-on-ink px-3 text-comment">{t('other')}</button></div>
          {otherServings&&<Field variant="camera" aria-label={t('number_of_servings')} type="number" min="0.25" max="50" step="0.1" value={labelServings} onChange={e=>setLabelServings(Number(e.target.value))} disabled={posting}/>}
          <p className="mt-[18px] text-body">{t('consumed')}{labelNumber("kcal")} {t('kcal')}<span className="text-detail text-faint">· {labelMacros().split(" · ").slice(1).join(" · ")}</span></p><p className="mt-2.5 text-meta text-muted">{t('read_by_the_model_from_the_label')}</p>
          </>}
        </section> : (mode === "barcode" || barcodeState !== "idle") ? <section aria-label={t('scanned_product')} className="relative shrink-0 rounded-t-sheet bg-text px-screen-x text-surface" style={{ paddingTop: tokens.spacing['screen-x'] - tokens.icon.strongStroke, paddingBottom: `calc(${tokens.brand.barHeight - tokens.radii.chip}px + env(safe-area-inset-bottom))` }}>
          {barcodeState !== "idle" && <button type="button" aria-label={t('dismiss_scanned_product')} disabled={posting} onClick={backToBarcodeCamera} className="absolute right-screen-x top-sheet-top flex size-tap items-center justify-center"><Icon name="close" size={tokens.capture.galleryIcon} /></button>}
          {barcodeState === "idle" ? <><p className="text-body">{cameraUnavailable ? t('camera_unavailable') : t('looking_for_a_barcode')}</p><p className="text-detail text-faint">{cameraUnavailable ? t('choose_a_photo_containing_a_barcode') : t('hold_the_code_steady_in_the_frame')}</p></> : barcodeState === "looking" ? <p className="text-body" role="status">{t('looking_it_up')}</p>  : barcodeState === "unread" ? <><p role="status" className="pr-tap text-body">{t('we_couldn_t_read_a_barcode_from')}</p><p className="mt-2 text-detail text-faint">{t('your_photo_is_kept')}</p><Button variant="camera" disabled={posting || cameraBusy || full} className="mt-4 w-full" onClick={() => galleryRef.current?.click()}>{t('choose_another_photo')}</Button><button type="button" disabled={posting} onClick={backToBarcodeCamera} className="min-h-tap w-full text-detail">{t('back_to_camera')}</button></> : barcodeState === "decoderLoading" ? <p role="status" className="pr-tap text-body">{t('decoderLoading')}</p> : barcodeState === "decoderSlow" || barcodeState === "error" ? <>{barcodeState === "decoderSlow" && <p role="status" className="pr-tap text-body">{t('decoderSlow')}</p>}<Button variant="camera" disabled={posting || cameraBusy || full} className="mt-4 w-full" onClick={() => galleryRef.current?.click()}>{t('choose_another_photo')}</Button><button type="button" disabled={posting} onClick={backToBarcodeCamera} className="min-h-tap w-full text-detail">{t('back_to_camera')}</button></> : barcodeState === "missing" ? <><div className="flex items-start gap-3 pr-tap"><div className="min-w-0 flex-1"><p className="text-meta text-faint">{t('not_in_the_database')}</p><p className="text-month">{formatGtin(scannedCode)}</p><p className="text-detail text-faint">{t('no_product_for_this_code_yet_photograph')}</p></div>{packPhoto&&<img src={packPhoto.previewUrl} alt={t('scanned_pack')} className="size-14 shrink-0 rounded-thumb object-cover"/>}</div><Button variant="camera" className="flex items-center justify-center gap-2" onClick={()=>{setLabelForCode(scannedCode);setComposer(false);setMode("photo");setBarcodeState("idle");}}><Icon name="camera" size={18}/>{t('photograph_the_nutrition_label')}</Button><button type="button" onClick={typePackInstead} className="mt-2 h-field-h w-full rounded-field border border-ring-on-ink text-body">{t('type_it_instead')}</button><button type="button" onClick={()=>{rejectedCode.current=null;dismissBarcode();}} className="min-h-tap w-full text-detail text-muted">{t('try_the_code_again')}</button></> : null}
          {cameraUnavailable && mode === "barcode" && <div className="mt-sheet-top"><p role="status" className="text-detail text-faint">{t('the_camera_could_not_be_opened_choose')}</p><button type="button" disabled={posting || cameraBusy} onClick={() => galleryRef.current?.click()} className="min-h-tap text-detail underline">{t('choose_from_library')}</button></div>}
          {barcodeState === "idle" && pendingCount > 0 && <button type="button" disabled={posting || cameraBusy} onClick={() => { void continueSelected(); }} className="min-h-tap text-detail underline">{t('continueWithPhotos',{count:pendingCount})}</button>}
          {product && <>
            <div className="flex gap-sheet-top pr-tap">
              <div className="min-w-0 flex-1"><p className="text-meta text-faint">{t('found')}</p><p className="text-month">{product.name}</p><button type="button" onClick={()=>setCorrecting(true)} className="text-detail underline">{t('correct')}</button><p className="text-detail text-faint">{t('per100Label',{unit:product.basisUnit})} · {macros(100)}</p></div>
              
              {packPhoto && <img src={packPhoto.previewUrl} alt={t('scanned_pack')} className="shrink-0 rounded-thumb object-cover" style={{ width: tokens.capture.thumbSize, height: tokens.capture.thumbSize }} />}
            </div>
            {product.attribution === "off" && <OpenFoodFactsAttribution/>}
            <p className="text-meta text-faint" style={{ marginTop: tokens.spacing['screen-x'] - tokens.icon.strongStroke }}>{t('how_much')}</p>
            <div className="mt-tooltip-y flex flex-wrap gap-2">{barcodeAmounts(product).map((amount) => <button key={amount} type="button" disabled={posting} aria-pressed={portion === amount} onClick={() => setPortion(amount)} style={{ height: tokens.brand.barHeight }} className={`rounded-field border px-tooltip-caret text-comment font-medium ${portion === amount ? "border-surface bg-surface text-text" : "border-ring-on-ink text-surface"}`}>{pack === amount ? t('pack_v0', {v0: amountLabel(amount)}) : amountLabel(amount)}</button>)}</div>
            <p className="text-body" style={{ marginTop: tokens.spacing['screen-x'] - tokens.icon.strongStroke }}>{t('consumed')}{value("calories", portion)} {t('kcal')}<span className="text-detail font-normal text-faint">· {macros(portion).split(" · ").slice(1).join(" · ")}</span></p>
          </>}
          {barcodeState !== "unread" && pendingCount + shots.length > 0 && <p className="mt-sheet-top text-detail text-faint">{t('otherPhotosWaiting',{count:pendingCount+shots.length})}</p>}
        </section> : <div className="desktop:hidden flex flex-col px-screen-x pb-sheet-top" style={{ gap: tokens.capture.bottomGap }}>
          {pendingCount > 0 && <button type="button" disabled={posting || cameraBusy} onClick={() => { void continueSelected(); }} className="min-h-tap text-detail underline">{t('continueWithPhotos',{count:pendingCount})}</button>}
          <div className="flex items-center justify-between px-grid text-detail">
            <label htmlFor="capture-when" className="text-camera-muted">{t('when')}</label>
            <span className="flex items-center gap-2">
              {when === null
                ? <button id="capture-when" type="button" disabled={posting} onClick={() => setWhen(toLocalInput(new Date()))} className="min-h-tap text-surface disabled:opacity-50">{t('nowWithChevron')}</button>
                : <><input id="capture-when" type="datetime-local" value={when} max={toLocalInput(new Date())} disabled={posting} onChange={(event) => setWhen(event.target.value)} className="min-h-tap rounded-field bg-camera-button px-tooltip-x text-surface" /><button type="button" disabled={posting} onClick={() => setWhen(null)} className="min-h-tap text-camera-muted disabled:opacity-50">{t('now_e3b820')}</button></>}
            </span>
          </div>
          {searchingFoods ? <FoodSearchPanel eatenAt={when === null ? null : fromLocalInput(when)} disabled={posting}
            onQueued={() => {  onClose(); }}
            onDescribe={(text) => { if (text && !caption.trim()) setCaption(text); setSearchingFoods(false); setError(null); }} onError={setError} /> : <>
          <Field variant="camera" id="capture-caption" aria-label={t('caption')} value={caption} onChange={(event) => setCaption(event.target.value)} disabled={posting} placeholder={t('what_did_you_eat')} /><VoiceButton value={caption} onChange={setCaption} max={2000} disabled={posting} onActiveChange={voice.onActiveChange} />
          <button type="button" disabled={posting||voice.active} onClick={() => { setSearchingFoods(true); setError(null); }} className="min-h-tap self-start px-grid text-detail text-surface disabled:opacity-50">{t('search_foods')}</button>
          <p className="px-grid text-meta text-camera-muted">{t('location_is_saved_with_the_post_and')}</p>
          </>}
        </div>}</>}
        </div>
        {!forPost&&hasCaptureActions&& <div className={`max-h-[50%] shrink-0 overflow-y-auto bg-camera px-screen-x pt-sheet-top pb-card-safe ${desktop&&barcodeState==='idle'&&labelState==='idle'&&!error?'desktop:hidden':''}`} aria-label={t('capture_actions')}>
          {error && <p role="alert" className="mb-sheet-top text-detail text-surface">{error}</p>}
          {!searchingFoods && barcodeState === "idle" && mode !== "barcode" && labelState==="idle" && <>
            {pendingCount > 0 && <button type="button" disabled={posting || cameraBusy} onClick={() => { void continueSelected(); }} className="min-h-tap text-detail text-surface underline">{t('retry_selected_photos')}</button>}
            <Button variant="camera" onClick={post} disabled={voice.active || posting || cameraBusy || pendingCount > 0 || (!caption.trim() && shots.length === 0)}>{posting ? t('posting') : t('post')}</Button>
          </>}

          {labelState==="read"&&<Button variant="camera" disabled={posting||!Number.isFinite(labelServings)||labelServings<0.25||labelServings>50} onClick={()=>{void postLabel();}}>{posting?t('posting'):t('postServings',{count:labelServings})}</Button>}
          {product && <Button variant="camera" disabled={posting} onClick={() => { void postBarcode(); }}>{posting ? t('posting') : t('postProduct',{name:product.name.charAt(0).toUpperCase()+product.name.slice(1).toLowerCase().slice(0,23),amount:amountLabel(portion)})}</Button>}
        </div>}
      </div>
      {correcting&&product&&<CorrectProductSheet product={product as ResolvedProduct} onClose={()=>setCorrecting(false)} onSaved={()=>{setCorrecting(false);void fetch(`/api/fdc/barcode?code=${encodeURIComponent(product.gtin)}`).then(r=>r.json()).then(b=>{if(b.product)setProduct(b.product);}).catch(()=>setError(t('error_e3c527d0e169')));}}/>}
    </div>
  );
}

const CAPTURESHEET_ANIMATION_CSS_0 = `
              @keyframes barcode-scan { from { transform: translateY(0); } to { transform: translateY(158px); } }
              .barcode-scan-line { animation: barcode-scan 1.6s linear infinite; }
              @media (prefers-reduced-motion: reduce) { .barcode-scan-line { animation: none; top: 50%; } }
            `;

/* eslint-disable @next/next/no-img-element -- Private owner images bypass paid optimization. */
"use client";
import OpenFoodFactsAttribution from './OpenFoodFactsAttribution';
import {useDesktop} from "@/lib/ui/use-desktop";
import {lockBodyScroll} from '@/lib/ui/scroll-lock';
import {formatGtin} from "@/lib/fdc/gtin";
import CorrectProductSheet from "@/components/CorrectProductSheet";
import type { LabelReading } from "@/lib/meta/label";
import type { ResolvedProduct } from "@/lib/fdc/barcode-product";
import LightComposer from "@/components/LightComposer";
import type {CapturedLocation} from "@/lib/location/capture";
import { PackPhotoUpload } from "@/lib/media/pack-photo-upload";

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

type Shot = { file: File; previewUrl: string };
const MAX_SHOTS = 8;
const FLIP_ERROR = "Could not switch cameras. Try again.";

export type CaptureMode = "photo" | "text" | "barcode";
export default function CaptureSheet({ onClose, initialMode = "photo", forPost, attachNotEaten = false, initialFiles }: { onClose: () => void; initialMode?: CaptureMode; forPost?: string; attachNotEaten?: boolean; initialFiles?: File[] }) {
  const router = useRouter();
  const desktop=useDesktop();
  const [cameraAttempt,setCameraAttempt]=useState(0);
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
  const [barcodeState, setBarcodeState] = useState<"idle" | "looking" | "missing" | "found" | "error">("idle");
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
  const rejectedCode = useRef<{ code: string; lastSeen: number } | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [initialShots]=useState<Shot[]>(()=>resumed?.files.map(file=>({file,previewUrl:URL.createObjectURL(file)}))??[]);
  const shotsRef = useRef<Shot[]>(initialShots);
  const selectedPhotoRef = useRef(Boolean(resumed?.files.length));
  const pendingFilesRef = useRef<File[]>([]);
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
    if(packOperationRef.current){void uploadManager.remove(packOperationRef.current);packOperationRef.current=null;}
    setProduct(null); setBarcodeState("idle"); setPackPhoto(null); setError(null); setLabelState("idle");setLabelReading(null);setLabelForCode(null);
    if (packPhotoRef.current) URL.revokeObjectURL(packPhotoRef.current.previewUrl);
    packPhotoRef.current = null;
    if (!shotsRef.current.length && !pendingFilesRef.current.length) selectedPhotoRef.current = false;
  };

  const cameraEnabled = mode !== "text" && (!composer || takingPhoto);
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    if (!cameraEnabled) return () => { cancelled = true; mountedRef.current = false; };
    void loadBarcodeDecoder();
    const acquire=desktop&&deviceId?navigator.mediaDevices.getUserMedia({video:cameraVideoConstraints('user',deviceId),audio:false}).then(stream=>({stream,close(){stream.getTracks().forEach(track=>track.stop());},async flip(){return stream;}})):openCamera(desktop?'user':'environment');
    void acquire.then((camera) => {
      if (cancelled) { camera.close(); return; }
      liveCameraRef.current = camera;
      setCameraUnavailable(false); setStream(camera.stream);
      if(desktop)void navigator.mediaDevices.enumerateDevices().then(all=>{if(!cancelled)setDevices(all.filter(device=>device.kind==='videoinput'));}).catch(()=>{});
    }).catch(() => { if (!cancelled) {setCameraUnavailable(true);} });
    return () => {
      cancelled = true;
      mountedRef.current = false;
      liveCameraRef.current?.close();
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

  useEffect(() => {
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

  const readLabelFile = async(file:File)=>{
    setLabelState("reading");setError(null);
    if(packPhotoRef.current)URL.revokeObjectURL(packPhotoRef.current.previewUrl);
    const shot={file,previewUrl:URL.createObjectURL(file)};packPhotoRef.current=shot;setPackPhoto(shot);
    try{
      labelUploadRef.current??=new PackPhotoUpload();
      const photo=await labelUploadRef.current.prepare(file);labelPhotoRef.current=photo;
      const response=await fetch("/api/label/read",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({photo_path:photo.path})});
      const result=await response.json();if(!response.ok)throw Error(result.error??"The label could not be read.");
      if(!mountedRef.current)return;
      if(!result.reading.is_label||!result.reading.per_serving){setLabelState("missing");return;}
      if(!result.reading.serving){setLabelState("noServing");return;}
      setLabelReading(result);setLabelName("");setLabelServings(1);setLabelState("read");
      window.setTimeout(()=>document.getElementById("label-name")?.focus(),0);
    }catch(e){if(mountedRef.current){setLabelState("failed");setError(e instanceof Error?e.message:"The label could not be read.");}}
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
      if(!eatenAt||!packPhotoRef.current)throw new Error("Keep the label photo and choose a valid time eaten.");
      await uploadManager.postFood({label_reading_id:labelReading.reading_id,servings:labelServings,name:labelName,photo:{...labelPhotoRef.current},...(labelForCode?{gtin:labelForCode}:{}),eaten_at:eatenAt},labelName.trim()||"Packaged food",[packPhotoRef.current.file]);
      onClose();
    }catch(e){setError(e instanceof Error?e.message:"The meal could not be saved.");}finally{postingRef.current=false;setPosting(false);}
  };
  const attachmentUpload=useRef<PackPhotoUpload|null>(null);
  const attachFile=async(file:File)=>{
    if(!forPost)return false;
    postingRef.current=true;setPosting(true);setError(null);
    try{
      attachmentUpload.current??=new PackPhotoUpload();
      const photo=await attachmentUpload.current.prepare(file);
      const response=await fetch(`/api/posts/${forPost}/media`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({photo,not_eaten:attachmentIsLeftovers})});
      const result=await response.json();if(!response.ok)throw Error(result.error??"The photo could not be attached. Your photo was kept; try again.");
      window.dispatchEvent(new CustomEvent("post-created",{detail:{id:forPost}}));
      onClose();router.refresh();return true;
    }catch(e){if(mountedRef.current)setError(e instanceof Error?e.message:"The photo could not be attached. Your photo was kept; try again.");return false;}
    finally{postingRef.current=false;if(mountedRef.current)setPosting(false);}
  };
  const addFiles = async (files: FileList | File[] | null) => {
    if (!files || postingRef.current) return;
    if (Array.from(files).length) { selectedPhotoRef.current = true; window.dispatchEvent(new Event("capture-shot")); }
    pendingFilesRef.current.push(...Array.from(files).slice(0, Math.max(0, (forPost?1:MAX_SHOTS) - shotsRef.current.length - pendingFilesRef.current.length)));
    setPendingCount(pendingFilesRef.current.length);
    if (scanBusy.current) return;
    scanBusy.current = true; setCameraBusy(true);
    try {
      while (pendingFilesRef.current.length && shotsRef.current.length < MAX_SHOTS) {
        // Keep the in-flight file in the queue so another selection cannot exceed capacity.
        const file = pendingFilesRef.current[0];
        if(forPost){
          const attached=await attachFile(file);
          if(attached){pendingFilesRef.current.shift();setPendingCount(pendingFilesRef.current.length);}
          return;
        }
        if(labelForCode){
          pendingFilesRef.current.shift();setPendingCount(pendingFilesRef.current.length);
          await readLabelFile(file);return;
        }
        // Show the photo in the composer at once. A barcode in it is read
        // afterwards; when one is found the photo leaves the draft and the
        // barcode result opens, as before.
        shotsRef.current = [...shotsRef.current, { file, previewUrl: URL.createObjectURL(file) }];
        pendingFilesRef.current.shift(); setPendingCount(pendingFilesRef.current.length);
        operationRef.current=uploadManager.stage(shotsRef.current.map(shot=>shot.file),{caption,eatenAt:when===null?null:fromLocalInput(when),location:locationEnabled?location:null,options:{not_eaten_positions:notEaten,save_as_meal:saveAsMeal}},operationRef.current??undefined);setOperationId(operationRef.current);
        setShots(shotsRef.current);setPhotoIndex(shotsRef.current.length-1);setComposer(true);
        const shot = shotsRef.current[shotsRef.current.length - 1];
        let deadline: ReturnType<typeof setTimeout> | undefined;
        // Give React and the browser a paint before the decoder's CPU work.
        void new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
          .then(() => {
            if (!mountedRef.current || postingRef.current || !shotsRef.current.includes(shot)) return null;
            return Promise.race([decodeBarcodeFile(file), new Promise<null>((resolve) => { deadline = setTimeout(() => resolve(null), 900); })]);
          })
          .finally(() => clearTimeout(deadline))
          .then((code) => {
            if (!code || !mountedRef.current || postingRef.current) return;
            const index = shotsRef.current.indexOf(shot);
            if (index < 0) return;
            if(shotsRef.current.length===1&&operationRef.current){packOperationRef.current=operationRef.current;operationRef.current=null;setOperationId(null);}
            removeShot(index);
            if (!shotsRef.current.length) setComposer(false);
            void findBarcode(code, file);
          })
          .catch(() => {});
      }
    } catch { if (mountedRef.current) setError("Could not read that photo. Choose another photo."); }
    finally { scanBusy.current = false; if (mountedRef.current) setCameraBusy(false); }
  };

  const takePhoto = async () => {
    if (postingRef.current || cameraBusy || shotsRef.current.length >= MAX_SHOTS) return;
    if (!stream || !videoRef.current) { cameraRef.current?.click(); return; }
    setCameraBusy(true);setTakingPhoto(true);
    try {
      selectedPhotoRef.current = true;
      const blob = await grabFrame(videoRef.current,!forPost&&mode==='photo'?frame=>{
        if(mountedRef.current){setCameraPreview(frame);setComposer(true);}
      }:undefined,true);
      if (mountedRef.current) await addFiles([new File([blob], "meal.jpg", { type: blob.type || "image/jpeg" })]);
    } catch {
      if (mountedRef.current) {setError("Could not capture a photo. Try again or choose one from the gallery.");if(!forPost&&mode==='photo')setComposer(shotsRef.current.length>0);}
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

  const post = async () => {
    if (postingRef.current || cameraBusy || pendingFilesRef.current.length > 0 || (!caption.trim() && shotsRef.current.length === 0)) return;
    postingRef.current = true;
    setPosting(true);
    setError(null);
    try {
      const chosenLocation = locationEnabled ? location : null;
      const eatenAt = when === null ? null : fromLocalInput(when);
      if (when !== null && !eatenAt) throw new Error("Choose a time that is not in the future.");
      const id=uploadManager.stage(shotsRef.current.map(shot=>shot.file),{caption,location:chosenLocation,eatenAt,options:{not_eaten_positions:notEaten,save_as_meal:saveAsMeal}},operationRef.current??undefined);
      operationRef.current=id;setOperationId(id);if(!await uploadManager.post(id))throw new Error("The post could not be kept on this phone. Keep this screen open and try again.");onClose();router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Posting failed.");
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
      if(!eatenAt)throw new Error("Choose a valid time eaten.");
      await uploadManager.postFood({gtin:product.gtin,amount:portion,unit:product.basisUnit,eaten_at:eatenAt},product.name,[packPhotoRef.current.file],packOperationRef.current??undefined);
      packOperationRef.current=null;
      if (pendingFilesRef.current.length || shotsRef.current.length) {
        // A multi-selection is retained until the user explicitly continues it.
        postingRef.current = false; dismissBarcode(); setStream(null); setMode("text");setComposer(true);
        window.setTimeout(() => document.getElementById("capture-caption")?.focus(), 0);
      } else onClose();

    } catch (error) { if (mountedRef.current) setError(error instanceof Error ? error.message : "The meal could not be saved."); }
    finally { postingRef.current = false; if (mountedRef.current) setPosting(false); }
  };

  const labelNumber=(key:"kcal"|"protein_g"|"carbs_g"|"fat_g"|"fibre_g"|"sugar_g"|"sodium_mg",amount=labelServings)=>{const n=labelReading?.reading.per_serving?.[key];return n==null?"—":new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(n*amount);};
  const labelMacros=(amount=labelServings)=>`${labelNumber("kcal",amount)} kcal · ${labelNumber("protein_g",amount)} g protein · ${labelNumber("carbs_g",amount)} g carbs · ${labelNumber("fat_g",amount)} g fat`;
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
  const amountLabel = (amount: number) => product?.basisUnit === "ml" && amount >= 1000 && amount % 1000 === 0 ? `${amount / 1000} l` : `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(amount)} ${product?.basisUnit ?? "g"}`;
  const value = (key: "calories" | "protein_g" | "carbs_g" | "fat_g", amount: number) => {
    const nutrient = product?.per100g[key];
    return nutrient === null || nutrient === undefined ? "–" : formatNutrition(nutrient * amount / 100);
  };
  const macros = (amount: number) => `${value("calories", amount)} kcal · ${value("protein_g", amount)} g protein · ${value("carbs_g", amount)} g carbs · ${value("fat_g", amount)} g fat`;


  if(!forPost&&composer&&mode!=="barcode"&&barcodeState==="idle"&&labelState==="idle")return <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="capture-title" className="desktop-capture fixed inset-x-0 top-0 z-50 h-dvh overflow-hidden bg-surface" style={viewport?{height:viewport.height,top:viewport.top}:undefined}>
    <div className="desktop-capture-inner mx-auto h-full max-w-phone desktop:max-w-[760px]"><LightComposer cameraPreview={cameraPreview} upload={upload} shots={shots} caption={caption} setCaption={setCaption} index={photoIndex} setIndex={setPhotoIndex} notEaten={notEaten} setNotEaten={setNotEaten} when={when} setWhen={setWhen} locationEnabled={locationEnabled} setLocationEnabled={enableLocation} saveAsMeal={saveAsMeal} setSaveAsMeal={setSaveAsMeal} busy={posting||cameraBusy} error={error} pending={pendingCount} onBack={closeDraft} onPhoto={()=>{setSearchingFoods(false);setComposer(false);setMode("photo");setStream(null);}} onSearch={()=>setSearchingFoods(value=>!value)} onPost={()=>{void post();}} onRemove={removeShot}
      searchPanel={searchingFoods?<div className="px-inset"><FoodSearchPanel eatenAt={when===null?null:fromLocalInput(when)} disabled={posting} onQueued={()=>{if(operationRef.current)void uploadManager.remove(operationRef.current);onClose();}} onDescribe={text=>{if(text&&!caption.trim())setCaption(text);setSearchingFoods(false);setError(null);}} onError={setError}/></div>:null}>
      <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={event=>{void addFiles(event.target.files);event.target.value='';}}/>
    </LightComposer></div>
  </div>;

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="capture-title" className="desktop-capture fixed inset-x-0 top-0 z-50 h-dvh overflow-hidden bg-camera text-surface" style={viewport ? { height: viewport.height, top: viewport.top } : undefined}>
      <div data-round6-capture={!forPost||undefined} className="desktop-capture-inner desktop-camera-inner mx-auto flex h-full w-full max-w-phone flex-col desktop:max-w-[760px] desktop:bg-surface desktop:text-text">
        <div className="desktop-capture-heading shrink-0">
        <TopBar className={desktop&&!forPost?"desktop-capture-header":undefined}
          title={<span id="capture-title">{forPost?(attachmentIsLeftovers?"Leftovers":"Add photo"):"New post"}</span>}
          left={<button ref={closeRef} type="button" onClick={closeDraft} disabled={posting} aria-label="Back to Feed" className={`flex size-tap items-center justify-center disabled:opacity-50 ${desktop?"text-text":mode==="barcode"||barcodeState!=="idle"||labelState!=="idle"?"text-surface":"rounded-circle bg-field text-text"}`}><Icon name={desktop||mode==="barcode"||barcodeState!=="idle"||labelState!=="idle"?"close":"back"} size={22} /></button>}
          right={<span className="w-tap" aria-hidden="true" />}
        />
        </div>
        {desktop&&!forPost&&<div className={`desktop-drop-side ${dragging?'bg-field':''}`} onDragEnter={()=>setDragging(true)} onDragLeave={()=>setDragging(false)} onDrop={()=>setDragging(false)}><div className="flex flex-1 flex-col items-center justify-center gap-[14px] rounded-card border border-dashed border-ring"><Icon name="photo-add" size={28}/><p className="text-[14px] font-semibold">Or drop photos here</p><p className="text-[13px] text-muted">paste one with ⌘V</p><button className="h-[42px] rounded-field border border-text px-[18px] text-[14px] font-semibold" onClick={()=>galleryRef.current?.click()}>Choose files</button></div><p className="pt-4 text-[12px] leading-5 text-muted">Several photos become slides in one post, in the order chosen.</p></div>}
        <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain ${forPost?"desktop:!flex-auto":""}`} aria-label="Capture content">
        <div className="capture-hint px-screen-x"><FirstRunHint hint="capture" /></div>
        {forPost&&<div className="flex items-center justify-between gap-3 px-screen-x py-3"><span className="text-detail">Leftovers</span><button type="button" role="switch" aria-label="Leftovers" aria-checked={attachmentIsLeftovers} disabled={posting} onClick={()=>setAttachmentIsLeftovers(value=>!value)} className="min-h-11 rounded-pill bg-camera-field px-4 text-detail">{attachmentIsLeftovers?'On':'Off'}</button></div>}
        {mode !== "text" && <><div {...(!desktop?modeSwipe:{})} className={`desktop-viewfinder relative flex touch-pan-y items-center justify-center overflow-hidden bg-camera text-camera-muted ${labelState==="read"?"min-h-[180px] shrink":"shrink-0"} desktop:mx-6 desktop:!mt-0 ${labelState==="read"?"":forPost?"desktop:!h-[min(400px,calc(100dvh-300px))] desktop:shrink desktop:min-h-0":"desktop:h-[450px]"} desktop:rounded-card`} style={{ height: labelState==="read"?300:tokens.capture.previewHeight, marginTop: tokens.capture.previewTop }}>
          {labelState!=="idle"&&packPhoto ? <img src={packPhoto.previewUrl} alt="Photographed nutrition label" className="h-full w-full object-contain"/> : stream ? <video ref={videoRef} muted playsInline autoPlay aria-label="Live camera viewfinder" className="h-full w-full object-cover" /> : latest ? (
            // Local blob previews require no remote image transformation.
            <img src={latest.previewUrl} alt="Latest meal photo" className="h-full w-full object-cover" />
          ) : desktop&&forPost ? null : <Icon name="camera" />}
          {desktop&&(cameraUnavailable||forPost&&!stream&&!latest)&&<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
            {forPost&&!stream&&!latest&&<><p className="text-[14px] font-semibold">Drop a photo here</p><p className="text-[13px] text-white/70">or paste one with ⌘V</p><button type="button" disabled={posting} onClick={()=>galleryRef.current?.click()} className="h-[42px] rounded-field bg-white px-[18px] text-[14px] font-semibold text-text disabled:opacity-50">Choose a file</button></>}
            {cameraUnavailable&&<button type="button" onClick={()=>setCameraAttempt(value=>value+1)} className="rounded-field border border-white/40 px-5 py-3 text-[14px] text-white">Allow camera</button>}
          </div>}
          {desktop&&devices.length>0&&<select aria-label="Camera" value={deviceId||stream?.getVideoTracks()[0]?.getSettings().deviceId||''} onChange={event=>setDeviceId(event.target.value)} className="absolute left-[14px] top-[14px] h-[29px] max-w-[80%] rounded-field bg-overlay px-[10px] text-meta text-surface">{devices.map((device,index)=><option key={device.deviceId} value={device.deviceId}>{device.label||`Camera ${index+1}`}</option>)}</select>}
          {labelState==="read"&&<div aria-hidden="true" className="pointer-events-none absolute rounded-thumb border-2 border-accent" style={{left:`${(labelReading?.reading.box?.x??0)*100}%`,top:`${(labelReading?.reading.box?.y??0)*100}%`,width:`${(labelReading?.reading.box?.w??1)*100}%`,height:`${(labelReading?.reading.box?.h??1)*100}%`,boxShadow:`0 0 12px ${tokens.colors["accent-glow"]}`}}/>}
          {mode === "barcode" && <>
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[160px] w-[240px] -translate-x-1/2 -translate-y-1/2">
              <p className="absolute bottom-full left-1/2 mb-6 w-max max-w-[320px] -translate-x-1/2 rounded-pill bg-overlay px-[14px] py-[6px] text-center text-[15px] text-surface">Point at the barcode. It reads on its own.</p>
              {(["tl", "tr", "bl", "br"] as const).map(corner => <span key={corner} className="absolute size-6 border-white" style={{
                ...(corner.includes("t") ? { top: 0, borderTopWidth: 2 } : { bottom: 0, borderBottomWidth: 2 }),
                ...(corner.includes("l") ? { left: 0, borderLeftWidth: 2 } : { right: 0, borderRightWidth: 2 }),
              }} />)}
              {barcodeState !== "missing" && <span className="barcode-scan-line absolute inset-x-0 top-0 h-[2px] bg-accent" />}
            </div>
            {barcodeState === "missing" && <p className="absolute bottom-icon-small rounded-tile bg-overlay-dark px-tooltip-caret py-tooltip-offset text-detail text-surface">Code read · {formatGtin(scannedCode)}</p>}
            <style jsx>{`
              @keyframes barcode-scan { from { transform: translateY(0); } to { transform: translateY(158px); } }
              .barcode-scan-line { animation: barcode-scan 1.6s linear infinite; }
              @media (prefers-reduced-motion: reduce) { .barcode-scan-line { animation: none; top: 50%; } }
            `}</style>
          </>}
        </div>
        {!forPost&&<div className="relative shrink-0 pt-field-x desktop:hidden">
          {mode === "photo" && !labelForCode && barcodeState === "idle" && <div className="absolute inset-x-0 bottom-full flex justify-center"><FirstRunHint hint="modes" onTryBarcode={() => switchMode("barcode")} onVisibilityChange={setModesHintVisible} /></div>}
          <ModeStrip highlightBarcode={modesHintVisible} mode={mode} onChange={switchMode} disabled={Boolean(forPost) || Boolean(labelForCode) || barcodeState !== "idle" || posting} />
        </div>}</>}
        {desktop&&!forPost&&<div className="desktop-mode-strip"><ModeStrip mode={mode} onChange={switchMode} disabled={posting||barcodeState!=='idle'||labelState!=='idle'}/></div>}
        <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" disabled={posting || full} onChange={(event) => { void addFiles(event.target.files); event.target.value = ""; }} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" disabled={posting || full} onChange={(event) => { void addFiles(event.target.files); event.target.value = ""; }} />
        {(mode === "photo" || mode === "barcode") && barcodeState === "idle" && labelState === "idle" && <div className="desktop-shutter-row relative flex shrink-0 items-center justify-center" style={{ height: tokens.capture.controlsHeight, gap: tokens.capture.controlsGap }}>
          <button type="button" aria-label="Choose from library" disabled={posting || full} onClick={() => galleryRef.current?.click()} className={`${forPost?"":"desktop:hidden"} flex size-tap items-center justify-center rounded-circle bg-camera-button disabled:opacity-50`}><Icon name="camera" size={tokens.capture.galleryIcon} /></button>
          <button type="button" aria-label="Take a photo" disabled={posting || full || cameraBusy} onClick={takePhoto} className="desktop-shutter flex items-center justify-center rounded-circle border-surface disabled:opacity-50" style={{ width: tokens.capture.shutterSize, height: tokens.capture.shutterSize, borderWidth: tokens.capture.shutterBorder }}>
            {mode === "barcode" ? <BarcodeGlyph className="size-7 text-white opacity-50" /> : <span className="block rounded-circle bg-surface" style={{ width: tokens.capture.shutterDisc, height: tokens.capture.shutterDisc }} />}
          </button>
          {stream ? <button type="button" aria-label="Flip camera" disabled={posting || cameraBusy} onClick={flipCamera} className="desktop:hidden flex size-tap items-center justify-center rounded-circle bg-camera-button disabled:opacity-50"><Icon name="flip" size={tokens.capture.galleryIcon} /></button> : <span className="size-tap" aria-hidden="true" />}
          {desktop&&!composer&&labelState==='idle'&&<p className="absolute left-[calc(50%+48px)] flex items-center gap-2 whitespace-nowrap text-meta text-muted"><kbd className="flex h-[22px] items-center rounded-chip border border-line bg-white px-2 font-sans text-[11px] font-semibold text-text">Space</kbd>takes the photo</p>}
        </div>}
        {!forPost&&(mode === "text" || mode === "photo") && barcodeState === "idle" && labelState === "idle" && <div className="desktop:hidden flex shrink-0 overflow-x-auto px-screen-x" style={{ gap: tokens.capture.thumbGap }} aria-label="Meal photos">
          {shots.map((shot, i) => (
            <button key={shot.previewUrl} type="button" aria-label={`Remove photo ${i + 1}`} disabled={posting} onClick={() => removeShot(i)} className="relative shrink-0 overflow-hidden rounded-thumb disabled:opacity-50" style={{ width: tokens.capture.thumbSize, height: tokens.capture.thumbSize }}>
              
              <img src={shot.previewUrl} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <span className="absolute right-0 top-0 rounded-bl-chip bg-overlay p-grid"><Icon name="close" size={tokens.spacing['icon-small']} /></span>
            </button>
          ))}
          {!full && <button type="button" aria-label="Add another photo" disabled={posting} onClick={() => galleryRef.current?.click()} className="flex shrink-0 items-center justify-center rounded-thumb border border-dashed border-camera-muted text-camera-muted disabled:opacity-50" style={{ width: tokens.capture.thumbSize, height: tokens.capture.thumbSize }}><Icon name="plus" size={tokens.capture.addIcon} /></button>}
        </div>}
        <div className="min-h-card-gap flex-1 desktop:hidden" />
        {forPost?<div className="px-screen-x pb-card-safe text-detail">
          {posting&&<p role="status">Adding photo…</p>}{error&&<p role="alert">{error}</p>}
          {!posting&&pendingCount>0&&<button type="button" disabled={cameraBusy} onClick={()=>{void addFiles([]);}} className="min-h-tap underline">Retry adding photo</button>}
        </div>:<>{labelState!=="idle" ? <section aria-label="Nutrition label" className="shrink-0 rounded-t-sheet bg-text px-screen-x py-5 text-surface">
          {labelState==="reading"?<p role="status" className="text-body">Reading the label…</p>:labelState==="missing"||labelState==="noServing"||labelState==="failed"?<><p className="text-body">{labelState==="failed"?"The label could not be read. Try again.":labelState==="noServing"?"The serving weight or volume could not be read":"No nutrition label found"}</p><button type="button" onClick={()=>{setLabelState("idle");}} className="min-h-tap text-detail underline">Take the photo again</button><button type="button" onClick={typePackInstead} className="ml-4 min-h-tap text-detail underline">Type it instead</button></>:labelReading&&<>
          <div className="flex gap-3"><div className="min-w-0 flex-1"><p className="text-meta text-faint">Label read · per serving {labelReading.reading.serving?.amount} {labelReading.reading.serving?.unit}</p><Field id="label-name" variant="camera" autoFocus placeholder="Name this food" value={labelName} maxLength={80} onChange={e=>setLabelName(e.target.value)} disabled={posting}/><p className="mt-1.5 text-detail text-faint">{labelMacros(1)} · {labelNumber("fibre_g",1)} g fibre · {labelNumber("sugar_g",1)} g sugar · {labelNumber("sodium_mg",1)} mg sodium</p></div>{packPhoto&&<img src={packPhoto.previewUrl} alt="Nutrition label" className="size-14 rounded-thumb object-cover"/>}</div>
          <p className="mt-[18px] text-meta text-faint">How much?</p><div className="mt-2.5 flex flex-wrap gap-2">{[1,2,0.5].map(n=><button key={n} type="button" disabled={posting} onClick={()=>{setLabelServings(n);setOtherServings(false);}} aria-pressed={!otherServings&&labelServings===n} className={`h-10 rounded-field border px-3 text-comment font-medium ${!otherServings&&labelServings===n?"border-surface bg-surface text-text":"border-ring-on-ink"}`}>{n===0.5?"½ serving":`${n} ${n===1?"serving":"servings"}`}</button>)}<button type="button" onClick={()=>setOtherServings(true)} className="h-10 rounded-field border border-ring-on-ink px-3 text-comment">Other</button></div>
          {otherServings&&<Field variant="camera" aria-label="Number of servings" type="number" min="0.25" max="50" step="0.1" value={labelServings} onChange={e=>setLabelServings(Number(e.target.value))} disabled={posting}/>}
          <p className="mt-[18px] text-body">Consumed: {labelNumber("kcal")} kcal <span className="text-detail text-faint">· {labelMacros().split(" · ").slice(1).join(" · ")}</span></p><p className="mt-2.5 text-meta text-muted">Read by the model from the label. Values you change are kept with the post.</p>
          </>}
        </section> : (mode === "barcode" || barcodeState !== "idle") ? <section aria-label="Scanned product" className="relative shrink-0 rounded-t-sheet bg-text px-screen-x text-surface" style={{ paddingTop: tokens.spacing['screen-x'] - tokens.icon.strongStroke, paddingBottom: `calc(${tokens.brand.barHeight - tokens.radii.chip}px + env(safe-area-inset-bottom))` }}>
          {barcodeState !== "idle" && <button type="button" aria-label="Dismiss scanned product" disabled={posting} onClick={dismissBarcode} className="absolute right-screen-x top-sheet-top flex size-tap items-center justify-center"><Icon name="close" size={tokens.capture.galleryIcon} /></button>}
          {barcodeState === "idle" ? <><p className="text-body">{cameraUnavailable ? "Camera unavailable" : "Looking for a barcode…"}</p><p className="text-detail text-faint">{cameraUnavailable ? "Choose a photo containing a barcode." : "Hold the code steady in the frame"}</p></> : barcodeState === "looking" ? <p className="text-body" role="status">Looking it up…</p> : barcodeState === "missing" ? <><div className="flex items-start gap-3 pr-tap"><div className="min-w-0 flex-1"><p className="text-meta text-faint">Not in the database</p><p className="text-month">{formatGtin(scannedCode)}</p><p className="text-detail text-faint">No product for this code yet. Photograph the nutrition label and the pack becomes a post the same way.</p></div>{packPhoto&&<img src={packPhoto.previewUrl} alt="Scanned pack" className="size-14 shrink-0 rounded-thumb object-cover"/>}</div><Button variant="camera" className="flex items-center justify-center gap-2" onClick={()=>{setLabelForCode(scannedCode);setComposer(false);setMode("photo");setBarcodeState("idle");}}><Icon name="camera" size={18}/>Photograph the nutrition label</Button><button type="button" onClick={typePackInstead} className="mt-2 h-field-h w-full rounded-field border border-ring-on-ink text-body">Type it instead</button><button type="button" onClick={()=>{rejectedCode.current=null;dismissBarcode();}} className="min-h-tap w-full text-detail text-muted">Try the code again</button></> : null}
          {cameraUnavailable && mode === "barcode" && <div className="mt-sheet-top"><p role="status" className="text-detail text-faint">The camera could not be opened. Choose a photo from the library.</p><button type="button" disabled={posting || cameraBusy} onClick={() => galleryRef.current?.click()} className="min-h-tap text-detail underline">Choose from library</button></div>}
          {barcodeState === "idle" && pendingCount > 0 && <button type="button" disabled={posting || cameraBusy} onClick={() => { void continueSelected(); }} className="min-h-tap text-detail underline">Continue with {pendingCount} selected {pendingCount === 1 ? "photo" : "photos"}</button>}
          {product && <>
            <div className="flex gap-sheet-top pr-tap">
              <div className="min-w-0 flex-1"><p className="text-meta text-faint">Found</p><p className="text-month">{product.name}</p><button type="button" onClick={()=>setCorrecting(true)} className="text-detail underline">Correct</button><p className="text-detail text-faint">Per 100 {product.basisUnit} · {macros(100)}</p></div>
              
              {packPhoto && <img src={packPhoto.previewUrl} alt="Scanned pack" className="shrink-0 rounded-thumb object-cover" style={{ width: tokens.capture.thumbSize, height: tokens.capture.thumbSize }} />}
            </div>
            {product.attribution === "off" && <OpenFoodFactsAttribution/>}
            <p className="text-meta text-faint" style={{ marginTop: tokens.spacing['screen-x'] - tokens.icon.strongStroke }}>How much?</p>
            <div className="mt-tooltip-y flex flex-wrap gap-2">{barcodeAmounts(product).map((amount) => <button key={amount} type="button" disabled={posting} aria-pressed={portion === amount} onClick={() => setPortion(amount)} style={{ height: tokens.brand.barHeight }} className={`rounded-field border px-tooltip-caret text-comment font-medium ${portion === amount ? "border-surface bg-surface text-text" : "border-ring-on-ink text-surface"}`}>{pack === amount ? `Pack · ${amountLabel(amount)}` : amountLabel(amount)}</button>)}</div>
            <p className="text-body" style={{ marginTop: tokens.spacing['screen-x'] - tokens.icon.strongStroke }}>Consumed: {value("calories", portion)} kcal <span className="text-detail font-normal text-faint">· {macros(portion).split(" · ").slice(1).join(" · ")}</span></p>
          </>}
          {pendingCount + shots.length > 0 && <p className="mt-sheet-top text-detail text-faint">{pendingCount + shots.length} other selected {pendingCount + shots.length === 1 ? "photo is" : "photos are"} waiting. Post this product or dismiss it to continue.</p>}
        </section> : <div className="desktop:hidden flex flex-col px-screen-x pb-sheet-top" style={{ gap: tokens.capture.bottomGap }}>
          {pendingCount > 0 && <button type="button" disabled={posting || cameraBusy} onClick={() => { void continueSelected(); }} className="min-h-tap text-detail underline">Continue with {pendingCount} selected {pendingCount === 1 ? "photo" : "photos"}</button>}
          <div className="flex items-center justify-between px-grid text-detail">
            <label htmlFor="capture-when" className="text-camera-muted">When</label>
            <span className="flex items-center gap-2">
              {when === null
                ? <button id="capture-when" type="button" disabled={posting} onClick={() => setWhen(toLocalInput(new Date()))} className="min-h-tap text-surface disabled:opacity-50">Now ›</button>
                : <><input id="capture-when" type="datetime-local" value={when} max={toLocalInput(new Date())} disabled={posting} onChange={(event) => setWhen(event.target.value)} className="min-h-tap rounded-field bg-camera-button px-tooltip-x text-surface" /><button type="button" disabled={posting} onClick={() => setWhen(null)} className="min-h-tap text-camera-muted disabled:opacity-50">Now</button></>}
            </span>
          </div>
          {searchingFoods ? <FoodSearchPanel eatenAt={when === null ? null : fromLocalInput(when)} disabled={posting}
            onQueued={() => {  onClose(); }}
            onDescribe={(text) => { if (text && !caption.trim()) setCaption(text); setSearchingFoods(false); setError(null); }} onError={setError} /> : <>
          <Field variant="camera" id="capture-caption" aria-label="Caption" value={caption} onChange={(event) => setCaption(event.target.value)} disabled={posting} placeholder="What did you eat?" />
          <button type="button" disabled={posting} onClick={() => { setSearchingFoods(true); setError(null); }} className="min-h-tap self-start px-grid text-detail text-surface disabled:opacity-50">Search foods</button>
          <p className="px-grid text-meta text-camera-muted">Location is saved with the post and helps recognise meals you eat in the same place. Only you see it.</p>
          </>}
        </div>}</>}
        </div>
        {!forPost&&hasCaptureActions&& <div className={`max-h-[50%] shrink-0 overflow-y-auto bg-camera px-screen-x pt-sheet-top pb-card-safe ${desktop&&barcodeState==='idle'&&labelState==='idle'&&!error?'desktop:hidden':''}`} aria-label="Capture actions">
          {error && <p role="alert" className="mb-sheet-top text-detail text-surface">{error}</p>}
          {!searchingFoods && barcodeState === "idle" && mode !== "barcode" && labelState==="idle" && <>
            {pendingCount > 0 && <button type="button" disabled={posting || cameraBusy} onClick={() => { void continueSelected(); }} className="min-h-tap text-detail text-surface underline">Retry selected photos</button>}
            <Button variant="camera" onClick={post} disabled={posting || cameraBusy || pendingCount > 0 || (!caption.trim() && shots.length === 0)}>{posting ? "Posting…" : "Post"}</Button>
          </>}

          {labelState==="read"&&<Button variant="camera" disabled={posting||!Number.isFinite(labelServings)||labelServings<0.25||labelServings>50} onClick={()=>{void postLabel();}}>{posting?"Posting…":`Post · ${labelServings} ${labelServings===1?"serving":"servings"}`}</Button>}
          {product && <Button variant="camera" disabled={posting} onClick={() => { void postBarcode(); }}>{posting ? "Posting…" : `Post · ${product.name.charAt(0).toUpperCase() + product.name.slice(1).toLowerCase().slice(0, 23)} ${amountLabel(portion)}`}</Button>}
        </div>}
      </div>
      {correcting&&product&&<CorrectProductSheet product={product as ResolvedProduct} onClose={()=>setCorrecting(false)} onSaved={()=>{setCorrecting(false);void fetch(`/api/fdc/barcode?code=${encodeURIComponent(product.gtin)}`).then(r=>r.json()).then(b=>{if(b.product)setProduct(b.product);}).catch(()=>setError("The product could not be refreshed."));}}/>}
    </div>
  );
}

"use client";
import { useSyncExternalStore } from "react";
export type CameraMode = "app" | "phone";
const KEY = "mfa-camera-mode";
let temporaryMode: CameraMode | null = null;
const listeners = new Set<() => void>();
export function readCameraMode(): CameraMode { if(temporaryMode)return temporaryMode; try { return localStorage.getItem(KEY) === "phone" ? "phone" : "app"; } catch { return "app"; } }
// Persistence is optional; a refused write must not undo the selected camera.
export function writeCameraMode(mode: CameraMode): boolean {
 let saved=true;
 try { localStorage.setItem(KEY, mode); temporaryMode=null; }
 catch { temporaryMode=mode; saved=false; }
 for (const listener of listeners) listener();
 return saved;
}
const subscribe = (listener: () => void) => { listeners.add(listener); window.addEventListener("storage", listener); return () => { listeners.delete(listener); window.removeEventListener("storage", listener); }; };
export function useCameraMode(): CameraMode { return useSyncExternalStore(subscribe, readCameraMode, () => "app"); }

export function useCameraModeTemporary(): boolean { return useSyncExternalStore(subscribe,()=>temporaryMode!==null,()=>false); }
